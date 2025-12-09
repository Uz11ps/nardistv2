import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  async getTournaments() {
    return this.tournamentsService.getTournaments();
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinTournament(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.tournamentsService.joinTournament(parseInt(id, 10), user.id);
  }
}

