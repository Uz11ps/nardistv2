import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GameHistoryService } from './game-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDto } from '../auth/dto/user.dto';

@Controller('game-history')
@UseGuards(JwtAuthGuard)
export class GameHistoryController {
  constructor(private readonly gameHistoryService: GameHistoryService) {}

  @Get()
  async getHistory(
    @CurrentUser() user: UserDto,
    @Query('limit') limit: string = '50',
  ) {
    return this.gameHistoryService.getUserHistory(user.id, parseInt(limit, 10));
  }

  @Get(':id')
  async getReplay(@Param('id') id: string) {
    return this.gameHistoryService.getGameReplay(parseInt(id, 10));
  }
}

