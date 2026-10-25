import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentMethod,
  PaymentRecordStatus,
  PaymentStatus,
  CashType,
} from '@prisma/client';

export interface ProcessPaymentInput {
  serviceOrderId?: string;
  saleId?: string;
  method: PaymentMethod;
  amountPaid: number; // Tendered amount
  idempotencyKey?: string;
  notes?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generatePaymentNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PAY-${dateStr}-`;

    const latest = await this.prisma.payment.findFirst({
      where: { paymentNumber: { startsWith: prefix } },
      orderBy: { paymentNumber: 'desc' },
    });

    let nextSeq = 1;
    if (latest) {
      const parts = latest.paymentNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  }

  async findAll(params: {
    startDate?: string;
    endDate?: string;
    method?: PaymentMethod;
  }) {
    const where: any = {};
    if (params.method) where.method = params.method;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        serviceOrder: true,
        sale: true,
        receivedBy: { select: { id: true, name: true, username: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        serviceOrder: {
          include: {
            customer: true,
            vehicle: true,
            mechanic: true,
            items: true,
          },
        },
        sale: {
          include: {
            customer: true,
            items: true,
          },
        },
        receivedBy: { select: { id: true, name: true, username: true } },
        cashTransaction: true,
      },
    });
    if (!payment) throw new NotFoundException('Pembayaran tidak ditemukan');
    return payment;
  }

  /**
   * Process payment with:
   * - Full payment enforcement
   * - Change calculation (AC-08)
   * - Idempotency key & double payment prevention (AC-09)
   * - Cash ledger recording (cash_transactions)
   */
  async processPayment(input: ProcessPaymentInput, userId: string) {
    if (!input.serviceOrderId && !input.saleId) {
      throw new BadRequestException('Harus menentukan serviceOrderId atau saleId untuk pembayaran');
    }
    if (input.serviceOrderId && input.saleId) {
      throw new BadRequestException('Hanya boleh menentukan salah satu dari serviceOrderId atau saleId');
    }

    // Check idempotency key first if provided (AC-09)
    if (input.idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: {
          serviceOrder: true,
          sale: true,
          receivedBy: { select: { id: true, name: true, username: true } },
        },
      });
      if (existing) {
        // Return existing payment idempotently
        return existing;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      let billAmount = 0;
      let targetType: 'SERVICE' | 'SALE';
      let referenceCode = '';

      if (input.serviceOrderId) {
        targetType = 'SERVICE';
        const order = await tx.serviceOrder.findUnique({
          where: { id: input.serviceOrderId },
        });
        if (!order) throw new NotFoundException('Order servis tidak ditemukan');
        if (order.status === 'CANCELLED') {
          throw new BadRequestException('Order servis telah dibatalkan');
        }
        if (order.paymentStatus === PaymentStatus.PAID) {
          throw new ConflictException('Order servis ini telah lunas sebelumnya (AC-09)');
        }
        billAmount = Number(order.totalAmount);
        referenceCode = order.orderNumber;
      } else {
        targetType = 'SALE';
        const sale = await tx.sale.findUnique({
          where: { id: input.saleId },
        });
        if (!sale) throw new NotFoundException('Penjualan langsung tidak ditemukan');
        if (sale.paymentStatus === PaymentStatus.CANCELLED) {
          throw new BadRequestException('Penjualan langsung telah dibatalkan');
        }
        if (sale.paymentStatus === PaymentStatus.PAID) {
          throw new ConflictException('Penjualan langsung ini telah lunas sebelumnya (AC-09)');
        }
        billAmount = Number(sale.totalAmount);
        referenceCode = sale.saleNumber;
      }

      const tendered = Number(input.amountPaid);
      if (tendered < billAmount) {
        throw new BadRequestException(
          `Uang diterima (${tendered.toLocaleString('id-ID')}) kurang dari total tagihan (${billAmount.toLocaleString('id-ID')}). MVP hanya mendukung pelunasan penuh.`,
        );
      }

      // AC-08: Kembalian benar
      const changeAmount = input.method === PaymentMethod.CASH ? tendered - billAmount : 0;
      const paymentNumber = await this.generatePaymentNumber();

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          idempotencyKey: input.idempotencyKey || null,
          serviceOrderId: input.serviceOrderId || null,
          saleId: input.saleId || null,
          method: input.method,
          amountTotal: billAmount,
          amountPaid: tendered,
          changeAmount,
          status: PaymentRecordStatus.COMPLETED,
          notes: input.notes || null,
          receivedById: userId,
        },
      });

      // Update target invoice status to PAID
      if (input.serviceOrderId) {
        await tx.serviceOrder.update({
          where: { id: input.serviceOrderId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
      } else if (input.saleId) {
        await tx.sale.update({
          where: { id: input.saleId },
          data: { paymentStatus: PaymentStatus.PAID },
        });
      }

      // Record in cash ledger (cash_transactions)
      const lastCash = await tx.cashTransaction.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      const balanceBefore = lastCash ? Number(lastCash.balanceAfter) : 0;
      const balanceAfter = balanceBefore + billAmount;

      await tx.cashTransaction.create({
        data: {
          type: CashType.CASH_IN,
          category: targetType === 'SERVICE' ? 'PEMBAYARAN_SERVIS' : 'PENJUALAN_SPAREPART',
          amount: billAmount,
          balanceBefore,
          balanceAfter,
          description: `Pembayaran ${referenceCode} via ${input.method}`,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          paymentId: payment.id,
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_RECEIVED',
          entityType: 'PAYMENT',
          entityId: payment.id,
          details: {
            paymentNumber: payment.paymentNumber,
            billAmount,
            tendered,
            changeAmount,
            method: input.method,
            target: referenceCode,
          },
        },
      });

      return payment;
    });
  }
}
