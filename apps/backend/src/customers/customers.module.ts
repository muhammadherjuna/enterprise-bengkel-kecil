import { Module } from '@nestjs/common';
import { CustomersController, VehiclesController } from './customers.controller';

@Module({
  controllers: [CustomersController, VehiclesController],
})
export class CustomersModule {}
