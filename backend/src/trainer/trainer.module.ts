import { Module } from '@nestjs/common';
import { TrainerController } from './trainer.controller';
import { TrainerService } from './trainer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [PrismaModule, SubscriptionModule],
  controllers: [TrainerController],
  providers: [TrainerService],
  exports: [TrainerService],
})
export class TrainerModule {}

