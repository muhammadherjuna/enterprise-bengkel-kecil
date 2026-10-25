import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class UpdateWorkshopSettingDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  receiptFooter?: string;
}

@Controller('workshop')
export class WorkshopController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getSettings() {
    let setting = await this.prisma.workshopSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.workshopSetting.create({
        data: {
          name: 'Bengkel Motor',
          receiptFooter: 'Terima kasih atas kunjungan Anda.',
        },
      });
    }
    return { success: true, data: setting };
  }

  @Put()
  @Roles(Role.OWNER)
  async updateSettings(@Body() dto: UpdateWorkshopSettingDto) {
    let setting = await this.prisma.workshopSetting.findFirst();
    if (!setting) {
      setting = await this.prisma.workshopSetting.create({
        data: dto,
      });
    } else {
      setting = await this.prisma.workshopSetting.update({
        where: { id: setting.id },
        data: dto,
      });
    }
    return { success: true, message: 'Profil bengkel berhasil diperbarui', data: setting };
  }
}
