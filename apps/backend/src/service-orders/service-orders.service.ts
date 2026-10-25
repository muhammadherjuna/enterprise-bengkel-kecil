import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import {
  ServiceOrderStatus,
  PaymentStatus,
  OrderItemType,
  StockMovementType,
  Role,
} from '@prisma/client';

export interface CreateOrderItemDto {
  itemType: 'SERVICE' | 'PRODUCT';
  serviceId?: string;
  productId?: string;
  name?: string;
  quantity: number;
  price?: number;
}

export interface CreateServiceOrderInput {
  customerId?: string;
  customerName?: string;
  vehicleId?: string;
  plateNumber?: string;
  brand?: string;
  model?: string;
  mechanicId?: string;
  complaints?: string;
  mileage?: number;
  discount?: number;
  notes?: string;
  items: CreateOrderItemDto[];
  status?: ServiceOrderStatus;
}

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SRV-${dateStr}-`;

    const latest = await this.prisma.serviceOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });

    let nextSeq = 1;
    if (latest) {
      const parts = latest.orderNumber.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
  }

  async findAll(params: {
    status?: ServiceOrderStatus;
    paymentStatus?: PaymentStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
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
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
        { vehicle: { plateNumber: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.serviceOrder.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        items: true,
        payments: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.serviceOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        mechanic: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
        payments: {
          include: {
            receivedBy: { select: { name: true, username: true } },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Order servis tidak ditemukan');
    return order;
  }

  /**
   * Create Service Order
   * AC-03: Servis tanpa pelanggan (Order berhasil dibuat)
   * AC-04: Order tanpa item (Penyimpanan ditolak)
   * AC-05: Total jasa dan barang dihitung ulang di backend + price snapshot
   */
  async create(input: CreateServiceOrderInput, userId: string) {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Order servis harus memiliki minimal satu jasa atau sparepart (AC-04)');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve Customer if provided or new
      let resolvedCustomerId = input.customerId;
      if (!resolvedCustomerId && input.customerName && input.customerName.trim().length > 0) {
        const newCust = await tx.customer.create({
          data: { name: input.customerName.trim() },
        });
        resolvedCustomerId = newCust.id;
      }

      // 2. Resolve Vehicle if provided or new
      let resolvedVehicleId = input.vehicleId;
      if (!resolvedVehicleId && input.plateNumber && input.plateNumber.trim().length > 0) {
        const cleanPlate = input.plateNumber.trim().toUpperCase();
        // Check if vehicle exists
        let existingVeh = await tx.vehicle.findFirst({
          where: { plateNumber: cleanPlate },
        });
        if (!existingVeh) {
          existingVeh = await tx.vehicle.create({
            data: {
              plateNumber: cleanPlate,
              brand: input.brand || 'Honda',
              model: input.model || 'Motor',
              customerId: resolvedCustomerId,
            },
          });
        }
        resolvedVehicleId = existingVeh.id;
      }

      // 3. Process items with snapshots & backend calculation (AC-05)
      let subtotalServices = 0;
      let subtotalProducts = 0;
      const orderItemsData: any[] = [];

      for (const item of input.items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new BadRequestException('Jumlah item harus lebih dari 0');
        }

        if (item.itemType === 'SERVICE') {
          if (!item.serviceId) {
            throw new BadRequestException('ID Jasa harus diisi untuk item jasa');
          }
          const srv = await tx.service.findUnique({ where: { id: item.serviceId } });
          if (!srv) throw new NotFoundException(`Jasa dengan ID ${item.serviceId} tidak ditemukan`);

          const price = item.price !== undefined ? Number(item.price) : Number(srv.price);
          const itemSubtotal = price * item.quantity;
          subtotalServices += itemSubtotal;

          orderItemsData.push({
            itemType: OrderItemType.SERVICE,
            serviceId: srv.id,
            name: srv.name,
            quantity: item.quantity,
            price,
            costPrice: 0,
            subtotal: itemSubtotal,
          });
        } else if (item.itemType === 'PRODUCT') {
          if (!item.productId) {
            throw new BadRequestException('ID Sparepart harus diisi untuk item sparepart');
          }
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod) throw new NotFoundException(`Sparepart dengan ID ${item.productId} tidak ditemukan`);

          const price = item.price !== undefined ? Number(item.price) : Number(prod.sellPrice);
          const costPrice = Number(prod.costPrice);
          const itemSubtotal = price * item.quantity;
          subtotalProducts += itemSubtotal;

          orderItemsData.push({
            itemType: OrderItemType.PRODUCT,
            productId: prod.id,
            name: prod.name,
            quantity: item.quantity,
            price,
            costPrice,
            subtotal: itemSubtotal,
          });
        }
      }

      const discount = Math.max(0, Number(input.discount || 0));
      const totalAmount = Math.max(0, subtotalServices + subtotalProducts - discount);
      const orderNumber = await this.generateOrderNumber();
      const initialStatus = input.status || ServiceOrderStatus.PENDING;

      const order = await tx.serviceOrder.create({
        data: {
          orderNumber,
          customerId: resolvedCustomerId || null,
          vehicleId: resolvedVehicleId || null,
          mechanicId: input.mechanicId || null,
          complaints: input.complaints || null,
          status: initialStatus,
          paymentStatus: PaymentStatus.UNPAID,
          mileage: input.mileage ? Number(input.mileage) : null,
          subtotalServices,
          subtotalProducts,
          discount,
          totalAmount,
          notes: input.notes || null,
          partsDeducted: false,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
          vehicle: true,
        },
      });

      // Deduct stock if starting in IN_PROGRESS or COMPLETED (AC-06)
      if (initialStatus === ServiceOrderStatus.IN_PROGRESS || initialStatus === ServiceOrderStatus.COMPLETED) {
        for (const item of orderItemsData) {
          if (item.itemType === OrderItemType.PRODUCT && item.productId) {
            await this.productsService.deductStockAtomic(
              tx,
              item.productId,
              item.quantity,
              StockMovementType.SERVICE_USE,
              'SERVICE_ORDER',
              order.id,
              userId,
              `Pemakaian order servis ${order.orderNumber}`,
            );
          }
        }
        await tx.serviceOrder.update({
          where: { id: order.id },
          data: { partsDeducted: true },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_SERVICE',
          entityType: 'SERVICE_ORDER',
          entityId: order.id,
          details: { orderNumber: order.orderNumber, totalAmount, status: order.status },
        },
      });

      return order;
    });
  }

  /**
   * Update Service Order status
   * Transitions: PENDING -> IN_PROGRESS -> COMPLETED
   * Prevents double stock deduction (AC-06).
   */
  async updateStatus(id: string, newStatus: ServiceOrderStatus, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order servis tidak ditemukan');

      if (order.status === ServiceOrderStatus.CANCELLED) {
        throw new BadRequestException('Order yang sudah dibatalkan tidak dapat diubah statusnya');
      }

      if (newStatus === ServiceOrderStatus.CANCELLED) {
        throw new BadRequestException('Untuk membatalkan order, gunakan aksi pembatalan khusus');
      }

      // Deduct spareparts stock if moving to IN_PROGRESS or COMPLETED and not yet deducted
      if (
        (newStatus === ServiceOrderStatus.IN_PROGRESS || newStatus === ServiceOrderStatus.COMPLETED) &&
        !order.partsDeducted
      ) {
        for (const item of order.items) {
          if (item.itemType === OrderItemType.PRODUCT && item.productId) {
            await this.productsService.deductStockAtomic(
              tx,
              item.productId,
              item.quantity,
              StockMovementType.SERVICE_USE,
              'SERVICE_ORDER',
              order.id,
              userId,
              `Pemakaian servis ${order.orderNumber}`,
            );
          }
        }
        await tx.serviceOrder.update({
          where: { id },
          data: { status: newStatus, partsDeducted: true },
        });
      } else {
        await tx.serviceOrder.update({
          where: { id },
          data: { status: newStatus },
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_SERVICE_STATUS',
          entityType: 'SERVICE_ORDER',
          entityId: order.id,
          details: { oldStatus: order.status, newStatus },
        },
      });

      return tx.serviceOrder.findUnique({
        where: { id },
        include: { items: true, customer: true, vehicle: true, mechanic: true },
      });
    });
  }

  /**
   * Cancel Service Order (AC-11: reverse stock movement and audit log)
   * If paid, only OWNER can cancel!
   */
  async cancelOrder(id: string, reason: string, user: { id: string; roles: Role[] }) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Alasan pembatalan harus diisi');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.findUnique({
        where: { id },
        include: { items: true, payments: true },
      });
      if (!order) throw new NotFoundException('Order servis tidak ditemukan');

      if (order.status === ServiceOrderStatus.CANCELLED) {
        throw new BadRequestException('Order servis ini sudah dibatalkan sebelumnya');
      }

      // If already paid, only OWNER is authorized
      if (order.paymentStatus === PaymentStatus.PAID) {
        if (!user.roles.includes(Role.OWNER)) {
          throw new ForbiddenException('Hanya Owner yang berwenang membatalkan transaksi yang telah lunas');
        }
      }

      // Return spareparts to inventory if they were deducted (AC-11)
      if (order.partsDeducted) {
        for (const item of order.items) {
          if (item.itemType === OrderItemType.PRODUCT && item.productId) {
            await this.productsService.addStockAtomic(
              tx,
              item.productId,
              item.quantity,
              StockMovementType.CANCELLATION_RETURN,
              'SERVICE_ORDER',
              order.id,
              user.id,
              `Pengembalian stok pembatalan servis ${order.orderNumber}: ${reason}`,
            );
          }
        }
      }

      // If there were payments, mark payment as CANCELLED and reverse cash transaction
      if (order.paymentStatus === PaymentStatus.PAID) {
        for (const p of order.payments) {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: 'CANCELLED', notes: `Dibatalkan: ${reason}` },
          });

          // Create reversing cash transaction
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
              description: `Pembalikan pembayaran order ${order.orderNumber}: ${reason}`,
              referenceType: 'CANCELLATION',
              referenceId: order.id,
              userId: user.id,
            },
          });
        }
      }

      const updated = await tx.serviceOrder.update({
        where: { id },
        data: {
          status: ServiceOrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.CANCELLED,
          partsDeducted: false,
          notes: order.notes ? `${order.notes} [BATAL: ${reason}]` : `[BATAL: ${reason}]`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CANCEL_TRANSACTION',
          entityType: 'SERVICE_ORDER',
          entityId: order.id,
          details: { orderNumber: order.orderNumber, reason, wasPaid: order.paymentStatus === PaymentStatus.PAID },
        },
      });

      return updated;
    });
  }
}
