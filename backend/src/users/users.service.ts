import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async getProfile(userId: number) {
    // Проверяем и применяем регенерацию перед возвратом профиля
    await this.checkAndRegenerate(userId);

    const user = await this.db.findOne('users', { id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    // Получаем связанные данные
    const [subscription, academyRole] = await Promise.all([
      this.db.findOne('subscriptions', { userId }).catch(() => null),
      this.db.findOne('academy_roles', { userId }).catch(() => null),
    ]);

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
      subscription,
      academyRole,
    };
  }

  /**
   * Улучшить ветку развития
   */
  async upgradeStat(userId: number, statType: 'ECONOMY' | 'ENERGY' | 'LIVES' | 'POWER') {
    const user = await this.db.findOne('users', { id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    const currentStat = this.getCurrentStat(user, statType);
    const upgradeCost = this.getStatUpgradeCost(currentStat);

    if (user.narCoin < upgradeCost) {
      throw new Error('Not enough NAR coins');
    }

    // Формируем SQL запрос для обновления
    const statField = `stats${statType}`;
    let updateQuery = `UPDATE users SET "${statField}" = "${statField}" + 1, "narCoin" = "narCoin" - $1`;
    const params: any[] = [upgradeCost];

    // Если это ветка Сила, увеличиваем лимит
    if (statType === 'POWER') {
      updateQuery += ', "powerMax" = "powerMax" + 2';
    }

    // Если это ветка Энергия, увеличиваем лимит
    if (statType === 'ENERGY') {
      updateQuery += ', "energyMax" = "energyMax" + 5';
    }

    // Если это ветка Жизни, увеличиваем лимит
    if (statType === 'LIVES') {
      updateQuery += ', "livesMax" = "livesMax" + 1';
    }

    updateQuery += ' WHERE id = $2 RETURNING *';
    params.push(userId);

    await this.db.query(updateQuery, params);

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
    return await this.db.update('users', 
      { id: userId },
      {
        nickname: dto.nickname,
        country: dto.country,
        avatar: dto.avatar,
        updatedAt: new Date(),
      }
    );
  }

  async getStats(userId: number) {
    const [ratings, gameHistory, quests] = await Promise.all([
      this.db.findMany('ratings', { userId }),
      this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM game_history WHERE "whitePlayerId" = $1 OR "blackPlayerId" = $1',
        [userId]
      ).then(r => parseInt(r.rows[0].count, 10)),
      this.db.count('quest_progress', { userId, completed: true }),
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
    const user = await this.db.findOne('users', { id: userId });

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

    await this.db.query(
      'UPDATE users SET energy = $1, "narCoin" = "narCoin" - $2 WHERE id = $3',
      [newEnergy, cost, userId]
    );

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
    const user = await this.db.findOne('users', { id: userId });

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

    await this.db.query(
      'UPDATE users SET lives = $1, "narCoin" = "narCoin" - $2 WHERE id = $3',
      [newLives, cost, userId]
    );

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
    const user = await this.db.findOne('users', { id: userId });

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

    const updates: string[] = ['"lastEnergyRegen" = $1'];
    const params: any[] = [now];

    if (energyToRegen > 0 && user.energy < user.energyMax) {
      const newEnergy = Math.min(user.energyMax, user.energy + energyToRegen);
      updates.push(`energy = $${params.length + 1}`);
      params.push(newEnergy);
    }

    if (livesToRegen > 0 && user.lives < user.livesMax) {
      const newLives = Math.min(user.livesMax, user.lives + livesToRegen);
      updates.push(`lives = $${params.length + 1}`);
      params.push(newLives);
    }

    if (updates.length > 1) {
      params.push(userId);
      await this.db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}`,
        params
      );
    }

    return {
      energyRegenerated: energyToRegen,
      livesRegenerated: livesToRegen,
    };
  }
}

