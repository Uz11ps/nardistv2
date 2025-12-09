import { Module } from '@nestjs/common';
import { GameGateway } from './gateways/game.gateway';
import { GameLogicService } from './services/game-logic.service';
import { GameRoomService } from './services/game-room.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  providers: [GameGateway, GameLogicService, GameRoomService],
  exports: [GameGateway, GameLogicService, GameRoomService],
})
export class GamesModule {}

