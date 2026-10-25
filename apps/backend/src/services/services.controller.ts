import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

class CreateServiceDto {
  @IsNotEmpty({ message: 'Kode jasa wajib diisi' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Nama jasa wajib diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNotEmpty({ message: 'Harga jasa wajib diisi' })
  @IsNumber()
  @Min(0, { message: 'Harga minimal 0' })
  price: number;
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@Controller('services')
export class ServicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('search') search?: string, @Query('category') category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const services = await this.prisma.service.findMany({
      where,
      orderBy: { code: 'asc' },
    });

    return { success: true, data: services };
  }

  @Post()
  @Roles(Role.OWNER, Role.KASIR)
  async create(@Body() dto: CreateServiceDto) {
    const existing = await this.prisma.service.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('Kode jasa sudah digunakan');
    }

    const service = await this.prisma.service.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        category: dto.category || 'Umum',
        price: dto.price,
      },
    });

    return { success: true, message: 'Jasa berhasil ditambahkan', data: service };
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.KASIR)
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Jasa tidak ditemukan');

    const updated = await this.prisma.service.update({
      where: { id },
      data: dto,
    });

    return { success: true, message: 'Data jasa berhasil diperbarui', data: updated };
  }
}
