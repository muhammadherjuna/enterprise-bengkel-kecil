import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit.controller';

@Module({
  controllers: [AuditLogsController],
})
export class AuditModule {}
