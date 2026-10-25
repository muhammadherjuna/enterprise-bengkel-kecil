import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateCustomerDto {
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class CreateVehicleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNotEmpty({ message: 'Plat nomor wajib diisi' })
  @IsString()
  plateNumber: string;

  @IsNotEmpty({ message: 'Merek motor wajib diisi (e.g. Honda, Yamaha)' })
  @IsString()
  brand: string;

  @IsNotEmpty({ message: 'Model motor wajib diisi (e.g. Vario 125, NMAX)' })
  @IsString()
  model: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        vehicles: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: customers };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: true,
        serviceOrders: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            items: true,
            vehicle: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');
    return { success: true, data: customer };
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: dto,
    });
    return { success: true, message: 'Pelanggan berhasil disimpan', data: customer };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Pelanggan tidak ditemukan');

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
    });
    return { success: true, message: 'Pelanggan berhasil diperbarui', data: updated };
  }
}

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query('search') search?: string, @Query('customerId') customerId?: string) {
    const where: any = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (search) {
      where.OR = [
        { plateNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return { success: true, data: vehicles };
  }

  // AC-18: Riwayat kendaraan (Menampilkan transaksi kendaraan yang benar)
  @Get(':id/history')
  async getVehicleHistory(@Param('id') id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Kendaraan tidak ditemukan');
    }

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: { vehicleId: id },
      include: {
        mechanic: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      success: true,
      data: {
        vehicle,
        history: serviceOrders,
      },
    };
  }

  @Post()
  async create(@Body() dto: CreateVehicleDto) {
    const normalizedPlate = dto.plateNumber.trim().toUpperCase();

    const vehicle = await this.prisma.vehicle.create({
      data: {
        customerId: dto.customerId,
        plateNumber: normalizedPlate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        notes: dto.notes,
      },
      include: {
        customer: true,
      },
    });

    return { success: true, message: 'Kendaraan berhasil didaftarkan', data: vehicle };
  }
}
