import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
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
    return this.prisma.tournament.create({
      data: {
        name: data.name,
        description: data.description,
        mode: data.mode,
        format: data.format,
        startDate: data.startDate,
        maxParticipants: data.maxParticipants,
        hasTournamentPass: data.hasTournamentPass || false,
      },
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

    // Проверяем, не зарегистрирован ли уже пользователь
    const existingParticipant = await this.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      throw new Error('User is already registered for this tournament');
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

  /**
   * Получить текущую Олимпиаду Нардиста
   */
  async getCurrentOlympiad() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return this.prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Олимпиада Нардиста',
        },
        startDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: {
          in: ['UPCOMING', 'IN_PROGRESS'],
        },
      },
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
          orderBy: { wins: 'desc' },
        },
      },
    });
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
    const existing = await this.prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Олимпиада Нардиста',
        },
        startDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const monthNames = [
      'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
      'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
    ];

    return this.prisma.tournament.create({
      data: {
        name: `Олимпиада Нардиста ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        description: 'Ежемесячный турнир с уникальными Mythic-наградами. Победитель получает эксклюзивный набор скинов 1/1.',
        mode: 'LONG',
        format: 'BRACKET',
        status: 'UPCOMING',
        startDate: startOfMonth,
        endDate: endOfMonth,
        maxParticipants: 64,
      },
    });
  }

  /**
   * Завершить Олимпиаду и выдать награды
   */
  async finishOlympiad(tournamentId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: true,
          },
          orderBy: [
            { wins: 'desc' },
            { losses: 'asc' },
          ],
        },
      },
    });

    if (!tournament || !tournament.name.includes('Олимпиада Нардиста')) {
      throw new Error('Tournament is not an Olympiad');
    }

    // Находим победителя
    const winner = tournament.participants[0];
    if (!winner) {
      throw new Error('No participants in tournament');
    }

    // Создаем Mythic-скины для победителя
    const mythicSkins = await this.createMythicSkinsForWinner(winner.userId, tournament.id);

    // Обновляем статус турнира
    await this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'FINISHED',
        endDate: new Date(),
      },
    });

    return {
      winner: winner.user,
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
      const skin = await this.prisma.skin.create({
        data: {
          name: `Олимпийский ${type === 'BOARD' ? 'Комплект' : type === 'DICE' ? 'Зарики' : type === 'CHECKERS' ? 'Фишки' : type === 'CUP' ? 'Стакан' : 'Рамка'} #${tournamentId}`,
          type,
          previewUrl: `/skins/mythic/${type.toLowerCase()}-olympic.png`,
          rarity: 'MYTHIC',
          weight: 10,
          durabilityMax: 10000,
          isDefault: false,
          priceCoin: 0, // Не продается за NAR
          isActive: true,
        },
      });

      // Создаем предмет в инвентаре победителя
      await this.prisma.inventoryItem.create({
        data: {
          userId,
          skinId: skin.id,
          rarity: 'MYTHIC',
          durability: skin.durabilityMax,
          durabilityMax: skin.durabilityMax,
          weight: skin.weight,
          isEquipped: false,
        },
      });

      createdSkins.push(skin);
    }

    return createdSkins;
  }

  /**
   * Купить Tournament Pass для турнира
   */
  async purchaseTournamentPass(userId: number, tournamentId: number, paymentMethod: 'NAR' | 'TON' | 'USDT' | 'RUBLES' | 'TELEGRAM_STARS' = 'NAR') {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (!tournament.hasTournamentPass) {
      throw new Error('This tournament does not have a Tournament Pass');
    }

    // Проверяем, не куплен ли уже пасс
    const existingPass = await this.prisma.tournamentPass.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (existingPass) {
      throw new Error('Tournament pass already purchased');
    }

    // Оплата через NAR
    if (paymentMethod === 'NAR') {
      const passPrice = 500; // NAR
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.narCoin < passPrice) {
        throw new Error('Not enough NAR');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { narCoin: { decrement: passPrice } },
      });
    } else {
      // TODO: Интеграция с TON/USDT/RUBLES/TELEGRAM_STARS
      // Пока просто создаем пасс (в реальном приложении здесь будет проверка транзакции)
      console.log(`Tournament Pass purchase via ${paymentMethod} - payment verification needed`);
    }

    return this.prisma.tournamentPass.create({
      data: {
        userId,
        tournamentId,
        isActive: true,
        rewardsClaimed: {},
      },
    });
  }

  /**
   * Получить Tournament Pass пользователя для турнира
   */
  async getTournamentPass(userId: number, tournamentId: number) {
    return this.prisma.tournamentPass.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });
  }

  /**
   * Получить все Tournament Pass пользователя
   */
  async getUserTournamentPasses(userId: number) {
    return this.prisma.tournamentPass.findMany({
      where: { userId, isActive: true },
      include: {
        tournament: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  /**
   * Получить награды Tournament Pass (дополнительные призы для владельцев пасса)
   */
  async claimTournamentPassRewards(userId: number, tournamentId: number, rewardType: string) {
    const pass = await this.prisma.tournamentPass.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
      include: {
        tournament: true,
      },
    });

    if (!pass || !pass.isActive) {
      throw new Error('Tournament pass not found or inactive');
    }

    const rewardsClaimed = (pass.rewardsClaimed as any) || {};
    
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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // Выдаем NAR
    if (reward.nar) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { narCoin: { increment: reward.nar } },
      });
    }

    // Выдаем XP
    if (reward.xp) {
      const newXp = (user.xp || 0) + reward.xp;
      const newLevel = Math.floor(newXp / 100) + 1; // 100 XP = 1 уровень
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel,
        },
      });
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

    await this.prisma.tournamentPass.update({
      where: { id: pass.id },
      data: {
        rewardsClaimed,
      },
    });

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

    const participant = await this.prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId,
        },
      },
    });

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

