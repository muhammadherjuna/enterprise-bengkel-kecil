import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { PaymentStatus, StockMovementType, Role } from '@prisma/client';
import * as crypto from 'crypto';

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  price?: number;
}

export interface CreateSaleInput {
  customerId?: string;
  customerName?: string;
  discount?: number;
  notes?: string;
  items: CreateSaleItemDto[];
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  private async generateSaleNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = crypto.randomBytes(2).toString('hex').toUpperCase();

    const countToday = await this.prisma.sale.count({
      where: {
        saleNumber: { startsWith: `POS-${dateStr}` },
      },
    });

    const seq = (countToday + 1).toString().padStart(4, '0');
    return `POS-${dateStr}-${seq}-${rand}`;
  }

  async findAll(params: {
    paymentStatus?: PaymentStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (params.search) {
      where.OR = [
        { saleNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: {
          include: {
            receivedBy: { select: { name: true, username: true } },
          },
        },
      },
    });
    if (!sale) throw new NotFoundException('Penjualan langsung tidak ditemukan');
    return sale;
  }

  /**
   * Direct Sale (AC-10: Penjualan langsung, nota dan mutasi stok tercatat)
   * Also subject to AC-07 (insufficient stock rejected) and AC-15 (concurrency atomic safety)
   */
  async create(input: CreateSaleInput, userId: string) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Penjualan langsung harus memiliki minimal satu produk sparepart');
    }

    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsData: any[] = [];

      for (const item of input.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new BadRequestException('Jumlah item harus lebih dari 0');
        }

        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) {
          throw new NotFoundException(`Produk dengan ID ${item.productId} tidak ditemukan`);
        }

        const unitPrice = item.price !== undefined ? Number(item.price) : Number(prod.sellPrice);
        const costPrice = Number(prod.costPrice);
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;

        saleItemsData.push({
          productId: prod.id,
          productName: prod.name,
          quantity: item.quantity,
          price: unitPrice,
          costPrice,
          subtotal: itemSubtotal,
        });
      }

      // Deduct stock FIRST before header creation to fail immediately with 400 on race condition (AC-15)
      for (const item of saleItemsData) {
        await this.productsService.deductStockAtomic(
          tx,
          item.productId,
          item.quantity,
          StockMovementType.SALE,
          'SALE',
          undefined,
          userId,
          `Penjualan langsung`,
        );
      }

      const discount = Math.max(0, Number(input.discount || 0));
      const totalAmount = Math.max(0, subtotal - discount);
      const saleNumber = await this.generateSaleNumber();

      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerId: input.customerId || null,
          customerName: input.customerName || (input.customerId ? null : 'Pelanggan Umum'),
          paymentStatus: PaymentStatus.UNPAID,
          subtotal,
          discount,
          totalAmount,
          notes: input.notes || null,
          items: {
            create: saleItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // Update referenceId on movements
      await tx.stockMovement.updateMany({
        where: {
          referenceType: 'SALE',
          referenceId: null,
          userId,
        },
        data: {
          referenceId: sale.id,
          reason: `Penjualan langsung ${sale.saleNumber}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_SALE',
          entityType: 'SALE',
          entityId: sale.id,
          details: { saleNumber: sale.saleNumber, totalAmount, itemsCount: saleItemsData.length },
        },
      });

      return sale;
    });
  }

  /**
   * Cancel direct sale (AC-11: reverse stock movement and audit log)
   * If paid, only OWNER can cancel!
   */
  async cancel(id: string, reason: string, user: { id: string; roles: Role[] }) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Alasan pembatalan harus diisi');
    }

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true, payments: true },
      });
      if (!sale) throw new NotFoundException('Penjualan langsung tidak ditemukan');

      if (sale.paymentStatus === PaymentStatus.CANCELLED) {
        throw new BadRequestException('Penjualan ini sudah dibatalkan sebelumnya');
      }

      if (sale.paymentStatus === PaymentStatus.PAID) {
        if (!user.roles.includes(Role.OWNER)) {
          throw new ForbiddenException('Hanya Owner yang berwenang membatalkan transaksi yang telah lunas');
        }
      }

      // Return products to inventory with CANCELLATION_RETURN (AC-11)
      for (const item of sale.items) {
        await this.productsService.addStockAtomic(
          tx,
          item.productId,
          item.quantity,
          StockMovementType.CANCELLATION_RETURN,
          'SALE',
          sale.id,
          user.id,
          `Pengembalian stok pembatalan penjualan ${sale.saleNumber}: ${reason}`,
        );
      }

      // If paid, reverse payments and cash transactions
      if (sale.paymentStatus === PaymentStatus.PAID) {
        for (const p of sale.payments) {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: 'CANCELLED', notes: `Dibatalkan: ${reason}` },
          });

          const lastCash = await tx.cashTransaction.findFirst({
            orderBy: { createdAt: 'desc' },
          });
          const currentBal = lastCash ? Number(lastCash.balanceAfter) : 0;
          const payAmt = Number(p.amountTotal);
          const newBal = currentBal - payAmt;

          await tx.cashTransaction.create({
            data: {
              type: 'CASH_OUT',
              category: 'PEMBATALAN_TRANSAKSI',
              amount: payAmt,
              balanceBefore: currentBal,
              balanceAfter: newBal,
              description: `Pembalikan kas penjualan ${sale.saleNumber}: ${reason}`,
              referenceType: 'CANCELLATION',
              referenceId: sale.id,
              userId: user.id,
            },
          });
        }
      }

      const updated = await tx.sale.update({
        where: { id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          notes: sale.notes ? `${sale.notes} [BATAL: ${reason}]` : `[BATAL: ${reason}]`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CANCEL_TRANSACTION',
          entityType: 'SALE',
          entityId: sale.id,
          details: { saleNumber: sale.saleNumber, reason },
        },
      });

      return updated;
    });
  }
}
