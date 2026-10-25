import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ServiceOrdersService,
  CreateOrderItemDto,
} from './service-orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ServiceOrderStatus, PaymentStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemInputDto {
  @IsNotEmpty()
  @IsString()
  itemType: 'SERVICE' | 'PRODUCT';

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}

class CreateServiceOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  mechanicId?: string;

  @IsOptional()
  @IsString()
  complaints?: string;

  @IsOptional()
  @IsNumber()
  mileage?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;
}

class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(ServiceOrderStatus)
  status: ServiceOrderStatus;
}

class CancelOrderDto {
  @IsNotEmpty({ message: 'Alasan pembatalan harus diisi' })
  @IsString()
  reason: string;
}

@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  async findAll(
    @Query('status') status?: ServiceOrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const orders = await this.serviceOrdersService.findAll({
      status,
      paymentStatus,
      search,
      startDate,
      endDate,
    });
    return { success: true, data: orders };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const order = await this.serviceOrdersService.findOne(id);
    return { success: true, data: order };
  }

  @Post()
  async create(
    @Body() dto: CreateServiceOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    const order = await this.serviceOrdersService.create(dto, userId);
    return { success: true, message: 'Order servis berhasil dibuat', data: order };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    const updated = await this.serviceOrdersService.updateStatus(id, dto.status, userId);
    return { success: true, message: 'Status order berhasil diperbarui', data: updated };
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    const cancelled = await this.serviceOrdersService.cancelOrder(id, dto.reason, user);
    return { success: true, message: 'Order servis berhasil dibatalkan', data: cancelled };
  }
}
