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

  async getTournaments() {
    return this.prisma.tournament.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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

  async createSkin(data: any) {
    return this.prisma.skin.create({
      data,
    });
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const [
      totalUsers,
      activeUsers,
      totalGames,
      gamesToday,
      gamesYesterday,
      totalTournaments,
      activeTournaments,
      revenueData,
      revenueTodayData,
      gamesByMode,
      userActivityData,
    ] = await Promise.all([
      // Всего пользователей
      this.prisma.user.count(),
      // Активные пользователи (за последние 24 часа)
      this.prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Всего игр
      this.prisma.gameHistory.count(),
      // Игры сегодня
      this.prisma.gameHistory.count({
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
      }),
      // Игры вчера (для расчета тренда)
      this.prisma.gameHistory.count({
        where: {
          createdAt: {
            gte: yesterdayStart,
            lt: todayStart,
          },
        },
      }),
      // Всего турниров
      this.prisma.tournament.count(),
      // Активные турниры
      this.prisma.tournament.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),
      // Общий доход (комиссия из всех игр)
      this.prisma.gameHistory.aggregate({
        where: {
          commission: {
            not: null,
          },
        },
        _sum: {
          commission: true,
        },
      }),
      // Доход сегодня
      this.prisma.gameHistory.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
          },
          commission: {
            not: null,
          },
        },
        _sum: {
          commission: true,
        },
      }),
      // Игры по режимам
      this.prisma.gameHistory.groupBy({
        by: ['mode'],
        _count: {
          id: true,
        },
      }),
      // Активность пользователей за последние 7 дней
      this.getUserActivityForLast7Days(),
    ]);

    // Расчет трендов
    const usersLastMonth = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: monthAgo,
          lt: weekAgo,
        },
      },
    });
    const usersThisMonth = totalUsers - usersLastMonth;
    const userTrend = usersLastMonth > 0 
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : 0;

    const gameTrend = gamesYesterday > 0
      ? Math.round(((gamesToday - gamesYesterday) / gamesYesterday) * 100)
      : 0;

    // Доход вчера для расчета тренда
    const revenueYesterdayData = await this.prisma.gameHistory.aggregate({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
        commission: {
          not: null,
        },
      },
      _sum: {
        commission: true,
      },
    });

    const revenueYesterday = revenueYesterdayData._sum.commission || 0;
    const revenueToday = revenueTodayData._sum.commission || 0;
    const revenueTrend = revenueYesterday > 0
      ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
      : 0;

    // Распределение игр по режимам
    const totalGamesByMode = gamesByMode.reduce((sum, item) => sum + item._count.id, 0);
    const shortGames = gamesByMode.find(item => item.mode === 'SHORT')?._count.id || 0;
    const longGames = gamesByMode.find(item => item.mode === 'LONG')?._count.id || 0;
    const shortPercentage = totalGamesByMode > 0 ? Math.round((shortGames / totalGamesByMode) * 100) : 0;
    const longPercentage = totalGamesByMode > 0 ? Math.round((longGames / totalGamesByMode) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      totalGames,
      gamesToday,
      totalTournaments,
      activeTournaments,
      totalRevenue: revenueData._sum.commission || 0,
      revenueToday: revenueToday,
      userTrend,
      gameTrend,
      revenueTrend,
      gamesByMode: {
        short: shortGames,
        long: longGames,
        shortPercentage,
        longPercentage,
      },
      userActivity: userActivityData,
    };
  }

  /**
   * Получить активность пользователей за последние 7 дней
   */
  private async getUserActivityForLast7Days(): Promise<number[]> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const activity: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await this.prisma.user.count({
        where: {
          OR: [
            {
              createdAt: {
                gte: dayStart,
                lt: dayEnd,
              },
            },
            {
              updatedAt: {
                gte: dayStart,
                lt: dayEnd,
              },
            },
          ],
        },
      });

      activity.push(count);
    }

    return activity;
  }

  /**
   * Получить последние игры для дашборда
   */
  async getRecentGames(limit: number = 10) {
    return this.prisma.gameHistory.findMany({
      take: limit,
      include: {
        whitePlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        blackPlayer: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGames(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [games, total] = await Promise.all([
      this.prisma.gameHistory.findMany({
        skip,
        take: limit,
        include: {
          whitePlayer: {
            select: {
              id: true,
              nickname: true,
              firstName: true,
            },
          },
          blackPlayer: {
            select: {
              id: true,
              nickname: true,
              firstName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.gameHistory.count(),
    ]);

    return {
      games,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addCoins(userId: number, amount: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { increment: amount },
      },
    });

    return { success: true };
  }

  async getSettings() {
    // TODO: Реализовать хранение настроек в БД
    return {
      ratingPerWin: 20,
      ratingPerLoss: -15,
      ratingPerDraw: 5,
      referralRewardCoin: 50,
      referralRewardXp: 10,
      cityIncomeMultiplier: 1.0,
      energyRegenPerHour: 1,
      livesRegenPerDay: 1,
    };
  }

  async updateSettings(settings: any) {
    // TODO: Реализовать сохранение настроек в БД
    return { success: true, settings };
  }

  // Управление квестами
  async getQuests() {
    return this.prisma.quest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQuestById(id: number) {
    return this.prisma.quest.findUnique({
      where: { id },
    });
  }

  async createQuest(data: {
    type: string;
    title: string;
    description: string;
    target: number;
    rewardCoin?: number;
    rewardXp?: number;
    rewardSkin?: number;
    isActive?: boolean;
    startDate?: Date;
    endDate?: Date;
    durationType?: string;
    isHoliday?: boolean;
    holidayName?: string;
    isInfinite?: boolean;
  }) {
    let endDate = data.endDate;
    if (data.durationType && !data.isInfinite) {
      const start = data.startDate || new Date();
      switch (data.durationType) {
        case 'DAY':
          endDate = new Date(start.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'WEEK':
          endDate = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MONTH':
          endDate = new Date(start.setMonth(start.getMonth() + 1));
          break;
        case 'FOREVER': // 'FOREVER' means no end date, handled by isInfinite
          endDate = null;
          break;
        default:
          // CUSTOM or no durationType, use provided endDate or null
          break;
      }
    }

    return this.prisma.quest.create({
      data: {
        ...data,
        endDate: endDate,
        isActive: data.isActive ?? true,
        isInfinite: data.isInfinite ?? false,
        isHoliday: data.isHoliday ?? false,
      },
    });
  }

  async updateQuest(id: number, data: any) {
    let endDate = data.endDate;
    if (data.durationType && !data.isInfinite) {
      const quest = await this.prisma.quest.findUnique({ 
        where: { id },
      });
      const start = data.startDate || (quest?.startDate ? new Date(quest.startDate) : new Date());
      
      if (data.durationType === 'FOREVER') {
        endDate = null;
      } else if (data.durationType !== 'CUSTOM') {
        switch (data.durationType) {
          case 'DAY':
            endDate = new Date(start);
            endDate.setDate(endDate.getDate() + 1);
            break;
          case 'WEEK':
            endDate = new Date(start);
            endDate.setDate(endDate.getDate() + 7);
            break;
          case 'MONTH':
            endDate = new Date(start);
            endDate.setMonth(endDate.getMonth() + 1);
            break;
          default:
            break;
        }
      }
    }

    return this.prisma.quest.update({
      where: { id },
      data: {
        ...data,
        endDate: endDate,
      },
    });
  }

  async deleteQuest(id: number) {
    return this.prisma.quest.delete({
      where: { id },
    });
  }

  // Маппинг типов районов на типы предприятий
  private getBusinessTypesForDistrict(districtType: string): string[] {
    const mapping: Record<string, string[]> = {
      COURTS: ['COURT_TABLE'],
      CLUBS: ['CLUB'],
      WORKSHOPS: ['BOARD_WORKSHOP'],
      FACTORIES: ['DICE_FACTORY'],
      WORKSHOPS_CUPS: ['CUPS_WORKSHOP'],
      SCHOOL: ['SCHOOL'],
      ARENA: ['ARENA'],
    };
    return mapping[districtType] || [];
  }

  // Управление конфигурацией предприятий для конкретного района
  async getBusinessConfigsForDistrict(districtId: number) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!district) {
      throw new Error('District not found');
    }

    const businessTypes = this.getBusinessTypesForDistrict(district.type);

    // TODO: В будущем можно хранить в БД, пока возвращаем хардкод
    const configs = businessTypes.map(type => ({
      type,
      districtId,
      districtName: district.name,
      creationCost: this.getBusinessCreationCost(type),
      baseIncomePerHour: this.getBaseIncomePerHour(type),
      baseProductionPerHour: this.getBaseProductionPerHour(type),
      baseStorageLimit: this.getBaseStorageLimit(type),
      baseMaintenanceCost: this.getBaseMaintenanceCost(type),
      upgradeCostMultiplier: 2, // baseCost * level * multiplier
      incomeIncreasePerLevel: this.getIncomeIncrease(type),
      productionIncreasePerLevel: this.getProductionIncrease(type),
    }));

    return configs;
  }

  // Управление конфигурацией предприятий (общее, для обратной совместимости)
  async getBusinessConfigs() {
    // Возвращаем конфигурацию всех типов предприятий
    const businessTypes = [
      'COURT_TABLE',
      'BOARD_WORKSHOP',
      'DICE_FACTORY',
      'CUPS_WORKSHOP',
      'CLUB',
      'SCHOOL',
      'ARENA',
    ];

    // TODO: В будущем можно хранить в БД, пока возвращаем хардкод
    const configs = businessTypes.map(type => ({
      type,
      creationCost: this.getBusinessCreationCost(type),
      baseIncomePerHour: this.getBaseIncomePerHour(type),
      baseProductionPerHour: this.getBaseProductionPerHour(type),
      baseStorageLimit: this.getBaseStorageLimit(type),
      baseMaintenanceCost: this.getBaseMaintenanceCost(type),
      upgradeCostMultiplier: 2, // baseCost * level * multiplier
      incomeIncreasePerLevel: this.getIncomeIncrease(type),
      productionIncreasePerLevel: this.getProductionIncrease(type),
    }));

    return configs;
  }

  async updateBusinessConfig(type: string, config: {
    creationCost?: number;
    baseIncomePerHour?: number;
    baseProductionPerHour?: number;
    baseStorageLimit?: number;
    baseMaintenanceCost?: number;
    upgradeCostMultiplier?: number;
    incomeIncreasePerLevel?: number;
    productionIncreasePerLevel?: number;
  }) {
    // TODO: Сохранить в БД
    return { success: true, type, config };
  }

  async updateBusinessConfigForDistrict(districtId: number, businessType: string, config: {
    creationCost?: number;
    baseIncomePerHour?: number;
    baseProductionPerHour?: number;
    baseStorageLimit?: number;
    baseMaintenanceCost?: number;
    upgradeCostMultiplier?: number;
    incomeIncreasePerLevel?: number;
    productionIncreasePerLevel?: number;
  }) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!district) {
      throw new Error('District not found');
    }

    const allowedTypes = this.getBusinessTypesForDistrict(district.type);
    if (!allowedTypes.includes(businessType)) {
      throw new Error(`Business type ${businessType} is not allowed in district ${district.type}`);
    }

    // TODO: Сохранить в БД
    return { success: true, districtId, type: businessType, config };
  }

  // Управление районами
  async getAllDistricts() {
    return this.prisma.district.findMany({
      include: {
        clan: {
          include: {
            leader: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
              },
            },
          },
        },
        fund: true,
        _count: {
          select: {
            businesses: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async updateDistrict(id: number, data: {
    name?: string;
    description?: string;
    icon?: string;
    commissionRate?: number;
  }) {
    return this.prisma.district.update({
      where: { id },
      data,
    });
  }

  // Вспомогательные методы для получения базовых значений
  private getBusinessCreationCost(type: string): number {
    const costs: Record<string, number> = {
      COURT_TABLE: 50,
      BOARD_WORKSHOP: 200,
      DICE_FACTORY: 300,
      CUPS_WORKSHOP: 250,
      CLUB: 500,
      SCHOOL: 400,
      ARENA: 1000,
    };
    return costs[type] || 100;
  }

  private getBaseIncomePerHour(type: string): number {
    const incomes: Record<string, number> = {
      COURT_TABLE: 5,
      BOARD_WORKSHOP: 20,
      DICE_FACTORY: 30,
      CUPS_WORKSHOP: 25,
      CLUB: 50,
      SCHOOL: 40,
      ARENA: 100,
    };
    return incomes[type] || 10;
  }

  private getBaseProductionPerHour(type: string): number {
    const productions: Record<string, number> = {
      BOARD_WORKSHOP: 1,
      DICE_FACTORY: 2,
      CUPS_WORKSHOP: 1,
    };
    return productions[type] || 0;
  }

  private getBaseStorageLimit(type: string): number {
    const storages: Record<string, number> = {
      BOARD_WORKSHOP: 50,
      DICE_FACTORY: 100,
      CUPS_WORKSHOP: 50,
    };
    return storages[type] || 0;
  }

  private getBaseMaintenanceCost(type: string): number {
    const costs: Record<string, number> = {
      COURT_TABLE: 1,
      BOARD_WORKSHOP: 5,
      DICE_FACTORY: 10,
      CUPS_WORKSHOP: 5,
      CLUB: 20,
      SCHOOL: 15,
      ARENA: 50,
    };
    return costs[type] || 5;
  }

  private getIncomeIncrease(type: string): number {
    const increases: Record<string, number> = {
      COURT_TABLE: 2,
      BOARD_WORKSHOP: 5,
      DICE_FACTORY: 7,
      CUPS_WORKSHOP: 6,
      CLUB: 12,
      SCHOOL: 10,
      ARENA: 25,
    };
    return increases[type] || 5;
  }

  private getProductionIncrease(type: string): number {
    const increases: Record<string, number> = {
      BOARD_WORKSHOP: 0.2,
      DICE_FACTORY: 0.5,
      CUPS_WORKSHOP: 0.3,
    };
    return increases[type] || 0;
  }
}
