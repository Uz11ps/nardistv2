import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { GameGateway } from './game.gateway';

@Module({
  controllers: [GamesController],
  providers: [GamesService, GameGateway],
  exports: [GamesService],
})
export class GamesModule {}
