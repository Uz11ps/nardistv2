import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TournamentsService } from '../tournaments/tournaments.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.db.query(
        `SELECT * FROM users ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2`,
        [limit, skip]
      ).then(r => r.rows),
      this.db.count('users'),
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
    return { success: true, message: 'User banned' };
  }

  async unbanUser(userId: number) {
    return { success: true, message: 'User unbanned' };
  }

  async getTournaments() {
    const tournaments = await this.db.findMany('tournaments', undefined, { orderBy: '"createdAt" DESC' });

    return await Promise.all(
      tournaments.map(async (tournament) => {
        const participants = await this.db.query(
          `SELECT tp.*, u.id as "userId", u.nickname, u."firstName"
           FROM tournament_participants tp
           JOIN users u ON tp."userId" = u.id
           WHERE tp."tournamentId" = $1`,
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
            },
          })),
        };
      })
    );
  }

  async createTournament(data: any) {
    return this.tournamentsService.createTournament(data);
  }

  async updateTournament(tournamentId: number, data: any) {
    return await this.db.update('tournaments',
      { id: tournamentId },
      { ...data, updatedAt: new Date() }
    );
  }

  async startTournament(tournamentId: number) {
    return await this.db.update('tournaments',
      { id: tournamentId },
      { status: 'IN_PROGRESS', updatedAt: new Date() }
    );
  }

  async finishTournament(tournamentId: number) {
    return await this.db.update('tournaments',
      { id: tournamentId },
      { status: 'FINISHED', endDate: new Date(), updatedAt: new Date() }
    );
  }

  async getArticles() {
    return await this.db.findMany('academy_articles', undefined, { orderBy: '"createdAt" DESC' });
  }

  async getArticleById(id: number) {
    return await this.db.findOne('academy_articles', { id });
  }

  async createArticle(data: {
    title: string;
    content: string;
    category?: string;
    isPaid?: boolean;
    priceCoin?: number;
  }) {
    return await this.db.create('academy_articles', {
      ...data,
      isPublished: false,
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateArticle(id: number, data: any) {
    return await this.db.update('academy_articles',
      { id },
      { ...data, updatedAt: new Date() }
    );
  }

  async deleteArticle(id: number) {
    await this.db.delete('academy_articles', { id });
    return { success: true };
  }

  async publishArticle(id: number) {
    return await this.db.update('academy_articles',
      { id },
      { isPublished: true, updatedAt: new Date() }
    );
  }

  async unpublishArticle(id: number) {
    return await this.db.update('academy_articles',
      { id },
      { isPublished: false, updatedAt: new Date() }
    );
  }

  async getSkins() {
    const skins = await this.db.findMany('skins', undefined, { orderBy: '"createdAt" DESC' });
    
    // Загружаем связанные данные для каждого скина
    return await Promise.all(skins.map(async (skin) => {
      const inventoryItems = await this.db.query(
        'SELECT id, "userId" FROM inventory_items WHERE "skinId" = $1',
        [skin.id]
      );
      
      const marketListings = await this.db.query(
        'SELECT id, price, status FROM market_listings WHERE "skinId" = $1',
        [skin.id]
      );
      
      return {
        ...skin,
        inventoryItems: inventoryItems.rows,
        marketListings: marketListings.rows,
      };
    }));
  }

  async getSkinById(id: number) {
    const skin = await this.db.findOne('skins', { id });
    if (!skin) {
      return null;
    }
    
    const inventoryItems = await this.db.query(
      `SELECT ii.*, u.id as "userId", u.nickname, u."firstName"
       FROM inventory_items ii
       JOIN users u ON ii."userId" = u.id
       WHERE ii."skinId" = $1`,
      [id]
    );
    
    const marketListings = await this.db.query(
      `SELECT ml.*, u.id as "userId", u.nickname, u."firstName"
       FROM market_listings ml
       JOIN users u ON ml."userId" = u.id
       WHERE ml."skinId" = $1`,
      [id]
    );
    
    return {
      ...skin,
      inventoryItems: inventoryItems.rows.map(item => ({
        ...item,
        user: {
          id: item.userId,
          nickname: item.nickname,
          firstName: item.firstName,
        },
      })),
      marketListings: marketListings.rows.map(listing => ({
        ...listing,
        user: {
          id: listing.userId,
          nickname: listing.nickname,
          firstName: listing.firstName,
        },
      })),
    };
  }

  async createSkin(data: {
    name: string;
    type: string;
    previewUrl: string;
    rarity?: string;
    weight?: number;
    durabilityMax?: number;
    priceCoin?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    return await this.db.create('skins', {
      name: data.name,
      type: data.type,
      previewUrl: data.previewUrl,
      rarity: data.rarity || 'COMMON',
      weight: data.weight || 1,
      durabilityMax: data.durabilityMax || 100,
      priceCoin: data.priceCoin || 0,
      isDefault: data.isDefault || false,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateSkin(id: number, data: {
    name?: string;
    type?: string;
    previewUrl?: string;
    rarity?: string;
    weight?: number;
    durabilityMax?: number;
    priceCoin?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    return await this.db.update('skins',
      { id },
      { ...data, updatedAt: new Date() }
    );
  }

  async activateSkin(id: number) {
    return await this.db.update('skins',
      { id },
      { isActive: true, updatedAt: new Date() }
    );
  }

  async deactivateSkin(id: number) {
    return await this.db.update('skins',
      { id },
      { isActive: false, updatedAt: new Date() }
    );
  }

  async deleteSkin(id: number) {
    // Проверяем, используется ли скин
    const inventoryItems = await this.db.query(
      'SELECT COUNT(*) as count FROM inventory_items WHERE "skinId" = $1',
      [id]
    );
    
    const marketListings = await this.db.query(
      'SELECT COUNT(*) as count FROM market_listings WHERE "skinId" = $1',
      [id]
    );

    const skin = await this.db.findOne('skins', { id });
    if (!skin) {
      throw new Error('Skin not found');
    }

    if (parseInt(inventoryItems.rows[0].count) > 0 || parseInt(marketListings.rows[0].count) > 0) {
      throw new Error('Cannot delete skin that is in use. Deactivate it instead.');
    }

    await this.db.delete('skins', { id });
    return { success: true };
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
      this.db.count('users'),
      this.db.query(
        'SELECT COUNT(*) as count FROM users WHERE "updatedAt" >= $1',
        [new Date(Date.now() - 24 * 60 * 60 * 1000)]
      ).then(r => parseInt(r.rows[0].count, 10)),
      this.db.count('game_history'),
      this.db.query(
        'SELECT COUNT(*) as count FROM game_history WHERE "createdAt" >= $1',
        [todayStart]
      ).then(r => parseInt(r.rows[0].count, 10)),
      this.db.query(
        'SELECT COUNT(*) as count FROM game_history WHERE "createdAt" >= $1 AND "createdAt" < $2',
        [yesterdayStart, todayStart]
      ).then(r => parseInt(r.rows[0].count, 10)),
      this.db.count('tournaments'),
      this.db.count('tournaments', { status: 'IN_PROGRESS' }),
      this.db.query(
        'SELECT COALESCE(SUM(commission), 0) as total FROM game_history WHERE commission IS NOT NULL'
      ).then(r => parseFloat(r.rows[0].total || 0)),
      this.db.query(
        'SELECT COALESCE(SUM(commission), 0) as total FROM game_history WHERE "createdAt" >= $1 AND commission IS NOT NULL',
        [todayStart]
      ).then(r => parseFloat(r.rows[0].total || 0)),
      this.db.query(
        'SELECT mode, COUNT(*) as count FROM game_history GROUP BY mode'
      ).then(r => r.rows),
      this.getUserActivityForLast7Days(),
    ]);

    const usersLastMonth = await this.db.query(
      'SELECT COUNT(*) as count FROM users WHERE "createdAt" >= $1 AND "createdAt" < $2',
      [monthAgo, weekAgo]
    ).then(r => parseInt(r.rows[0].count, 10));

    const usersThisMonth = totalUsers - usersLastMonth;
    const userTrend = usersLastMonth > 0 
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : 0;

    const gameTrend = gamesYesterday > 0
      ? Math.round(((gamesToday - gamesYesterday) / gamesYesterday) * 100)
      : 0;

    const revenueYesterdayData = await this.db.query(
      'SELECT COALESCE(SUM(commission), 0) as total FROM game_history WHERE "createdAt" >= $1 AND "createdAt" < $2 AND commission IS NOT NULL',
      [yesterdayStart, todayStart]
    ).then(r => parseFloat(r.rows[0].total || 0));

    const revenueYesterday = revenueYesterdayData;
    const revenueToday = revenueTodayData;
    const revenueTrend = revenueYesterday > 0
      ? Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)
      : 0;

    const totalGamesByMode = gamesByMode.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
    const shortGames = gamesByMode.find(item => item.mode === 'SHORT')?.count || 0;
    const longGames = gamesByMode.find(item => item.mode === 'LONG')?.count || 0;
    const shortPercentage = totalGamesByMode > 0 ? Math.round((parseInt(shortGames, 10) / totalGamesByMode) * 100) : 0;
    const longPercentage = totalGamesByMode > 0 ? Math.round((parseInt(longGames, 10) / totalGamesByMode) * 100) : 0;

    return {
      totalUsers,
      activeUsers,
      totalGames,
      gamesToday,
      totalTournaments,
      activeTournaments,
      totalRevenue: revenueData,
      revenueToday: revenueToday,
      userTrend,
      gameTrend,
      revenueTrend,
      gamesByMode: {
        short: parseInt(shortGames, 10),
        long: parseInt(longGames, 10),
        shortPercentage,
        longPercentage,
      },
      userActivity: userActivityData,
    };
  }

  private async getUserActivityForLast7Days(): Promise<number[]> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const activity: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await this.db.query(
        `SELECT COUNT(*) as count FROM users 
         WHERE ("createdAt" >= $1 AND "createdAt" < $2) 
         OR ("updatedAt" >= $1 AND "updatedAt" < $2)`,
        [dayStart, dayEnd]
      ).then(r => parseInt(r.rows[0].count, 10));

      activity.push(count);
    }

    return activity;
  }

  async getRecentGames(limit: number = 10) {
    const games = await this.db.query(
      `SELECT gh.*, 
              w.id as "whiteId", w.nickname as "whiteNickname", w."firstName" as "whiteFirstName", w."photoUrl" as "whitePhotoUrl",
              b.id as "blackId", b.nickname as "blackNickname", b."firstName" as "blackFirstName", b."photoUrl" as "blackPhotoUrl",
              d.id as "districtId", d.name as "districtName", d.icon as "districtIcon"
       FROM game_history gh
       LEFT JOIN users w ON gh."whitePlayerId" = w.id
       LEFT JOIN users b ON gh."blackPlayerId" = b.id
       LEFT JOIN districts d ON gh."districtId" = d.id
       ORDER BY gh."createdAt" DESC
       LIMIT $1`,
      [limit]
    );

    return games.rows.map(g => ({
      ...g,
      whitePlayer: {
        id: g.whiteId,
        nickname: g.whiteNickname,
        firstName: g.whiteFirstName,
        photoUrl: g.whitePhotoUrl,
      },
      blackPlayer: {
        id: g.blackId,
        nickname: g.blackNickname,
        firstName: g.blackFirstName,
        photoUrl: g.blackPhotoUrl,
      },
      district: g.districtId ? {
        id: g.districtId,
        name: g.districtName,
        icon: g.districtIcon,
      } : null,
    }));
  }

  async getGames(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [games, total] = await Promise.all([
      this.db.query(
        `SELECT gh.*, 
                w.id as "whiteId", w.nickname as "whiteNickname", w."firstName" as "whiteFirstName",
                b.id as "blackId", b.nickname as "blackNickname", b."firstName" as "blackFirstName"
         FROM game_history gh
         LEFT JOIN users w ON gh."whitePlayerId" = w.id
         LEFT JOIN users b ON gh."blackPlayerId" = b.id
         ORDER BY gh."createdAt" DESC
         LIMIT $1 OFFSET $2`,
        [limit, skip]
      ).then(r => r.rows.map(g => ({
        ...g,
        whitePlayer: {
          id: g.whiteId,
          nickname: g.whiteNickname,
          firstName: g.whiteFirstName,
        },
        blackPlayer: {
          id: g.blackId,
          nickname: g.blackNickname,
          firstName: g.blackFirstName,
        },
      }))),
      this.db.count('game_history'),
    ]);

    return {
      games,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getGameById(id: number) {
    const game = await this.db.query(
      `SELECT gh.*, 
              w.id as "whiteId", w.nickname as "whiteNickname", w."firstName" as "whiteFirstName", w.level as "whiteLevel",
              b.id as "blackId", b.nickname as "blackNickname", b."firstName" as "blackFirstName", b.level as "blackLevel"
       FROM game_history gh
       LEFT JOIN users w ON gh."whitePlayerId" = w.id
       LEFT JOIN users b ON gh."blackPlayerId" = b.id
       WHERE gh.id = $1`,
      [id]
    ).then(r => r.rows[0]);

    if (!game) {
      return null;
    }

    return {
      ...game,
      whitePlayer: {
        id: game.whiteId,
        nickname: game.whiteNickname,
        firstName: game.whiteFirstName,
        level: game.whiteLevel,
      },
      blackPlayer: {
        id: game.blackId,
        nickname: game.blackNickname,
        firstName: game.blackFirstName,
        level: game.blackLevel,
      },
      gameState: typeof game.gameState === 'string' ? JSON.parse(game.gameState) : game.gameState,
      moves: typeof game.moves === 'string' ? JSON.parse(game.moves) : game.moves,
    };
  }

  async getGameLogs(gameId: number) {
    const game = await this.db.findOne('game_history', { id: gameId });

    if (!game) {
      throw new Error('Game not found');
    }

    // Возвращаем детальную информацию о игре, включая все ходы и броски
    const moves = Array.isArray(game.moves) ? game.moves : [];
    const gameState = game.gameState as any || {};
    
    return {
      game,
      moves,
      gameState,
      rngSeed: gameState.seed || null,
      rngHash: gameState.seedHash || null,
      duration: game.duration,
      // Дополнительная информация о бросках кубиков
      diceRolls: this.extractDiceRolls(moves),
    };
  }

  private extractDiceRolls(moves: any[]): any[] {
    const diceRolls: any[] = [];
    moves.forEach((move, index) => {
      if (move.dice) {
        diceRolls.push({
          moveIndex: index,
          dice: move.dice,
          player: move.player,
          timestamp: move.timestamp,
        });
      }
    });
    return diceRolls;
  }

  async addCoins(userId: number, amount: number) {
    await this.db.query(
      'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
      [amount, userId]
    );
    return { success: true };
  }

  async getSettings() {
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
    return { success: true, settings };
  }

  async getQuests() {
    return await this.db.findMany('quests', undefined, { orderBy: '"createdAt" DESC' });
  }

  async getQuestById(id: number) {
    return await this.db.findOne('quests', { id });
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
          endDate = new Date(start);
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'FOREVER':
          endDate = null;
          break;
      }
    }

    return await this.db.create('quests', {
      ...data,
      endDate: endDate || null,
      isActive: data.isActive ?? true,
      isInfinite: data.isInfinite ?? false,
      isHoliday: data.isHoliday ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async updateQuest(id: number, data: any) {
    let endDate = data.endDate;
    if (data.durationType && !data.isInfinite) {
      const quest = await this.db.findOne('quests', { id });
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
        }
      }
    }

    return await this.db.update('quests',
      { id },
      { ...data, endDate: endDate, updatedAt: new Date() }
    );
  }

  async deleteQuest(id: number) {
    await this.db.delete('quests', { id });
    return { success: true };
  }

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

  async getBusinessConfigsForDistrict(districtId: number) {
    const district = await this.db.findOne('districts', { id: districtId });
    if (!district) {
      throw new Error('District not found');
    }

    const businessTypes = this.getBusinessTypesForDistrict(district.type);

    const configs = businessTypes.map(type => ({
      type,
      districtId,
      districtName: district.name,
      creationCost: this.getBusinessCreationCost(type),
      baseIncomePerHour: this.getBaseIncomePerHour(type),
      baseProductionPerHour: this.getBaseProductionPerHour(type),
      baseStorageLimit: this.getBaseStorageLimit(type),
      baseMaintenanceCost: this.getBaseMaintenanceCost(type),
      upgradeCostMultiplier: 2,
      incomeIncreasePerLevel: this.getIncomeIncrease(type),
      productionIncreasePerLevel: this.getProductionIncrease(type),
    }));

    return configs;
  }

  async getBusinessConfigs() {
    const businessTypes = [
      'COURT_TABLE',
      'BOARD_WORKSHOP',
      'DICE_FACTORY',
      'CUPS_WORKSHOP',
      'CLUB',
      'SCHOOL',
      'ARENA',
    ];

    const configs = businessTypes.map(type => ({
      type,
      creationCost: this.getBusinessCreationCost(type),
      baseIncomePerHour: this.getBaseIncomePerHour(type),
      baseProductionPerHour: this.getBaseProductionPerHour(type),
      baseStorageLimit: this.getBaseStorageLimit(type),
      baseMaintenanceCost: this.getBaseMaintenanceCost(type),
      upgradeCostMultiplier: 2,
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
    const district = await this.db.findOne('districts', { id: districtId });
    if (!district) {
      throw new Error('District not found');
    }

    const allowedTypes = this.getBusinessTypesForDistrict(district.type);
    if (!allowedTypes.includes(businessType)) {
      throw new Error(`Business type ${businessType} is not allowed in district ${district.type}`);
    }

    return { success: true, districtId, type: businessType, config };
  }

  async getAllDistricts() {
    const districts = await this.db.findMany('districts', undefined, { orderBy: 'id ASC' });

    return await Promise.all(
      districts.map(async (district) => {
        const [clan, fund, businessCount] = await Promise.all([
          district.clanId ? this.db.query(
            `SELECT c.*, u.id as "leaderId", u.nickname, u."firstName"
             FROM clans c
             LEFT JOIN users u ON c."leaderId" = u.id
             WHERE c.id = $1`,
            [district.clanId]
          ).then(r => r.rows[0]) : null,
          this.db.findOne('district_funds', { districtId: district.id }),
          this.db.count('businesses', { districtId: district.id }),
        ]);

        return {
          ...district,
          clan: clan ? {
            ...clan,
            leader: {
              id: clan.leaderId,
              nickname: clan.nickname,
              firstName: clan.firstName,
            },
          } : null,
          fund: fund || null,
          _count: {
            businesses: businessCount,
          },
        };
      })
    );
  }

  async updateDistrict(id: number, data: {
    name?: string;
    description?: string;
    icon?: string;
    commissionRate?: number;
  }) {
    return await this.db.update('districts',
      { id },
      { ...data, updatedAt: new Date() }
    );
  }

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
