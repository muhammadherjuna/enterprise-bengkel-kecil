import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentRecordStatus, ServiceOrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyRecap(targetDateStr?: string) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Payments completed on that day
    const payments = await this.prisma.payment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: PaymentRecordStatus.COMPLETED,
      },
      include: {
        serviceOrder: { include: { customer: true, vehicle: true } },
        sale: { include: { customer: true } },
        receivedBy: { select: { id: true, name: true, username: true } },
      },
      orderBy: { date: 'asc' },
    });

    const totalRevenue = payments.reduce((acc, p) => acc + Number(p.amountTotal), 0);
    const servicePayments = payments.filter((p) => p.serviceOrderId);
    const salePayments = payments.filter((p) => p.saleId);

    const serviceRevenue = servicePayments.reduce((acc, p) => acc + Number(p.amountTotal), 0);
    const saleRevenue = salePayments.reduce((acc, p) => acc + Number(p.amountTotal), 0);

    // Expenses on that day
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { date: 'asc' },
    });

    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // Cancelled transactions on that day (audit transparency)
    const cancelledOrders = await this.prisma.serviceOrder.findMany({
      where: {
        status: ServiceOrderStatus.CANCELLED,
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { customer: true, vehicle: true },
    });

    const cancelledSales = await this.prisma.sale.findMany({
      where: {
        paymentStatus: PaymentStatus.CANCELLED,
        updatedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: { customer: true },
    });

    return {
      date: startOfDay.toISOString().slice(0, 10),
      summary: {
        totalRevenue,
        serviceRevenue,
        saleRevenue,
        totalExpenses,
        netCashFlow: totalRevenue - totalExpenses,
        transactionCount: payments.length,
        cancelledCount: cancelledOrders.length + cancelledSales.length,
      },
      details: {
        payments,
        expenses,
        cancelledOrders,
        cancelledSales,
      },
    };
  }

  async getPeriodicReport(startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: PaymentRecordStatus.COMPLETED,
      },
      include: {
        serviceOrder: { include: { customer: true, vehicle: true, items: true } },
        sale: { include: { customer: true, items: true } },
      },
      orderBy: { date: 'desc' },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    let serviceRevenue = 0;
    let saleRevenue = 0;
    let partsCOGS = 0;

    for (const p of payments) {
      if (p.serviceOrder) {
        serviceRevenue += Number(p.serviceOrder.subtotalServices);
        saleRevenue += Number(p.serviceOrder.subtotalProducts);
        for (const item of p.serviceOrder.items) {
          if (item.itemType === 'PRODUCT') {
            partsCOGS += Number(item.costPrice) * item.quantity;
          }
        }
      } else if (p.sale) {
        saleRevenue += Number(p.sale.subtotal);
        for (const item of p.sale.items) {
          partsCOGS += Number(item.costPrice) * item.quantity;
        }
      }
    }

    const totalRevenue = serviceRevenue + saleRevenue;
    const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
    const estimatedGrossProfit = totalRevenue - partsCOGS;

    return {
      period: {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      },
      metrics: {
        serviceRevenue,
        saleRevenue,
        totalRevenue,
        partsCOGS,
        estimatedGrossProfit,
        totalExpenses,
        completedTransactions: payments.length,
      },
      transactions: payments,
      expenses,
    };
  }
}
