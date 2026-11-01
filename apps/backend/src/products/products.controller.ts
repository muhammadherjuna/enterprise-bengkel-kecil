import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, StockMovementType } from '@prisma/client';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

class CreateProductDto {
  @IsNotEmpty({ message: 'SKU produk wajib diisi' })
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNotEmpty({ message: 'Nama produk wajib diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNotEmpty({ message: 'Harga beli wajib diisi' })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNotEmpty({ message: 'Harga jual wajib diisi' })
  @IsNumber()
  @Min(0)
  sellPrice: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;
}

class UpdateProductDto {
  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class AdjustStockDto {
  @IsNotEmpty({ message: 'Stok baru wajib diisi' })
  @IsInt({ message: 'Stok harus berupa bilangan bulat' })
  @Min(0, { message: 'Stok tidak boleh negatif' })
  newStock: number;

  @IsNotEmpty({ message: 'Alasan penyesuaian wajib diisi' })
  @IsString()
  reason: string;
}

class BulkImportItemDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNotEmpty({ message: 'Nama produk wajib diisi' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @IsOptional()
  @IsInt()
  initialStock?: number;

  @IsOptional()
  @IsInt()
  minStock?: number;
}

class BulkImportDto {
  items: BulkImportItemDto[];
  updateExisting?: boolean;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    const products = await this.productsService.findAll({
      search,
      category,
      lowStockOnly: lowStockOnly === 'true',
    });
    return { success: true, data: products };
  }

  @Post('bulk-import')
  @Roles(Role.OWNER, Role.KASIR)
  async bulkImport(@Body() dto: BulkImportDto, @CurrentUser('id') userId: string) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Daftar produk tidak boleh kosong');
    }

    if (dto.items.length > 2000) {
      throw new BadRequestException('Maksimal import 2000 baris per file');
    }

    const result = await this.productsService.bulkImport(
      dto.items,
      dto.updateExisting ?? false,
      userId,
    );
    return {
      success: true,
      message: `Berhasil memproses import: ${result.createdCount} produk baru ditambahkan, ${result.updatedCount} diperbarui, ${result.skippedCount} dilewati`,
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return { success: true, data: product };
  }

  @Post()
  @Roles(Role.OWNER, Role.KASIR)
  async create(@Body() dto: CreateProductDto, @CurrentUser('id') userId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku.trim().toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException('SKU sudah terdaftar');
    }

    const initialStock = dto.initialStock ?? 0;

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: dto.sku.trim().toUpperCase(),
          barcode: dto.barcode,
          name: dto.name,
          category: dto.category || 'Sparepart',
          unit: dto.unit || 'Pcs',
          costPrice: dto.costPrice,
          sellPrice: dto.sellPrice,
          stock: initialStock,
          minStock: dto.minStock ?? 5,
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: created.id,
            type: StockMovementType.INITIAL,
            quantity: initialStock,
            balanceBefore: 0,
            balanceAfter: initialStock,
            reason: 'Stok awal barang baru',
            referenceType: 'INITIAL',
            userId,
          },
        });
      }

      return created;
    });

    return { success: true, message: 'Produk berhasil ditambahkan', data: product };
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.KASIR)
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
    });

    return { success: true, message: 'Data produk berhasil diperbarui', data: updated };
  }

  // Stock adjustment: restricted to OWNER
  @Post(':id/adjust')
  @Roles(Role.OWNER)
  async adjust(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId: string,
  ) {
    const updated = await this.productsService.adjustStock(
      id,
      dto.newStock,
      dto.reason,
      userId,
    );
    return { success: true, message: 'Stok berhasil disesuaikan', data: updated };
  }
}
