import { Module } from '@nestjs/common';
import { GameHistoryController } from './game-history.controller';
import { GameHistoryService } from './game-history.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GameHistoryController],
  providers: [GameHistoryService],
  exports: [GameHistoryService],
})
export class GameHistoryModule {}

