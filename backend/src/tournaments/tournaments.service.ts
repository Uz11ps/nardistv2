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
  async purchaseTournamentPass(userId: number, tournamentId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new Error('Tournament not found');
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

    // TODO: Списываем NAR или TON/USDT (пока просто создаем пасс)
    // const passPrice = 500; // NAR
    // const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // if (!user || user.narCoin < passPrice) {
    //   throw new Error('Not enough NAR');
    // }
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { narCoin: { decrement: passPrice } },
    // });

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
    });

    if (!pass || !pass.isActive) {
      throw new Error('Tournament pass not found or inactive');
    }

    const rewardsClaimed = (pass.rewardsClaimed as any) || {};
    
    if (rewardsClaimed[rewardType]) {
      throw new Error('Reward already claimed');
    }

    // TODO: Выдать награду (NAR, скины и т.д.)
    rewardsClaimed[rewardType] = {
      claimedAt: new Date().toISOString(),
    };

    await this.prisma.tournamentPass.update({
      where: { id: pass.id },
      data: {
        rewardsClaimed,
      },
    });

    return { success: true, rewardType };
  }
}

