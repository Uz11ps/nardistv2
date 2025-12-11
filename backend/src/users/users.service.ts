import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    // Проверяем и применяем регенерацию перед возвратом профиля
    await this.checkAndRegenerate(userId);

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
      power: user.power,
      powerMax: user.powerMax,
      statsEconomy: user.statsEconomy,
      statsEnergy: user.statsEnergy,
      statsLives: user.statsLives,
      statsPower: user.statsPower,
      referralCode: user.referralCode,
      isPremium: user.isPremium,
      subscription: user.subscription,
      academyRole: user.academyRole,
    };
  }

  /**
   * Улучшить ветку развития
   */
  async upgradeStat(userId: number, statType: 'ECONOMY' | 'ENERGY' | 'LIVES' | 'POWER') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentStat = this.getCurrentStat(user, statType);
    const upgradeCost = this.getStatUpgradeCost(currentStat);

    if (user.narCoin < upgradeCost) {
      throw new Error('Not enough NAR coins');
    }

    // Обновляем ветку
    const updateData: any = {};
    updateData[`stats${statType}`] = { increment: 1 };

    // Если это ветка Сила, увеличиваем лимит
    if (statType === 'POWER') {
      updateData.powerMax = { increment: 2 };
    }

    // Если это ветка Энергия, увеличиваем лимит
    if (statType === 'ENERGY') {
      updateData.energyMax = { increment: 5 };
    }

    // Если это ветка Жизни, увеличиваем лимит
    if (statType === 'LIVES') {
      updateData.livesMax = { increment: 1 };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        narCoin: { decrement: upgradeCost },
      },
    });

    return { success: true, newLevel: currentStat + 1 };
  }

  private getCurrentStat(user: any, statType: string): number {
    const stats: Record<string, number> = {
      ECONOMY: user.statsEconomy,
      ENERGY: user.statsEnergy,
      LIVES: user.statsLives,
      POWER: user.statsPower,
    };
    return stats[statType] || 0;
  }

  private getStatUpgradeCost(currentLevel: number): number {
    // Стоимость растет с уровнем: 100 * (level + 1)
    return 100 * (currentLevel + 1);
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

  /**
   * Восстановить энергию за NAR
   */
  async restoreEnergy(userId: number, amount?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Если не указано количество, восстанавливаем до максимума
    const restoreAmount = amount || (user.energyMax - user.energy);
    
    if (restoreAmount <= 0) {
      return { success: true, energy: user.energy, energyMax: user.energyMax, restored: 0 };
    }

    // Стоимость: 10 NAR за 1 единицу энергии
    const cost = restoreAmount * 10;

    if (user.narCoin < cost) {
      throw new Error('Not enough NAR coins');
    }

    const newEnergy = Math.min(user.energyMax, user.energy + restoreAmount);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        energy: newEnergy,
        narCoin: { decrement: cost },
      },
    });

    return {
      success: true,
      energy: newEnergy,
      energyMax: user.energyMax,
      restored: restoreAmount,
      cost,
    };
  }

  /**
   * Восстановить жизни за NAR
   */
  async restoreLives(userId: number, amount?: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Если не указано количество, восстанавливаем до максимума
    const restoreAmount = amount || (user.livesMax - user.lives);
    
    if (restoreAmount <= 0) {
      return { success: true, lives: user.lives, livesMax: user.livesMax, restored: 0 };
    }

    // Стоимость: 50 NAR за 1 жизнь
    const cost = restoreAmount * 50;

    if (user.narCoin < cost) {
      throw new Error('Not enough NAR coins');
    }

    const newLives = Math.min(user.livesMax, user.lives + restoreAmount);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lives: newLives,
        narCoin: { decrement: cost },
      },
    });

    return {
      success: true,
      lives: newLives,
      livesMax: user.livesMax,
      restored: restoreAmount,
      cost,
    };
  }

  /**
   * Проверить и применить автоматическую регенерацию энергии/жизней
   * Вызывается периодически (например, через cron или при запросе профиля)
   */
  async checkAndRegenerate(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    const now = new Date();
    const lastRegen = user.lastEnergyRegen || user.createdAt;
    const hoursSinceRegen = (now.getTime() - new Date(lastRegen).getTime()) / (1000 * 60 * 60);

    // Регенерация энергии: базовая 1 энергия в час, +0.1 за каждый уровень ветки Энергия
    const energyRegenRate = 1 + (user.statsEnergy * 0.1);
    const energyToRegen = Math.floor(hoursSinceRegen * energyRegenRate);
    
    // Регенерация жизней: базовая 1 жизнь в 12 часов, +0.05 за каждый уровень ветки Жизни
    const livesRegenRate = 1 / 12 + (user.statsLives * 0.05 / 12);
    const livesToRegen = Math.floor(hoursSinceRegen * livesRegenRate);

    const updateData: any = {
      lastEnergyRegen: now,
    };

    if (energyToRegen > 0 && user.energy < user.energyMax) {
      updateData.energy = Math.min(user.energyMax, user.energy + energyToRegen);
    }

    if (livesToRegen > 0 && user.lives < user.livesMax) {
      updateData.lives = Math.min(user.livesMax, user.lives + livesToRegen);
    }

    if (Object.keys(updateData).length > 1) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return {
      energyRegenerated: energyToRegen,
      livesRegenerated: livesToRegen,
    };
  }
}

