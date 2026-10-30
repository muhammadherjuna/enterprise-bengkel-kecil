import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { FinanceService, CreateExpenseInput } from './finance.service';
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

class CreateExpenseDto {
  @IsNotEmpty({ message: 'Kategori pengeluaran wajib diisi' })
  @IsString()
  category: string;

  @IsNotEmpty({ message: 'Nominal wajib diisi' })
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty({ message: 'Deskripsi wajib diisi' })
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsNotEmpty({ message: 'Metode pembayaran wajib dipilih' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

@Controller('finance')
@Roles(Role.OWNER, Role.KASIR)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('cash-ledger')
  async getCashLedger(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.financeService.getCashLedger({ startDate, endDate });
    return { success: true, data };
  }

  @Get('expenses')
  async getExpenses(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
  ) {
    const data = await this.financeService.getExpenses({ startDate, endDate, category });
    return { success: true, data };
  }

  @Post('expenses')
  @Roles(Role.OWNER) // Creating operational expenses is restricted to OWNER
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser('id') userId: string,
  ) {
    const expense = await this.financeService.createExpense(dto, userId);
    return { success: true, message: 'Pengeluaran berhasil dicatat', data: expense };
  }

  @Get('profit-estimate')
  @Roles(Role.OWNER) // Financial profit reports restricted to OWNER
  async getProfitEstimate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.financeService.getEstimatedProfitReport({ startDate, endDate });
    return { success: true, data };
  }
}
