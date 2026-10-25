import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashType, PaymentMethod, PaymentRecordStatus } from '@prisma/client';

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description: string;
  recipient?: string;
  paymentMethod: PaymentMethod;
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateExpenseNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `EXP-${dateStr}-`;

    const latest = await this.prisma.expense.findFirst({
      where: { expenseNumber: { startsWith: prefix } },
      orderBy: { expenseNumber: 'desc' },
    });

    let nextSeq = 1;
    if (latest) {
      const parts = latest.expenseNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  }

  async getCashLedger(params: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const transactions = await this.prisma.cashTransaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Current total cash drawer balance
    const last = await this.prisma.cashTransaction.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const currentBalance = last ? Number(last.balanceAfter) : 0;

    return {
      currentBalance,
      transactions,
    };
  }

  async getExpenses(params: { startDate?: string; endDate?: string; category?: string }) {
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createExpense(input: CreateExpenseInput, userId: string) {
    if (!input.amount || input.amount <= 0) {
      throw new BadRequestException('Nominal pengeluaran harus lebih besar dari 0');
    }
    if (!input.description || input.description.trim().length === 0) {
      throw new BadRequestException('Deskripsi pengeluaran harus diisi');
    }

    return this.prisma.$transaction(async (tx) => {
      const expenseNumber = await this.generateExpenseNumber();

      const expense = await tx.expense.create({
        data: {
          expenseNumber,
          category: input.category || 'OPERASIONAL',
          amount: input.amount,
          description: input.description,
          recipient: input.recipient || null,
          paymentMethod: input.paymentMethod || PaymentMethod.CASH,
          userId,
        },
      });

      // If paid via cash, deduct from cash ledger
      if (expense.paymentMethod === PaymentMethod.CASH) {
        const lastCash = await tx.cashTransaction.findFirst({
          orderBy: { createdAt: 'desc' },
        });
        const balanceBefore = lastCash ? Number(lastCash.balanceAfter) : 0;
        const balanceAfter = balanceBefore - Number(input.amount);

        await tx.cashTransaction.create({
          data: {
            type: CashType.CASH_OUT,
            category: expense.category,
            amount: input.amount,
            balanceBefore,
            balanceAfter,
            description: `Pengeluaran ${expense.expenseNumber}: ${expense.description}`,
            referenceType: 'EXPENSE',
            referenceId: expense.id,
            userId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_EXPENSE',
          entityType: 'EXPENSE',
          entityId: expense.id,
          details: { expenseNumber: expense.expenseNumber, amount: input.amount, category: expense.category },
        },
      });

      return expense;
    });
  }

  /**
   * FR-05: Laporan Laba Kotor Estimasi
   * Formula: Pendapatan (Servis + Sparepart) - HPP Sparepart (Cost snapshot)
   * Explicitly labeled as "Laba Kotor Estimasi" (not Laba Bersih)
   */
  async getEstimatedProfitReport(params: { startDate?: string; endDate?: string }) {
    const dateFilter: any = {};
    if (params.startDate || params.endDate) {
      dateFilter.date = {};
      if (params.startDate) dateFilter.date.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.lte = end;
      }
    }

    // 1. Total revenue from completed payments
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentRecordStatus.COMPLETED,
        ...dateFilter,
      },
      include: {
        serviceOrder: {
          include: {
            items: true,
          },
        },
        sale: {
          include: {
            items: true,
          },
        },
      },
    });

    let serviceRevenue = 0;
    let partsRevenue = 0;
    let partsCOGS = 0; // HPP Sparepart

    for (const p of payments) {
      if (p.serviceOrder) {
        serviceRevenue += Number(p.serviceOrder.subtotalServices);
        partsRevenue += Number(p.serviceOrder.subtotalProducts);
        // Cost of goods sold for service parts
        for (const item of p.serviceOrder.items) {
          if (item.itemType === 'PRODUCT') {
            partsCOGS += Number(item.costPrice) * item.quantity;
          }
        }
      } else if (p.sale) {
        partsRevenue += Number(p.sale.subtotal);
        for (const item of p.sale.items) {
          partsCOGS += Number(item.costPrice) * item.quantity;
        }
      }
    }

    const totalRevenue = serviceRevenue + partsRevenue;
    const estimatedGrossProfit = totalRevenue - partsCOGS;

    // Expenses during the same period
    const expenses = await this.prisma.expense.findMany({
      where: dateFilter,
    });
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return {
      period: {
        startDate: params.startDate || 'Semua waktu',
        endDate: params.endDate || 'Hari ini',
      },
      label: 'Laba Kotor Estimasi (Belum memperhitungkan biaya operasional & overhead secara akuntansi penuh)',
      serviceRevenue,
      partsRevenue,
      totalRevenue,
      partsCOGS,
      estimatedGrossProfit,
      totalExpenses,
      cashOnHand: (await this.getCashLedger({})).currentBalance,
    };
  }
}
