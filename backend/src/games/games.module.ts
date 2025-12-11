import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameLogicService } from './services/game-logic.service';
import { GameRoomService } from './services/game-room.service';
import { MatchmakingService } from './services/matchmaking.service';
import { BotService } from './services/bot.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { GameHistoryModule } from '../game-history/game-history.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, RedisModule, GameHistoryModule, UsersModule],
  providers: [GameGateway, GameLogicService, GameRoomService, MatchmakingService, BotService],
  exports: [GameGateway, GameLogicService, GameRoomService, MatchmakingService, BotService],
})
export class GamesModule {}

