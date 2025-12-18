import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private prisma: PrismaService) {}

  async getActiveTournaments() {
    return this.prisma.tournament.findMany({
      where: {
        status: {
          in: ['REGISTRATION', 'IN_PROGRESS'],
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async joinTournament(userId: string, tournamentId: string) {
    // TODO: Implement tournament joining logic
    return { success: true };
  }
}
