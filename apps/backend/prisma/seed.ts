import { PrismaClient, Role, StockMovementType, CashType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BengkelOS database...');

  // 1. Workshop Settings
  await prisma.workshopSetting.deleteMany();
  const setting = await prisma.workshopSetting.create({
    data: {
      name: 'Bengkel Motor Berkah Jaya',
      address: 'Jl. Merdeka No. 45, Jakarta Timur',
      phone: '0812-3456-7890',
      receiptFooter: 'Terima kasih atas kepercayaan Anda. Garansi servis 7 hari kerja.',
    },
  });
  console.log('Workshop setting initialized:', setting.name);

  // 2. Users
  const passwordSalt = await bcrypt.genSalt(10);
  const ownerHash = await bcrypt.hash('owner123', passwordSalt);
  const kasirHash = await bcrypt.hash('kasir123', passwordSalt);

  await prisma.auditLog.deleteMany();
  await prisma.cashTransaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.serviceOrderItem.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.mechanic.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      username: 'owner',
      name: 'Haji Supardi',
      passwordHash: ownerHash,
      roles: [Role.OWNER, Role.KASIR],
    },
  });

  const kasir = await prisma.user.create({
    data: {
      username: 'kasir',
      name: 'Siti Rahma',
      passwordHash: kasirHash,
      roles: [Role.KASIR],
    },
  });

  console.log('Users created: owner, kasir');

  // 3. Mechanics
  const mechAgus = await prisma.mechanic.create({
    data: { name: 'Agus Santoso', phone: '0813-1111-2222', isActive: true },
  });
  const mechJoko = await prisma.mechanic.create({
    data: { name: 'Joko Pratama', phone: '0813-3333-4444', isActive: true },
  });

  // 4. Services
  const servicesData = [
    { code: 'SRV-01', name: 'Tune Up / Servis Ringan', category: 'Servis Ringan', price: 45000 },
    { code: 'SRV-02', name: 'Ganti Oli Mesin', category: 'Servis Ringan', price: 15000 },
    { code: 'SRV-03', name: 'Ganti Kampas Rem Depan', category: 'Pengereman', price: 20000 },
    { code: 'SRV-04', name: 'Ganti Kampas Rem Belakang', category: 'Pengereman', price: 25000 },
    { code: 'SRV-05', name: 'Servis & Bersih CVT Matic', category: 'Transmisi', price: 50000 },
    { code: 'SRV-06', name: 'Tambal Ban Tubeless', category: 'Roda & Ban', price: 15000 },
    { code: 'SRV-07', name: 'Turun Mesin (Overhaul)', category: 'Servis Berat', price: 350000 },
  ];

  for (const s of servicesData) {
    await prisma.service.create({ data: s });
  }
  console.log(`Created ${servicesData.length} master services`);

  // 5. Products & Initial Stock Movements
  const productsData = [
    { sku: 'OLI-MPX1', name: 'Oli AHM MPX 1 0.8L (Bebek/Sport)', category: 'Oli Mesin', unit: 'Botol', costPrice: 45000, sellPrice: 55000, stock: 20, minStock: 5 },
    { sku: 'OLI-MPX2', name: 'Oli AHM MPX 2 Matic 0.8L', category: 'Oli Mesin', unit: 'Botol', costPrice: 46000, sellPrice: 56000, stock: 25, minStock: 5 },
    { sku: 'OLI-GARDAN', name: 'Oli Gardan AHM Gear 120ml', category: 'Oli Transmisi', unit: 'Botol', costPrice: 12000, sellPrice: 18000, stock: 15, minStock: 5 },
    { sku: 'BUSI-CPR9', name: 'Busi NGK CPR9EA-9', category: 'Pengapian', unit: 'Pcs', costPrice: 15000, sellPrice: 25000, stock: 10, minStock: 3 },
    { sku: 'KAMPAS-VARIO', name: 'Kampas Rem Depan Vario / Beat', category: 'Pengereman', unit: 'Set', costPrice: 35000, sellPrice: 50000, stock: 8, minStock: 2 },
    { sku: 'BAN-TUB-9090', name: 'Ban Luar Tubeless 90/90-14 FDR', category: 'Roda & Ban', unit: 'Pcs', costPrice: 175000, sellPrice: 220000, stock: 4, minStock: 2 },
    { sku: 'VBELT-VARIO', name: 'Drive Belt / Vanbelt Kit Vario 125', category: 'Transmisi', unit: 'Set', costPrice: 110000, sellPrice: 145000, stock: 3, minStock: 2 },
  ];

  for (const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        type: StockMovementType.INITIAL,
        quantity: prod.stock,
        balanceBefore: 0,
        balanceAfter: prod.stock,
        reason: 'Stok awal sistem',
        referenceType: 'INITIAL',
        userId: owner.id,
      },
    });
  }
  console.log(`Created ${productsData.length} master products with initial stock movements`);

  // 6. Customers and Vehicles
  const cust1 = await prisma.customer.create({
    data: {
      name: 'Budi Santoso',
      phone: '0812-9988-7766',
      address: 'Jl. Melati No. 10',
    },
  });

  const veh1 = await prisma.vehicle.create({
    data: {
      customerId: cust1.id,
      plateNumber: 'B 4567 KAA',
      brand: 'Honda',
      model: 'Vario 125 FI',
      year: 2021,
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      name: 'Rudi Hartono',
      phone: '0857-1234-5678',
      address: 'Jl. Kenanga No. 5',
    },
  });

  await prisma.vehicle.create({
    data: {
      customerId: cust2.id,
      plateNumber: 'B 6789 BCD',
      brand: 'Yamaha',
      model: 'NMAX 155',
      year: 2022,
    },
  });

  // 7. Initial Cash Drawer Balance (Kas awal)
  await prisma.cashTransaction.create({
    data: {
      type: CashType.CASH_IN,
      category: 'MODAL_AWAL',
      amount: 500000,
      balanceBefore: 0,
      balanceAfter: 500000,
      description: 'Modal kas kasir awal hari',
      referenceType: 'MANUAL',
      userId: owner.id,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
