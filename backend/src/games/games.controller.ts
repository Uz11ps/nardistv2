import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { GamesService } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post()
  async createGame(@Body() dto: CreateGameDto, @Request() req) {
    return this.gamesService.createGame(req.user.id, dto);
  }

  @Get()
  async getMyGames(@Request() req) {
    return this.gamesService.getUserGames(req.user.id);
  }

  @Get(':id')
  async getGame(@Param('id') id: string) {
    return this.gamesService.getGame(id);
  }
}
