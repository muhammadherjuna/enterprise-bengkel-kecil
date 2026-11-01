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

  async bulkImport(
    items: Array<{
      sku?: string;
      barcode?: string;
      name: string;
      category?: string;
      unit?: string;
      costPrice?: number;
      sellPrice?: number;
      initialStock?: number;
      minStock?: number;
    }>,
    updateExisting: boolean,
    userId: string,
  ) {
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      // Fetch all existing SKUs in one query for fast lookup
      const existingProducts = await tx.product.findMany({
        select: { id: true, sku: true, stock: true },
      });
      const existingMap = new Map<string, { id: string; stock: number }>();
      existingProducts.forEach((p) => existingMap.set(p.sku.toUpperCase(), p));

      let autoSkuIndex = existingProducts.length + 1;

      for (const item of items) {
        if (!item.name || !item.name.trim()) {
          skippedCount++;
          continue;
        }

        const name = item.name.trim();
        let sku = item.sku?.trim().toUpperCase();
        if (!sku) {
          sku = `PRD-${String(autoSkuIndex).padStart(4, '0')}`;
          while (existingMap.has(sku)) {
            autoSkuIndex++;
            sku = `PRD-${String(autoSkuIndex).padStart(4, '0')}`;
          }
          autoSkuIndex++;
        }

        const costPrice = Math.max(0, Number(item.costPrice) || 0);
        const sellPrice = Math.max(0, Number(item.sellPrice) || 0);
        const initialStock = Math.max(0, Math.floor(Number(item.initialStock) || 0));
        const minStock = Math.max(0, Math.floor(Number(item.minStock) || 5));
        const category = item.category?.trim() || 'Sparepart';
        const unit = item.unit?.trim() || 'Pcs';
        const barcode = item.barcode?.trim() || undefined;

        const existing = existingMap.get(sku);

        if (existing) {
          if (updateExisting) {
            await tx.product.update({
              where: { id: existing.id },
              data: {
                name,
                category,
                unit,
                costPrice,
                sellPrice,
                minStock,
                barcode: barcode || undefined,
              },
            });

            if (initialStock > 0 && initialStock !== existing.stock) {
              const diff = initialStock - existing.stock;
              await tx.product.update({
                where: { id: existing.id },
                data: { stock: initialStock },
              });
              await tx.stockMovement.create({
                data: {
                  productId: existing.id,
                  type: StockMovementType.ADJUSTMENT,
                  quantity: diff,
                  balanceBefore: existing.stock,
                  balanceAfter: initialStock,
                  reason: 'Penyesuaian stok via Import Excel',
                  referenceType: 'EXCEL_IMPORT',
                  userId,
                },
              });
            }

            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          const created = await tx.product.create({
            data: {
              sku,
              barcode,
              name,
              category,
              unit,
              costPrice,
              sellPrice,
              stock: initialStock,
              minStock,
            },
          });

          if (initialStock > 0) {
            await tx.stockMovement.create({
              data: {
                productId: created.id,
                type: StockMovementType.INITIAL,
                quantity: initialStock,
                balanceBefore: 0,
                balanceAfter: initialStock,
                reason: 'Stok awal via Import Excel',
                referenceType: 'EXCEL_IMPORT',
                userId,
              },
            });
          }

          existingMap.set(sku, { id: created.id, stock: initialStock });
          createdCount++;
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BULK_IMPORT_PRODUCTS',
          entityType: 'PRODUCT',
          details: {
            totalRows: items.length,
            createdCount,
            updatedCount,
            skippedCount,
          },
        },
      });
    });

    return { createdCount, updatedCount, skippedCount };
  }
}
