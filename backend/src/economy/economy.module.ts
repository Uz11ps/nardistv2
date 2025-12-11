import { Module } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}

