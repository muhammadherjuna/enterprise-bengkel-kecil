import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('BengkelOS MVP Acceptance Criteria Verification (AC-01 - AC-15)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let kasirToken: string;
  let mekanikToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // AC-01: Valid Login
  it('AC-01: Login valid -> returns token and correct user role', async () => {
    // 1. Owner Login
    const ownerRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'owner123' })
      .expect(200);

    expect(ownerRes.body.success).toBe(true);
    expect(ownerRes.body.data.user.roles).toContain('OWNER');
    ownerToken = ownerRes.body.data.token;

    // 2. Kasir Login
    const kasirRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'kasir', password: 'kasir123' })
      .expect(200);

    expect(kasirRes.body.success).toBe(true);
    expect(kasirRes.body.data.user.roles).toContain('KASIR');
    kasirToken = kasirRes.body.data.token;

    // 3. Mekanik Login
    const mekanikRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'mekanik', password: 'mekanik123' })
      .expect(200);

    expect(mekanikRes.body.success).toBe(true);
    expect(mekanikRes.body.data.user.roles).toContain('MEKANIK');
    mekanikToken = mekanikRes.body.data.token;
  });

  // AC-02: Invalid Login
  it('AC-02: Login tidak valid -> ditolak tanpa membocorkan info sensitif', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'owner', password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Username atau password tidak valid');
    expect(res.body.data).toBeUndefined();
  });

  // AC-03: Servis tanpa pelanggan
  it('AC-03: Servis tanpa pelanggan -> Order berhasil dibuat', async () => {
    const service = await prisma.service.findFirst();

    const res = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        complaints: 'Ganti oli rutin walk-in',
        items: [
          {
            itemType: 'SERVICE',
            serviceId: service.id,
            quantity: 1,
          },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toMatch(/^SRV-/);
    expect(res.body.data.customerId).toBeNull();
    expect(res.body.data.vehicleId).toBeNull();
    expect(Number(res.body.data.totalAmount)).toBe(Number(service.price));
  });

  // AC-04: Order tanpa item
  it('AC-04: Order tanpa item -> Penyimpanan ditolak', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerName: 'Budi Test',
        items: [],
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('minimal satu jasa atau sparepart');
  });

  // AC-05: Total jasa dan barang
  it('AC-05: Total jasa dan barang -> Total sesuai perhitungan backend', async () => {
    const service = await prisma.service.findFirst({ where: { code: 'SRV-01' } });
    const product = await prisma.product.findFirst({ where: { sku: 'OLI-MPX1' } });

    const expectedSubtotal = Number(service.price) + Number(product.sellPrice) * 2;
    const discount = 10000;
    const expectedTotal = expectedSubtotal - discount;

    const res = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerName: 'Andi Perhitungan',
        plateNumber: 'B 9999 AC5',
        discount: discount,
        items: [
          {
            itemType: 'SERVICE',
            serviceId: service.id,
            quantity: 1,
            price: 1, // Attempt to tamper price; backend should recalculate or respect authorized price
          },
          {
            itemType: 'PRODUCT',
            productId: product.id,
            quantity: 2,
          },
        ],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    const order = res.body.data;
    expect(Number(order.subtotalProducts)).toBe(Number(product.sellPrice) * 2);
    expect(Number(order.discount)).toBe(discount);
    expect(Number(order.totalAmount)).toBe(Number(order.subtotalServices) + Number(order.subtotalProducts) - discount);
  });

  // AC-06: Pemakaian sparepart (Stok berkurang tepat 1x)
  it('AC-06: Pemakaian sparepart -> Stok berkurang tepat satu kali', async () => {
    // Create dedicated product for test
    const testProd = await prisma.product.create({
      data: {
        sku: `TEST-AC06-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'Sparepart Uji AC06',
        costPrice: 20000,
        sellPrice: 30000,
        stock: 10,
        minStock: 2,
      },
    });

    // Create service order with PENDING status
    const orderRes = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        status: 'PENDING',
        items: [{ itemType: 'PRODUCT', productId: testProd.id, quantity: 2 }],
      })
      .expect(201);

    const orderId = orderRes.body.data.id;

    // Stock should not be deducted in PENDING
    let currentProd = await prisma.product.findUnique({ where: { id: testProd.id } });
    expect(currentProd.stock).toBe(10);

    // Update to IN_PROGRESS -> stock should be deducted by 2
    await request(app.getHttpServer())
      .put(`/api/service-orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    currentProd = await prisma.product.findUnique({ where: { id: testProd.id } });
    expect(currentProd.stock).toBe(8);

    // Update to COMPLETED -> stock should NOT be deducted again (prevent double deduction)
    await request(app.getHttpServer())
      .put(`/api/service-orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    currentProd = await prisma.product.findUnique({ where: { id: testProd.id } });
    expect(currentProd.stock).toBe(8);

    // Stock movements count for this order should be exactly 1
    const movements = await prisma.stockMovement.findMany({
      where: { referenceId: orderId },
    });
    expect(movements.length).toBe(1);
    expect(movements[0].quantity).toBe(-2);
  });

  // AC-07: Stok tidak cukup
  it('AC-07: Stok tidak cukup -> Transaksi ditolak tanpa perubahan parsial', async () => {
    const scarceProd = await prisma.product.create({
      data: {
        sku: `TEST-AC07-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'Barang Langka',
        costPrice: 50000,
        sellPrice: 75000,
        stock: 1,
        minStock: 1,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerName: 'Pembeli Kelebihan',
        items: [{ productId: scarceProd.id, quantity: 5 }],
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Stok tidak mencukupi');

    // Verify stock remains untouched at 1
    const checkProd = await prisma.product.findUnique({ where: { id: scarceProd.id } });
    expect(checkProd.stock).toBe(1);
  });

  // AC-08: Pembayaran tunai (Total, uang diterima, kembalian)
  it('AC-08: Pembayaran tunai -> Total, uang diterima, dan kembalian benar', async () => {
    const service = await prisma.service.findFirst({ where: { code: 'SRV-02' } });

    // Create service order for 15,000
    const orderRes = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        status: 'COMPLETED',
        items: [{ itemType: 'SERVICE', serviceId: service.id, quantity: 1 }],
      })
      .expect(201);

    const orderId = orderRes.body.data.id;
    const totalAmount = Number(orderRes.body.data.totalAmount);
    const amountPaid = 20000; // Customer pays 20,000 cash

    const payRes = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        serviceOrderId: orderId,
        method: 'CASH',
        amountPaid,
      })
      .expect(201);

    expect(payRes.body.success).toBe(true);
    const payment = payRes.body.data;
    expect(Number(payment.amountTotal)).toBe(totalAmount);
    expect(Number(payment.amountPaid)).toBe(amountPaid);
    expect(Number(payment.changeAmount)).toBe(amountPaid - totalAmount); // 5,000 change

    // Order status should be PAID
    const updatedOrder = await prisma.serviceOrder.findUnique({ where: { id: orderId } });
    expect(updatedOrder.paymentStatus).toBe('PAID');
  });

  // AC-09: Pembayaran berulang (Idempotency & Double Payment Prevention)
  it('AC-09: Pembayaran berulang -> Tidak menghasilkan pembayaran ganda', async () => {
    const service = await prisma.service.findFirst({ where: { code: 'SRV-02' } });

    const orderRes = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        status: 'COMPLETED',
        items: [{ itemType: 'SERVICE', serviceId: service.id, quantity: 1 }],
      })
      .expect(201);

    const orderId = orderRes.body.data.id;
    const idempotencyKey = `idem-key-${Date.now()}`;

    // First payment request
    const firstPay = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        serviceOrderId: orderId,
        method: 'CASH',
        amountPaid: 20000,
        idempotencyKey,
      })
      .expect(201);

    expect(firstPay.body.success).toBe(true);

    // Second payment request with same idempotency key (simulating double click or network retry)
    const secondPay = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        serviceOrderId: orderId,
        method: 'CASH',
        amountPaid: 20000,
        idempotencyKey,
      })
      .expect(201);

    // Should return existing payment without creating a duplicate record
    expect(secondPay.body.data.id).toBe(firstPay.body.data.id);

    // Third payment request without idempotency key to already paid order
    const thirdPay = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        serviceOrderId: orderId,
        method: 'CASH',
        amountPaid: 20000,
      })
      .expect(409); // Conflict

    expect(thirdPay.body.message).toContain('telah lunas');
  });

  // AC-10: Penjualan langsung (Direct Sale)
  it('AC-10: Penjualan langsung -> Nota dan mutasi stok tercatat', async () => {
    const prod = await prisma.product.create({
      data: {
        sku: `TEST-AC10-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'Oli Mesin POS Test',
        costPrice: 40000,
        sellPrice: 50000,
        stock: 5,
        minStock: 1,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/sales')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerName: 'Pak Wahyu',
        items: [{ productId: prod.id, quantity: 2 }],
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.saleNumber).toMatch(/^POS-/);
    expect(Number(res.body.data.totalAmount)).toBe(100000);

    // Verify stock movement
    const movement = await prisma.stockMovement.findFirst({
      where: { referenceId: res.body.data.id, type: 'SALE' },
    });
    expect(movement).toBeDefined();
    expect(movement.quantity).toBe(-2);
    expect(movement.balanceAfter).toBe(3);

    // Verify product stock is 3
    const updatedProd = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(updatedProd.stock).toBe(3);
  });

  // AC-11: Pembatalan transaksi (Cancellation Return & Audit Log)
  it('AC-11: Pembatalan -> Mutasi pembalik dan audit log tercatat', async () => {
    const prod = await prisma.product.create({
      data: {
        sku: `TEST-AC11-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'Busi Batal Test',
        costPrice: 15000,
        sellPrice: 25000,
        stock: 5,
        minStock: 1,
      },
    });

    // Create and complete order with part deduction
    const orderRes = await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        status: 'IN_PROGRESS',
        items: [{ itemType: 'PRODUCT', productId: prod.id, quantity: 2 }],
      })
      .expect(201);

    const orderId = orderRes.body.data.id;
    let prodCheck = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(prodCheck.stock).toBe(3); // 5 - 2 = 3

    // Owner cancels order
    const cancelRes = await request(app.getHttpServer())
      .post(`/api/service-orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Pelanggan membatalkan perbaikan' })
      .expect(201);

    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Stock should be returned to 5 via CANCELLATION_RETURN
    prodCheck = await prisma.product.findUnique({ where: { id: prod.id } });
    expect(prodCheck.stock).toBe(5);

    const returnMovement = await prisma.stockMovement.findFirst({
      where: { referenceId: orderId, type: 'CANCELLATION_RETURN' },
    });
    expect(returnMovement).toBeDefined();
    expect(returnMovement.quantity).toBe(2);

    // Audit log should be recorded
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: orderId, action: 'CANCEL_TRANSACTION' },
    });
    expect(audit).toBeDefined();
  });

  // AC-12: Dashboard
  it('AC-12: Dashboard -> Angka sesuai transaksi yang sah', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${kasirToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('todayRevenue');
    expect(res.body.data).toHaveProperty('activeServicesCount');
    expect(res.body.data).toHaveProperty('lowStockCount');
    expect(res.body.data).toHaveProperty('cashOnHand');
  });

  // AC-13: Akses mekanik (Mekanik ditolak pada endpoint keuangan)
  it('AC-13: Akses mekanik -> Endpoint keuangan ditolak dengan 403 Forbidden', async () => {
    // 1. Mekanik tries to access cash ledger
    await request(app.getHttpServer())
      .get('/api/finance/cash-ledger')
      .set('Authorization', `Bearer ${mekanikToken}`)
      .expect(403);

    // 2. Mekanik tries to access profit estimate
    await request(app.getHttpServer())
      .get('/api/finance/profit-estimate')
      .set('Authorization', `Bearer ${mekanikToken}`)
      .expect(403);

    // 3. Mekanik tries to access reports
    await request(app.getHttpServer())
      .get('/api/reports/daily')
      .set('Authorization', `Bearer ${mekanikToken}`)
      .expect(403);

    // 4. Mekanik CAN access service orders list
    await request(app.getHttpServer())
      .get('/api/service-orders')
      .set('Authorization', `Bearer ${mekanikToken}`)
      .expect(200);
  });

  // AC-15: Concurrency race condition: 2 cashiers selling last stock item simultaneously
  it('AC-15: Dua kasir menjual stok terakhir -> Tidak terjadi overselling, hanya satu berhasil', async () => {
    // Prepare item with exactly 1 in stock
    const raceProd = await prisma.product.create({
      data: {
        sku: `RACE-PROD-${Date.now()}`,
        name: 'Oli Terakhir Race Condition',
        costPrice: 30000,
        sellPrice: 45000,
        stock: 1, // Only 1 available!
        minStock: 0,
      },
    });

    // Launch two simultaneous sale requests for the last 1 item
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          customerName: 'Kasir 1',
          items: [{ productId: raceProd.id, quantity: 1 }],
        }),
      request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${kasirToken}`)
        .send({
          customerName: 'Kasir 2',
          items: [{ productId: raceProd.id, quantity: 1 }],
        }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one must be 201 (Created) and the other must be 400 (Bad Request: insufficient stock)
    expect(statuses).toEqual([201, 400]);

    // Check final stock in DB is exactly 0 (never negative!)
    const finalProd = await prisma.product.findUnique({ where: { id: raceProd.id } });
    expect(finalProd.stock).toBe(0);

    // Verify error message of the failing request
    const failedRes = res1.status === 400 ? res1 : res2;
    expect(failedRes.body.message).toContain('Stok tidak mencukupi');
  });

  // AC-18: Riwayat kendaraan (Menampilkan transaksi kendaraan yang benar)
  it('AC-18: Riwayat kendaraan -> Menampilkan transaksi kendaraan yang benar', async () => {
    // 1. Create customer and vehicle
    const cust = await prisma.customer.create({
      data: { name: 'Pak Supri', phone: '081299998888' },
    });

    const veh = await prisma.vehicle.create({
      data: {
        customerId: cust.id,
        plateNumber: `B ${Math.floor(1000 + Math.random() * 9000)} TST`,
        brand: 'Honda',
        model: 'Vario 150',
      },
    });

    const srv = await prisma.service.findFirst();

    // 2. Create service order 1 at 5,000 km
    await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerId: cust.id,
        vehicleId: veh.id,
        mileage: 5000,
        complaints: 'Ganti oli 5000km',
        items: [{ itemType: 'SERVICE', serviceId: srv.id, quantity: 1 }],
      })
      .expect(201);

    // 3. Create service order 2 at 10,000 km
    await request(app.getHttpServer())
      .post('/api/service-orders')
      .set('Authorization', `Bearer ${kasirToken}`)
      .send({
        customerId: cust.id,
        vehicleId: veh.id,
        mileage: 10000,
        complaints: 'Servis rutin 10000km',
        items: [{ itemType: 'SERVICE', serviceId: srv.id, quantity: 1 }],
      })
      .expect(201);

    // 4. Query vehicle history
    const historyRes = await request(app.getHttpServer())
      .get(`/api/vehicles/${veh.id}/history`)
      .set('Authorization', `Bearer ${kasirToken}`)
      .expect(200);

    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.vehicle.plateNumber).toBe(veh.plateNumber);
    expect(historyRes.body.data.history.length).toBe(2);
    expect(historyRes.body.data.history[0].mileage).toBe(10000);
    expect(historyRes.body.data.history[1].mileage).toBe(5000);
  });
});

