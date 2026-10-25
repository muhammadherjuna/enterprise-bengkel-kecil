import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@Roles(Role.OWNER, Role.KASIR)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  async getDailyRecap(@Query('date') date?: string) {
    const data = await this.reportsService.getDailyRecap(date);
    return { success: true, data };
  }

  @Get('periodic')
  async getPeriodicReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const data = await this.reportsService.getPeriodicReport(startDate, endDate);
    return { success: true, data };
  }
}
