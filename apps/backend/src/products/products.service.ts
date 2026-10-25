import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockMovementType, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; lowStockOnly?: boolean }) {
    const where: any = {};
    if (query.category) {
      where.category = query.category;
    }
    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { barcode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (query.lowStockOnly) {
      return products.filter((p) => p.stock <= p.minStock);
    }

    return products;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { name: true, username: true } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return product;
  }

  /**
   * Atomic stock deduction supporting AC-07 & AC-15 (concurrency safe against overselling).
   * Ensures stock never goes below zero and generates stock_movement.
   */
  async deductStockAtomic(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    type: StockMovementType,
    referenceType?: string,
    referenceId?: string,
    userId?: string,
    reason?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Jumlah pengurangan stok harus lebih dari 0');
    }

    // Atomic update with condition `stock >= quantity`
    const updatedProducts: Array<{ id: string; name: string; stock: number; costPrice: any; sellPrice: any }> =
      await tx.$queryRaw`
        UPDATE products
        SET stock = stock - ${quantity}, "updatedAt" = NOW()
        WHERE id = ${productId} AND stock >= ${quantity}
        RETURNING id, name, stock, "costPrice", "sellPrice"
      `;

    if (!updatedProducts || updatedProducts.length === 0) {
      // Fetch current stock to give clear error message
      const current = await tx.product.findUnique({ where: { id: productId } });
      if (!current) {
        throw new NotFoundException(`Produk dengan ID ${productId} tidak ditemukan`);
      }
      throw new BadRequestException(
        `Stok tidak mencukupi untuk produk "${current.name}". Tersedia: ${current.stock}, diminta: ${quantity}`,
      );
    }

    const updated = updatedProducts[0];
    const balanceBefore = updated.stock + quantity;
    const balanceAfter = updated.stock;

    // Create stock movement ledger entry
    await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity: -quantity,
        balanceBefore,
        balanceAfter,
        reason: reason || `${type} referensi ${referenceType || ''} ${referenceId || ''}`,
        referenceType,
        referenceId,
        userId,
      },
    });

    return updated;
  }

  /**
   * Atomic stock addition (for cancellation returns, initial stock, adjustments).
   */
  async addStockAtomic(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    type: StockMovementType,
    referenceType?: string,
    referenceId?: string,
    userId?: string,
    reason?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Jumlah penambahan stok harus lebih dari 0');
    }

    const updatedProducts: Array<{ id: string; name: string; stock: number }> =
      await tx.$queryRaw`
        UPDATE products
        SET stock = stock + ${quantity}, "updatedAt" = NOW()
        WHERE id = ${productId}
        RETURNING id, name, stock
      `;

    if (!updatedProducts || updatedProducts.length === 0) {
      throw new NotFoundException(`Produk dengan ID ${productId} tidak ditemukan`);
    }

    const updated = updatedProducts[0];
    const balanceBefore = updated.stock - quantity;
    const balanceAfter = updated.stock;

    await tx.stockMovement.create({
      data: {
        productId,
        type,
        quantity: quantity,
        balanceBefore,
        balanceAfter,
        reason: reason || `${type} referensi ${referenceType || ''} ${referenceId || ''}`,
        referenceType,
        referenceId,
        userId,
      },
    });

    return updated;
  }

  async adjustStock(
    productId: string,
    newStock: number,
    reason: string,
    userId: string,
  ) {
    if (newStock < 0) {
      throw new BadRequestException('Stok fisik tidak boleh bernilai negatif');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('Produk tidak ditemukan');

      const diff = newStock - product.stock;
      if (diff === 0) {
        return product;
      }

      const balanceBefore = product.stock;
      const balanceAfter = newStock;

      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: StockMovementType.ADJUSTMENT,
          quantity: diff,
          balanceBefore,
          balanceAfter,
          reason: reason || 'Penyesuaian stok manual (Stock Opname)',
          referenceType: 'MANUAL_ADJUSTMENT',
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'ADJUST_STOCK',
          entityType: 'PRODUCT',
          entityId: productId,
          details: {
            sku: product.sku,
            name: product.name,
            oldStock: balanceBefore,
            newStock: balanceAfter,
            diff,
            reason,
          },
        },
      });

      return updated;
    });
  }
}
