import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createTournament(data: {
    name: string;
    description?: string;
    mode: string;
    format: string;
    startDate: Date;
    maxParticipants?: number;
    hasTournamentPass?: boolean;
  }) {
    return await this.db.create('tournaments', {
      name: data.name,
      description: data.description || null,
      mode: data.mode,
      format: data.format,
      startDate: data.startDate,
      maxParticipants: data.maxParticipants || null,
      hasTournamentPass: data.hasTournamentPass || false,
      status: 'UPCOMING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getTournaments(status?: string) {
    const where = status ? { status } : undefined;
    const tournaments = await this.db.findMany('tournaments', where, { orderBy: '"startDate" DESC' });

    // Загружаем участников для каждого турнира
    const tournamentsWithParticipants = await Promise.all(
      tournaments.map(async (tournament) => {
        const participants = await this.db.query(
          `SELECT tp.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
           FROM tournament_participants tp
           JOIN users u ON tp."userId" = u.id
           WHERE tp."tournamentId" = $1
           ORDER BY tp.wins DESC`,
          [tournament.id]
        );

        return {
          ...tournament,
          participants: participants.rows.map(p => ({
            ...p,
            user: {
              id: p.userId,
              nickname: p.nickname,
              firstName: p.firstName,
              photoUrl: p.photoUrl,
            },
          })),
        };
      })
    );

    return tournamentsWithParticipants;
  }

  async joinTournament(tournamentId: number, userId: number) {
    const tournament = await this.db.findOne('tournaments', { id: tournamentId });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    // Проверяем, не зарегистрирован ли уже пользователь
    const existingParticipant = await this.db.query(
      'SELECT * FROM tournament_participants WHERE "tournamentId" = $1 AND "userId" = $2',
      [tournamentId, userId]
    );

    if (existingParticipant.rows.length > 0) {
      throw new Error('User is already registered for this tournament');
    }

    // Проверяем количество участников
    const participantCount = await this.db.count('tournament_participants', { tournamentId });
    if (tournament.maxParticipants && participantCount >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    return await this.db.create('tournament_participants', {
      tournamentId,
      userId,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: new Date(),
    });
  }

  /**
   * Получить текущую Олимпиаду Нардиста
   */
  async getCurrentOlympiad() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await this.db.query(
      `SELECT * FROM tournaments 
       WHERE name LIKE $1 
       AND "startDate" >= $2 
       AND "startDate" <= $3 
       AND status IN ($4, $5)
       LIMIT 1`,
      ['%Олимпиада Нардиста%', startOfMonth, endOfMonth, 'UPCOMING', 'IN_PROGRESS']
    );

    const tournament = result.rows[0];
    if (!tournament) {
      return null;
    }

    // Загружаем участников
    const participants = await this.db.query(
      `SELECT tp.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
       FROM tournament_participants tp
       JOIN users u ON tp."userId" = u.id
       WHERE tp."tournamentId" = $1
       ORDER BY tp.wins DESC`,
      [tournament.id]
    );

    return {
      ...tournament,
      participants: participants.rows.map(p => ({
        ...p,
        user: {
          id: p.userId,
          nickname: p.nickname,
          firstName: p.firstName,
          photoUrl: p.photoUrl,
        },
      })),
    };
  }

  /**
   * Автоматическое создание Олимпиады Нардиста каждый месяц
   * Запускается 1-го числа каждого месяца в 00:00
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoCreateOlympiad() {
    console.log('Auto-creating Olympiad for current month...');
    try {
      await this.createOlympiad();
      console.log('Olympiad created successfully');
    } catch (error) {
      console.error('Error auto-creating Olympiad:', error);
    }
  }

  /**
   * Создать Олимпиаду Нардиста (вызывается автоматически раз в месяц)
   */
  async createOlympiad() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Проверяем, не создана ли уже олимпиада на этот месяц
    const existing = await this.db.query(
      `SELECT * FROM tournaments 
       WHERE name LIKE $1 
       AND "startDate" >= $2 
       AND "startDate" <= $3
       LIMIT 1`,
      ['%Олимпиада Нардиста%', startOfMonth, endOfMonth]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const monthNames = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
    ];

    return await this.db.create('tournaments', {
      name: `Олимпиада Нардиста ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      description: 'Ежемесячный турнир с уникальными Mythic-наградами. Победитель получает эксклюзивный набор скинов 1/1.',
      mode: 'LONG',
      format: 'BRACKET',
      status: 'UPCOMING',
      startDate: startOfMonth,
      endDate: endOfMonth,
      maxParticipants: 64,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Завершить Олимпиаду и выдать награды
   */
  async finishOlympiad(tournamentId: number) {
    const tournament = await this.db.findOne('tournaments', { id: tournamentId });

    if (!tournament || !tournament.name.includes('Олимпиада Нардиста')) {
      throw new Error('Tournament is not an Olympiad');
    }

    // Находим победителя
    const winnerResult = await this.db.query(
      `SELECT tp.*, u.* 
       FROM tournament_participants tp
       JOIN users u ON tp."userId" = u.id
       WHERE tp."tournamentId" = $1
       ORDER BY tp.wins DESC, tp.losses ASC
       LIMIT 1`,
      [tournamentId]
    );

    if (winnerResult.rows.length === 0) {
      throw new Error('No participants in tournament');
    }

    const winner = winnerResult.rows[0];

    // Создаем Mythic-скины для победителя
    const mythicSkins = await this.createMythicSkinsForWinner(winner.userId, tournamentId);

    // Обновляем статус турнира
    await this.db.update('tournaments', 
      { id: tournamentId },
      {
        status: 'FINISHED',
        endDate: new Date(),
        updatedAt: new Date(),
      }
    );

    return {
      winner: {
        id: winner.userId,
        nickname: winner.nickname,
        firstName: winner.firstName,
        photoUrl: winner.photoUrl,
      },
      skins: mythicSkins,
    };
  }

  /**
   * Создать Mythic-скины для победителя Олимпиады
   */
  private async createMythicSkinsForWinner(userId: number, tournamentId: number) {
    const skinTypes = ['BOARD', 'DICE', 'CHECKERS', 'CUP', 'FRAME'];
    const createdSkins = [];

    for (const type of skinTypes) {
      const typeNames: Record<string, string> = {
        BOARD: 'Комплект',
        DICE: 'Зарики',
        CHECKERS: 'Фишки',
        CUP: 'Стакан',
        FRAME: 'Рамка',
      };

      const skin = await this.db.create('skins', {
        name: `Олимпийский ${typeNames[type]} #${tournamentId}`,
        type,
        previewUrl: `/skins/mythic/${type.toLowerCase()}-olympic.png`,
        rarity: 'MYTHIC',
        weight: 10,
        durabilityMax: 10000,
        isDefault: false,
        priceCoin: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Создаем предмет в инвентаре победителя
      await this.db.create('inventory_items', {
        userId,
        skinId: skin.id,
        rarity: 'MYTHIC',
        durability: skin.durabilityMax,
        durabilityMax: skin.durabilityMax,
        weight: skin.weight,
        isEquipped: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createdSkins.push(skin);
    }

    return createdSkins;
  }

  /**
   * Купить Tournament Pass для турнира
   */
  async purchaseTournamentPass(userId: number, tournamentId: number, paymentMethod: 'NAR' | 'TON' | 'USDT' | 'RUBLES' | 'TELEGRAM_STARS' = 'NAR') {
    const tournament = await this.db.findOne('tournaments', { id: tournamentId });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.hasTournamentPass) {
      throw new Error('This tournament does not have a Tournament Pass');
    }

    // Проверяем, не куплен ли уже пасс
    const existingPass = await this.db.query(
      'SELECT * FROM tournament_passes WHERE "userId" = $1 AND "tournamentId" = $2',
      [userId, tournamentId]
    );

    if (existingPass.rows.length > 0) {
      throw new Error('Tournament pass already purchased');
    }

    // Оплата через NAR
    if (paymentMethod === 'NAR') {
      const passPrice = 500; // NAR
      const user = await this.db.findOne('users', { id: userId });
      if (!user || user.narCoin < passPrice) {
        throw new Error('Not enough NAR');
      }
      await this.db.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [passPrice, userId]
      );
    } else {
      // TODO: Интеграция с TON/USDT/RUBLES/TELEGRAM_STARS
      // Пока просто создаем пасс (в реальном приложении здесь будет проверка транзакции)
      console.log(`Tournament Pass purchase via ${paymentMethod} - payment verification needed`);
    }

    return await this.db.create('tournament_passes', {
      userId,
      tournamentId,
      isActive: true,
      rewardsClaimed: {},
      purchasedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Получить Tournament Pass пользователя для турнира
   */
  async getTournamentPass(userId: number, tournamentId: number) {
    return await this.db.query(
      'SELECT * FROM tournament_passes WHERE "userId" = $1 AND "tournamentId" = $2',
      [userId, tournamentId]
    ).then(r => r.rows[0] || null);
  }

  /**
   * Получить все Tournament Pass пользователя
   */
  async getUserTournamentPasses(userId: number) {
    const passes = await this.db.query(
      `SELECT tp.*, t.*
       FROM tournament_passes tp
       JOIN tournaments t ON tp."tournamentId" = t.id
       WHERE tp."userId" = $1 AND tp."isActive" = true
       ORDER BY tp."purchasedAt" DESC`,
      [userId]
    );

    return passes.rows.map(p => ({
      ...p,
      tournament: {
        id: p.tournamentId,
        name: p.name,
        description: p.description,
        mode: p.mode,
        format: p.format,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
      },
    }));
  }

  /**
   * Получить награды Tournament Pass (дополнительные призы для владельцев пасса)
   */
  async claimTournamentPassRewards(userId: number, tournamentId: number, rewardType: string) {
    const pass = await this.db.query(
      'SELECT * FROM tournament_passes WHERE "userId" = $1 AND "tournamentId" = $2',
      [userId, tournamentId]
    ).then(r => r.rows[0]);

    if (!pass || !pass.isActive) {
      throw new Error('Tournament pass not found or inactive');
    }

    const rewardsClaimed = pass.rewardsClaimed || {};
    
    if (rewardsClaimed[rewardType]) {
      throw new Error('Reward already claimed');
    }

    // Определяем награды в зависимости от типа
    const rewards: Record<string, { nar?: number; xp?: number; skinId?: number }> = {
      'LEVEL_5': { nar: 100, xp: 50 },
      'LEVEL_10': { nar: 250, xp: 100 },
      'LEVEL_15': { nar: 500, xp: 200 },
      'LEVEL_20': { nar: 1000, xp: 500, skinId: null }, // Специальный скин
      'PARTICIPATION': { nar: 50, xp: 25 },
      'TOP_10': { nar: 500, xp: 250 },
      'TOP_5': { nar: 1000, xp: 500 },
      'TOP_3': { nar: 2000, xp: 1000, skinId: null }, // Редкий скин
      'WINNER': { nar: 5000, xp: 2000, skinId: null }, // Эпический скин
    };

    const reward = rewards[rewardType];
    if (!reward) {
      throw new Error('Invalid reward type');
    }

    const user = await this.db.findOne('users', { id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Выдаем NAR
    if (reward.nar) {
      await this.db.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [reward.nar, userId]
      );
    }

    // Выдаем XP
    if (reward.xp) {
      const newXp = (user.xp || 0) + reward.xp;
      const newLevel = Math.floor(newXp / 100) + 1; // 100 XP = 1 уровень
      await this.db.update('users',
        { id: userId },
        {
          xp: newXp,
          level: newLevel,
        }
      );
    }

    // Выдаем скин (если указан)
    if (reward.skinId !== undefined) {
      // TODO: Создать специальный скин для Tournament Pass или использовать существующий
      // Пока просто помечаем, что награда выдана
    }

    // Обновляем информацию о полученных наградах
    rewardsClaimed[rewardType] = {
      claimedAt: new Date().toISOString(),
      reward: {
        nar: reward.nar || 0,
        xp: reward.xp || 0,
        skinId: reward.skinId,
      },
    };

    await this.db.update('tournament_passes',
      { id: pass.id },
      {
        rewardsClaimed,
        updatedAt: new Date(),
      }
    );

    return {
      success: true,
      rewardType,
      reward: {
        nar: reward.nar || 0,
        xp: reward.xp || 0,
        skinId: reward.skinId,
      },
    };
  }

  /**
   * Получить доступные награды для Tournament Pass
   */
  async getAvailableTournamentPassRewards(userId: number, tournamentId: number) {
    const pass = await this.getTournamentPass(userId, tournamentId);
    if (!pass) {
      return { available: [], claimed: [] };
    }

    const participantResult = await this.db.query(
      'SELECT * FROM tournament_participants WHERE "tournamentId" = $1 AND "userId" = $2',
      [tournamentId, userId]
    );
    const participant = participantResult.rows[0] || null;

    const rewardsClaimed = (pass.rewardsClaimed as any) || {};
    const available = [];
    const claimed = [];

    // Определяем доступные награды на основе прогресса
    const rewardLevels = [
      { type: 'PARTICIPATION', condition: () => participant !== null },
      { type: 'LEVEL_5', condition: () => participant && participant.wins >= 5 },
      { type: 'LEVEL_10', condition: () => participant && participant.wins >= 10 },
      { type: 'LEVEL_15', condition: () => participant && participant.wins >= 15 },
      { type: 'LEVEL_20', condition: () => participant && participant.wins >= 20 },
    ];

    for (const rewardLevel of rewardLevels) {
      if (rewardLevel.condition()) {
        if (rewardsClaimed[rewardLevel.type]) {
          claimed.push(rewardLevel.type);
        } else {
          available.push(rewardLevel.type);
        }
      }
    }

    return { available, claimed };
  }
}
