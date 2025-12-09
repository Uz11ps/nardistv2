import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTournament(data: {
    name: string;
    description?: string;
    mode: string;
    format: string;
    startDate: Date;
    maxParticipants?: number;
  }) {
    return this.prisma.tournament.create({
      data,
    });
  }

  async getTournaments(status?: string) {
    return this.prisma.tournament.findMany({
      where: status ? { status } : undefined,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                photoUrl: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async joinTournament(tournamentId: number, userId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { participants: true },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.maxParticipants && tournament.participants.length >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    return this.prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        userId,
      },
    });
  }
}

