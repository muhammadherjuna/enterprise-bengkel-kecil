import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from '@nestjs/common';
import { PaymentsService, ProcessPaymentInput } from './payments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, PaymentMethod } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

class ProcessPaymentDto {
  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsOptional()
  @IsString()
  saleId?: string;

  @IsNotEmpty({ message: 'Metode pembayaran wajib dipilih' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNotEmpty({ message: 'Nominal yang dibayar wajib diisi' })
  @IsNumber()
  @Min(0)
  amountPaid: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('payments')
@Roles(Role.OWNER, Role.KASIR)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('method') method?: PaymentMethod,
  ) {
    const payments = await this.paymentsService.findAll({ startDate, endDate, method });
    return { success: true, data: payments };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentsService.findOne(id);
    return { success: true, data: payment };
  }

  @Post()
  async processPayment(
    @Body() dto: ProcessPaymentDto,
    @CurrentUser('id') userId: string,
    @Headers('x-idempotency-key') headerIdempotencyKey?: string,
  ) {
    const idempotencyKey = dto.idempotencyKey || headerIdempotencyKey;
    const payment = await this.paymentsService.processPayment(
      {
        ...dto,
        idempotencyKey,
      },
      userId,
    );
    return {
      success: true,
      message: 'Pembayaran berhasil diproses',
      data: payment,
    };
  }
}
