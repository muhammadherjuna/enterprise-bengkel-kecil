import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { WorkshopModule } from './workshop/workshop.module';
import { UsersModule } from './users/users.module';
import { MechanicsModule } from './mechanics/mechanics.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { SalesModule } from './sales/sales.module';
import { PaymentsModule } from './payments/payments.module';
import { FinanceModule } from './finance/finance.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkshopModule,
    UsersModule,
    MechanicsModule,
    CustomersModule,
    ServicesModule,
    ProductsModule,
    ServiceOrdersModule,
    SalesModule,
    PaymentsModule,
    FinanceModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
