import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('audit-logs')
@Roles(Role.OWNER)
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const where: any = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return { success: true, data: logs };
  }
}
