import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        academyRole: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      nickname: user.nickname,
      country: user.country,
      avatar: user.avatar,
      photoUrl: user.photoUrl,
      level: user.level,
      xp: user.xp,
      narCoin: user.narCoin,
      energy: user.energy,
      energyMax: user.energyMax,
      lives: user.lives,
      livesMax: user.livesMax,
      referralCode: user.referralCode,
      isPremium: user.isPremium,
      subscription: user.subscription,
      academyRole: user.academyRole,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        country: dto.country,
        avatar: dto.avatar,
      },
    });
  }

  async getStats(userId: number) {
    const [ratings, gameHistory, quests] = await Promise.all([
      this.prisma.rating.findMany({
        where: { userId },
      }),
      this.prisma.gameHistory.count({
        where: {
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
      this.prisma.questProgress.count({
        where: { userId, completed: true },
      }),
    ]);

    return {
      ratings,
      totalGames: gameHistory,
      completedQuests: quests,
    };
  }
}

