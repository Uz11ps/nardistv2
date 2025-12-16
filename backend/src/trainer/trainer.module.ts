import { Module } from '@nestjs/common';
import { TrainerController } from './trainer.controller';
import { TrainerService } from './trainer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SubscriptionModule, AuthModule],
  controllers: [TrainerController],
  providers: [TrainerService],
  exports: [TrainerService],
})
export class TrainerModule {}

