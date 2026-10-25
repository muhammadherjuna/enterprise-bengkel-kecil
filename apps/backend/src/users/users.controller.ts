import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class CreateUserDto {
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(4, { message: 'Password minimal 4 karakter' })
  password: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class ResetPasswordDto {
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong' })
  @IsString()
  @MinLength(4, { message: 'Password minimal 4 karakter' })
  newPassword: string;
}

@Controller('users')
@Roles(Role.OWNER)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: users };
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') currentUserId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username sudah digunakan');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        name: dto.name,
        passwordHash,
        roles: dto.roles,
      },
      select: {
        id: true,
        username: true,
        name: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { username: user.username, roles: user.roles },
      },
    });

    return { success: true, message: 'Pengguna berhasil dibuat', data: user };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        roles: dto.roles,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        username: true,
        name: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'UPDATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: { ...dto } as any,
      },
    });

    return { success: true, message: 'Data pengguna berhasil diperbarui', data: updated };
  }

  @Put(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'RESET_PASSWORD',
        entityType: 'USER',
        entityId: user.id,
        details: { username: user.username },
      },
    });

    return { success: true, message: 'Password berhasil direset' };
  }
}
