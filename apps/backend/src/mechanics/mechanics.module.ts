import { Module } from '@nestjs/common';
import { MechanicsController } from './mechanics.controller';

@Module({
  controllers: [MechanicsController],
})
export class MechanicsModule {}
