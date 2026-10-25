import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PaymentStatus } from '@prisma/client';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SaleItemInputDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}

class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInputDto)
  items: SaleItemInputDto[];
}

class CancelSaleDto {
  @IsNotEmpty({ message: 'Alasan pembatalan harus diisi' })
  @IsString()
  reason: string;
}

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const sales = await this.salesService.findAll({
      paymentStatus,
      search,
      startDate,
      endDate,
    });
    return { success: true, data: sales };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const sale = await this.salesService.findOne(id);
    return { success: true, data: sale };
  }

  @Post()
  async create(
    @Body() dto: CreateSaleDto,
    @CurrentUser('id') userId: string,
  ) {
    const sale = await this.salesService.create(dto, userId);
    return { success: true, message: 'Penjualan berhasil dibuat', data: sale };
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelSaleDto,
    @CurrentUser() user: any,
  ) {
    const cancelled = await this.salesService.cancel(id, dto.reason, user);
    return { success: true, message: 'Penjualan berhasil dibatalkan', data: cancelled };
  }
}
