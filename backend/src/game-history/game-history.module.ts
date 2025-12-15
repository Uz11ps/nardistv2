import { Module } from '@nestjs/common';
import { GameHistoryController } from './game-history.controller';
import { GameHistoryService } from './game-history.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EconomyModule } from '../economy/economy.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { SiegesModule } from '../sieges/sieges.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [PrismaModule, EconomyModule, InventoryModule, AuthModule, SiegesModule, SubscriptionModule],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}