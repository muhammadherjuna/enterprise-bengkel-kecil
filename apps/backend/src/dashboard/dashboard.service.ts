import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ServiceOrderStatus,
  PaymentStatus,
  PaymentRecordStatus,
} from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * AC-12: Dashboard metrics matching valid transactions
   */
  async getDashboardSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Payments completed today
    const todayPayments = await this.prisma.payment.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: PaymentRecordStatus.COMPLETED,
      },
      include: {
        serviceOrder: true,
        sale: true,
      },
    });

    const todayRevenue = todayPayments.reduce(
      (sum, p) => sum + Number(p.amountTotal),
      0,
    );

    const todayCashPayments = todayPayments
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amountTotal), 0);

    const todayTransferPayments = todayPayments
      .filter((p) => p.method === 'TRANSFER')
      .reduce((sum, p) => sum + Number(p.amountTotal), 0);

    const todayQrisPayments = todayPayments
      .filter((p) => p.method === 'QRIS_MANUAL')
      .reduce((sum, p) => sum + Number(p.amountTotal), 0);

    // 2. Active services: PENDING or IN_PROGRESS
    const activeServicesCount = await this.prisma.serviceOrder.count({
      where: {
        status: { in: [ServiceOrderStatus.PENDING, ServiceOrderStatus.IN_PROGRESS] },
      },
    });

    const pendingServicesCount = await this.prisma.serviceOrder.count({
      where: { status: ServiceOrderStatus.PENDING },
    });

    const inProgressServicesCount = await this.prisma.serviceOrder.count({
      where: { status: ServiceOrderStatus.IN_PROGRESS },
    });

    const completedServicesTodayCount = await this.prisma.serviceOrder.count({
      where: {
        status: ServiceOrderStatus.COMPLETED,
        updatedAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // 3. Direct sales today
    const directSalesTodayCount = await this.prisma.sale.count({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        paymentStatus: PaymentStatus.PAID,
      },
    });

    // 4. Low stock products (stock <= minStock)
    const allProducts = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, sku: true, name: true, stock: true, minStock: true, unit: true },
    });
    const lowStockProducts = allProducts.filter((p) => p.stock <= p.minStock);

    // 5. Recent 5 active service orders
    const recentActiveServices = await this.prisma.serviceOrder.findMany({
      where: {
        status: { in: [ServiceOrderStatus.PENDING, ServiceOrderStatus.IN_PROGRESS] },
      },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        items: true,
      },
      orderBy: { date: 'asc' },
      take: 5,
    });

    // 6. Cash drawer balance
    const lastCashTx = await this.prisma.cashTransaction.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const cashOnHand = lastCashTx ? Number(lastCashTx.balanceAfter) : 0;

    return {
      todayRevenue,
      todayCashPayments,
      todayTransferPayments,
      todayQrisPayments,
      todayTransactionsCount: todayPayments.length,
      activeServicesCount,
      pendingServicesCount,
      inProgressServicesCount,
      completedServicesTodayCount,
      directSalesTodayCount,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.slice(0, 5),
      cashOnHand,
      recentActiveServices,
    };
  }
}
