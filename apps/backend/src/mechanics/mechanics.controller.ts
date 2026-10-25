import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateMechanicDto {
  @IsNotEmpty({ message: 'Nama mekanik wajib diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class UpdateMechanicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('mechanics')
export class MechanicsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const mechanics = await this.prisma.mechanic.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: mechanics };
  }

  @Post()
  @Roles(Role.OWNER, Role.KASIR)
  async create(@Body() dto: CreateMechanicDto) {
    const mechanic = await this.prisma.mechanic.create({
      data: {
        name: dto.name,
        phone: dto.phone,
      },
    });
    return { success: true, message: 'Mekanik berhasil ditambahkan', data: mechanic };
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.KASIR)
  async update(@Param('id') id: string, @Body() dto: UpdateMechanicDto) {
    const mechanic = await this.prisma.mechanic.findUnique({ where: { id } });
    if (!mechanic) throw new NotFoundException('Mekanik tidak ditemukan');

    const updated = await this.prisma.mechanic.update({
      where: { id },
      data: dto,
    });
    return { success: true, message: 'Data mekanik berhasil diperbarui', data: updated };
  }
}
