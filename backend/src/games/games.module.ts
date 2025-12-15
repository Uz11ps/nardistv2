import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GamesController } from './games.controller';
import { GameLogicService } from './services/game-logic.service';
import { GameRoomService } from './services/game-room.service';
import { MatchmakingService } from './services/matchmaking.service';
import { BotService } from './services/bot.service';
import { RngService } from './services/rng.service';
import { FreeTablesService } from './services/free-tables.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { GameHistoryModule } from '../game-history/game-history.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, RedisModule, GameHistoryModule, UsersModule, PrismaModule],
  controllers: [GamesController],
  providers: [GameGateway, GameLogicService, GameRoomService, MatchmakingService, BotService, RngService, FreeTablesService],
  exports: [GameGateway, GameLogicService, GameRoomService, MatchmakingService, BotService, RngService, FreeTablesService],
})
export class GamesModule {}

