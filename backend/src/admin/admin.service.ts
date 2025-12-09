import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentsService } from '../tournaments/tournaments.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async banUser(userId: number) {
    // В реальном приложении здесь была бы логика бана
    // Пока просто возвращаем успех
    return { success: true, message: 'User banned' };
  }

  async unbanUser(userId: number) {
    return { success: true, message: 'User unbanned' };
  }

  async createTournament(data: any) {
    return this.tournamentsService.createTournament(data);
  }

  async startTournament(tournamentId: number) {
    return this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async finishTournament(tournamentId: number) {
    return this.prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'FINISHED', endDate: new Date() },
    });
  }

  async getArticles() {
    return this.prisma.academyArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createArticle(data: {
    title: string;
    content: string;
    category?: string;
    isPaid?: boolean;
    priceCoin?: number;
  }) {
    return this.prisma.academyArticle.create({
      data: {
        ...data,
        isPublished: false,
      },
    });
  }

  async updateArticle(id: number, data: any) {
    return this.prisma.academyArticle.update({
      where: { id },
      data,
    });
  }

  async deleteArticle(id: number) {
    return this.prisma.academyArticle.delete({
      where: { id },
    });
  }

  async getSkins() {
    return this.prisma.skin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSkin(data: {
    name: string;
    type: string;
    previewUrl: string;
    priceCoin?: number;
  }) {
    return this.prisma.skin.create({
      data: {
        ...data,
        isActive: true,
      },
    });
  }
}

