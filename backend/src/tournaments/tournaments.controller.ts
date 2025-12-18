import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments')
export class TournamentsController {
  constructor(private tournamentsService: TournamentsService) {}

  @Get()
  async getTournaments() {
    return this.tournamentsService.getActiveTournaments();
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async joinTournament(@Request() req, @Request() params: any) {
    return this.tournamentsService.joinTournament(req.user.id, params.id);
  }
}
