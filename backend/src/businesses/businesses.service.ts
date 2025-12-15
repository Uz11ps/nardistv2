import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать предприятие
   */
  async createBusiness(data: {
    userId: number;
    districtId: number;
    type: string;
  }) {
    // Проверяем, что у игрока достаточно NAR для создания
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const creationCost = this.getBusinessCreationCost(data.type);
    if (user.narCoin < creationCost) {
      throw new Error('Not enough NAR coins');
    }

    // Проверяем, что такого предприятия еще нет
    const existing = await this.prisma.business.findUnique({
      where: {
        userId_districtId_type: {
          userId: data.userId,
          districtId: data.districtId,
          type: data.type,
        },
      },
    });

    if (existing) {
      throw new Error('Business already exists');
    }

    // Создаем предприятие
    const business = await this.prisma.business.create({
      data: {
        userId: data.userId,
        districtId: data.districtId,
        type: data.type,
        level: 1,
        incomePerHour: this.getBaseIncomePerHour(data.type),
        productionPerHour: this.getBaseProductionPerHour(data.type),
        storageLimit: this.getBaseStorageLimit(data.type),
        maintenanceCost: this.getBaseMaintenanceCost(data.type),
      },
    });

    // Списываем стоимость создания
    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        narCoin: { decrement: creationCost },
      },
    });

    return business;
  }

  /**
   * Получить предприятия пользователя
   */
  async getUserBusinesses(userId: number) {
    return this.prisma.business.findMany({
      where: { userId },
      include: {
        district: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить предприятия в районе
   */
  async getDistrictBusinesses(districtId: number) {
    return this.prisma.business.findMany({
      where: { districtId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    });
  }

  /**
   * Собрать доход с предприятия
   */
  async collectIncome(userId: number, businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    const now = new Date();
    const lastCollected = business.lastCollected || business.createdAt;
    const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
    const income = Math.floor(hoursPassed * business.incomePerHour);

    // Максимальный доход за раз (кап 24 часа)
    const maxIncome = business.incomePerHour * 24;
    const finalIncome = Math.min(income, maxIncome);

    // Обновляем время сбора
    await this.prisma.business.update({
      where: { id: businessId },
      data: { lastCollected: now },
    });

    // Начисляем доход
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { increment: finalIncome },
      },
    });

    return { income: finalIncome, collectedAt: now };
  }

  /**
   * Улучшить предприятие
   */
  async upgradeBusiness(userId: number, businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    const upgradeCost = this.getUpgradeCost(business.type, business.level);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.narCoin < upgradeCost) {
      throw new Error('Not enough NAR coins');
    }

    // Улучшаем предприятие
    const upgraded = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        level: { increment: 1 },
        incomePerHour: { increment: this.getIncomeIncrease(business.type) },
        productionPerHour: business.productionPerHour
          ? { increment: this.getProductionIncrease(business.type) }
          : undefined,
        storageLimit: business.storageLimit
          ? { increment: this.getStorageIncrease(business.type) }
          : undefined,
        maintenanceCost: { increment: this.getMaintenanceIncrease(business.type) },
      },
    });

    // Списываем стоимость
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: upgradeCost },
      },
    });

    return upgraded;
  }

  /**
   * Произвести ресурсы (для производственных предприятий)
   */
  async produceResources(userId: number, businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId || !business.productionPerHour) {
      throw new Error('Business not found or not a production business');
    }

    const now = new Date();
    const lastProduced = business.lastProduced || business.createdAt;
    const hoursPassed = (now.getTime() - lastProduced.getTime()) / (1000 * 60 * 60);
    const produced = Math.floor(hoursPassed * business.productionPerHour);

    if (produced === 0) {
      return { produced: 0, message: 'No resources produced yet' };
    }

    // Проверяем лимит склада
    const availableSpace = (business.storageLimit || 0) - business.storageCurrent;
    const finalProduced = Math.min(produced, availableSpace);

    if (finalProduced === 0) {
      return { produced: 0, message: 'Storage is full' };
    }

    // Обновляем предприятие (накапливаем на складе)
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        storageCurrent: { increment: finalProduced },
        lastProduced: now,
      },
    });

    return { produced: finalProduced, storageCurrent: business.storageCurrent + finalProduced };
  }

  /**
   * Собрать произведенные ресурсы
   */
  async collectResources(userId: number, businessId: number, amount: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    if (business.storageCurrent < amount) {
      throw new Error('Not enough resources in storage');
    }

    const resourceType = this.getResourceTypeForBusiness(business.type);

    // Уменьшаем склад
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        storageCurrent: { decrement: amount },
      },
    });

    // Добавляем ресурсы игроку
    await this.addResourceToUser(userId, resourceType, amount);

    return { collected: amount, resourceType };
  }

  // Вспомогательные методы для расчета стоимости и параметров

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
    const income: Record<string, number> = {
      COURT_TABLE: 5,
      BOARD_WORKSHOP: 20,
      DICE_FACTORY: 30,
      CUPS_WORKSHOP: 25,
      CLUB: 50,
      SCHOOL: 40,
      ARENA: 100,
    };
    return income[type] || 10;
  }

  private getBaseProductionPerHour(type: string): number | null {
    const production: Record<string, number> = {
      BOARD_WORKSHOP: 1,
      DICE_FACTORY: 2,
      CUPS_WORKSHOP: 1,
    };
    return production[type] || null;
  }

  private getBaseStorageLimit(type: string): number | null {
    const storage: Record<string, number> = {
      BOARD_WORKSHOP: 50,
      DICE_FACTORY: 100,
      CUPS_WORKSHOP: 75,
    };
    return storage[type] || null;
  }

  private getBaseMaintenanceCost(type: string): number {
    const maintenance: Record<string, number> = {
      COURT_TABLE: 1,
      BOARD_WORKSHOP: 5,
      DICE_FACTORY: 10,
      CUPS_WORKSHOP: 7,
      CLUB: 15,
      SCHOOL: 12,
      ARENA: 30,
    };
    return maintenance[type] || 5;
  }

  private getUpgradeCost(type: string, level: number): number {
    const baseCost = this.getBusinessCreationCost(type);
    return baseCost * level * 2;
  }

  private getIncomeIncrease(type: string): number {
    return this.getBaseIncomePerHour(type) * 0.5;
  }

  private getProductionIncrease(type: string): number {
    const base = this.getBaseProductionPerHour(type);
    return base ? Math.ceil(base * 0.3) : 0;
  }

  private getStorageIncrease(type: string): number {
    const base = this.getBaseStorageLimit(type);
    return base ? Math.ceil(base * 0.2) : 0;
  }

  private getMaintenanceIncrease(type: string): number {
    return this.getBaseMaintenanceCost(type) * 0.3;
  }

  private getResourceTypeForBusiness(type: string): string {
    const mapping: Record<string, string> = {
      BOARD_WORKSHOP: 'WOOD',
      DICE_FACTORY: 'BONE',
      CUPS_WORKSHOP: 'METAL',
    };
    return mapping[type] || 'WOOD';
  }

  private async addResourceToUser(userId: number, resourceType: string, amount: number) {
    await this.prisma.resource.upsert({
      where: {
        userId_type: {
          userId,
          type: resourceType,
        },
      },
      create: {
        userId,
        type: resourceType,
        amount,
      },
      update: {
        amount: { increment: amount },
      },
    });
  }

  /**
   * Крафт скина из ресурсов на предприятии
   */
  async craftSkin(userId: number, businessId: number, skinId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    // Получаем скин
    const skin = await this.prisma.skin.findUnique({
      where: { id: skinId },
    });

    if (!skin || !skin.isActive) {
      throw new Error('Skin not found or not available');
    }

    // Получаем рецепт крафта для этого типа скина и предприятия
    const recipe = this.getCraftRecipe(business.type, skin.type);
    if (!recipe) {
      throw new Error('This business cannot craft this type of skin');
    }

    // Проверяем наличие ресурсов у игрока
    const userResources = await this.prisma.resource.findMany({
      where: { userId },
    });

    const resourceMap = new Map(userResources.map((r) => [r.type, r.amount]));

    // Проверяем все необходимые ресурсы
    for (const [resourceType, requiredAmount] of Object.entries(recipe.resources)) {
      const available = resourceMap.get(resourceType) || 0;
      if (available < requiredAmount) {
        throw new Error(`Not enough ${resourceType}. Required: ${requiredAmount}, Available: ${available}`);
      }
    }

    // Списываем ресурсы
    for (const [resourceType, requiredAmount] of Object.entries(recipe.resources)) {
      await this.prisma.resource.update({
        where: {
          userId_type: {
            userId,
            type: resourceType,
          },
        },
        data: {
          amount: { decrement: requiredAmount },
        },
      });
    }

    // Проверяем вес (силу игрока)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventoryItems: {
          where: { isEquipped: true },
          include: { skin: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentWeight = user.inventoryItems.reduce(
      (sum, item) => sum + item.skin.weight,
      0,
    );
    const totalWeight = currentWeight + skin.weight;

    if (totalWeight > user.powerMax) {
      throw new Error('Not enough power to carry this item');
    }

    // Создаем предмет в инвентаре
    const item = await this.prisma.inventoryItem.create({
      data: {
        userId,
        skinId,
        rarity: skin.rarity,
        durability: skin.durabilityMax,
        durabilityMax: skin.durabilityMax,
        weight: skin.weight,
        isEquipped: false,
      },
      include: {
        skin: true,
      },
    });

    return { success: true, item };
  }

  /**
   * Получить доступные рецепты крафта для предприятия
   */
  async getCraftRecipes(businessId: number) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    const recipes = this.getAllCraftRecipes(business.type);
    
    // Получаем все доступные скины для крафта
    const craftableSkinTypes = recipes.map((r) => r.skinType);
    const skins = await this.prisma.skin.findMany({
      where: {
        type: { in: craftableSkinTypes },
        isActive: true,
        rarity: { in: ['COMMON', 'RARE'] }, // Можно крафтить только обычные и редкие
      },
    });

    // Связываем скины с рецептами
    return skins.map((skin) => {
      const recipe = recipes.find((r) => r.skinType === skin.type);
      return {
        skin,
        recipe: recipe ? recipe.resources : null,
      };
    });
  }

  /**
   * Получить рецепт крафта для типа предприятия и типа скина
   */
  private getCraftRecipe(businessType: string, skinType: string): { resources: Record<string, number> } | null {
    const recipes: Record<string, Record<string, { resources: Record<string, number> }>> = {
      BOARD_WORKSHOP: {
        BOARD: {
          resources: {
            WOOD: 10,
            METAL: 2,
          },
        },
      },
      DICE_FACTORY: {
        DICE: {
          resources: {
            BONE: 5,
            PLASTIC: 3,
          },
        },
      },
      CUPS_WORKSHOP: {
        CUP: {
          resources: {
            METAL: 8,
            LEATHER: 2,
          },
        },
        CHECKERS: {
          resources: {
            WOOD: 5,
            METAL: 1,
          },
        },
      },
    };

    return recipes[businessType]?.[skinType] || null;
  }

  /**
   * Получить все рецепты для типа предприятия
   */
  private getAllCraftRecipes(businessType: string): Array<{ skinType: string; resources: Record<string, number> }> {
    const recipes: Record<string, Array<{ skinType: string; resources: Record<string, number> }>> = {
      BOARD_WORKSHOP: [
        {
          skinType: 'BOARD',
          resources: {
            WOOD: 10,
            METAL: 2,
          },
        },
      ],
      DICE_FACTORY: [
        {
          skinType: 'DICE',
          resources: {
            BONE: 5,
            PLASTIC: 3,
          },
        },
      ],
      CUPS_WORKSHOP: [
        {
          skinType: 'CUP',
          resources: {
            METAL: 8,
            LEATHER: 2,
          },
        },
        {
          skinType: 'CHECKERS',
          resources: {
            WOOD: 5,
            METAL: 1,
          },
        },
      ],
    };

    return recipes[businessType] || [];
  }

  /**
   * Отремонтировать предмет через предприятие
   * @param userId - ID игрока, который ремонтирует
   * @param businessId - ID предприятия (мастерской)
   * @param itemId - ID предмета для ремонта
   * @param repairType - Тип ремонта (PARTIAL/FULL)
   */
  async repairItemAtBusiness(
    userId: number,
    businessId: number,
    itemId: number,
    repairType: 'PARTIAL' | 'FULL',
  ) {
    // Проверяем предприятие
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // Проверяем, что это мастерская (может ремонтировать)
    const canRepair = ['BOARD_WORKSHOP', 'DICE_FACTORY', 'CUPS_WORKSHOP'].includes(business.type);
    if (!canRepair) {
      throw new Error('This business cannot repair items');
    }

    // Получаем предмет
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { skin: true },
    });

    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const durabilityLost = item.durabilityMax - item.durability;
    if (durabilityLost === 0) {
      throw new Error('Item is already fully repaired');
    }

    // Расчет стоимости ремонта
    const repairCostPartial = Math.floor(
      (durabilityLost / item.durabilityMax) * item.skin.priceCoin * 0.3,
    );
    const repairCostFull = Math.floor(item.skin.priceCoin * 0.5);
    const repairCost = repairType === 'FULL' ? repairCostFull : repairCostPartial;

    // Проверяем баланс
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.narCoin < repairCost) {
      throw new Error('Not enough NAR coins');
    }

    // Распределение оплаты:
    // 60% владельцу предприятия, 40% сжигается системой
    const ownerShare = Math.floor(repairCost * 0.6);
    const burnedAmount = repairCost - ownerShare;

    // Восстанавливаем прочность
    const durabilityRestored =
      repairType === 'FULL' ? durabilityLost : Math.floor(durabilityLost * 0.5);

    // Обновляем предмет
    const updated = await this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        durability: Math.min(
          item.durabilityMax,
          item.durability + durabilityRestored,
        ),
      },
    });

    // Списываем у ремонтирующего
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: repairCost },
      },
    });

    // Начисляем владельцу предприятия (если это не его же предмет)
    if (business.userId !== userId && ownerShare > 0) {
      await this.prisma.user.update({
        where: { id: business.userId },
        data: {
          narCoin: { increment: ownerShare },
        },
      });
    }

    // 40% сжигается (не начисляется никому) - это механизм дефляции
    // Можно добавить логирование сжигания для статистики
    console.log(`Burned ${burnedAmount} NAR from repair at business ${businessId} (item ${itemId})`);

    return {
      item: updated,
      cost: repairCost,
      ownerShare,
      burnedAmount,
      message: `Item repaired. ${ownerShare > 0 ? `${ownerShare} NAR paid to business owner. ` : ''}${burnedAmount} NAR burned.`,
    };
  }

  /**
   * Получить предприятия, которые могут ремонтировать определенный тип предмета
   */
  async getRepairBusinesses(itemType: string, districtId?: number) {
    // Определяем, какие типы предприятий могут ремонтировать этот тип предмета
    const businessTypeMap: Record<string, string[]> = {
      BOARD: ['BOARD_WORKSHOP'],
      DICE: ['DICE_FACTORY'],
      CHECKERS: ['CUPS_WORKSHOP'],
      CUP: ['CUPS_WORKSHOP'],
      FRAME: ['BOARD_WORKSHOP', 'CUPS_WORKSHOP'],
    };

    const allowedTypes = businessTypeMap[itemType] || [];
    if (allowedTypes.length === 0) {
      return [];
    }

    const where: any = {
      type: { in: allowedTypes },
    };

    if (districtId) {
      where.districtId = districtId;
    }

    return this.prisma.business.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    });
  }

  /**
   * Работа по найму на предприятии
   * Игрок тратит энергию и получает NAR
   * @param workerId - ID игрока, который работает
   * @param businessId - ID предприятия
   * @param hours - Количество часов работы (1 час = 10 энергии = зарплата)
   */
  async workAtBusiness(workerId: number, businessId: number, hours: number = 1) {
    // Проверяем предприятие
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { user: true },
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // Проверяем игрока
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new Error('Worker not found');
    }

    // Нельзя работать на своем предприятии
    if (business.userId === workerId) {
      throw new Error('Cannot work at your own business');
    }

    // Расчет: 1 час работы = 10 энергии = зарплата
    const energyCost = hours * 10;
    const salary = this.calculateSalary(business.type, business.level, hours);

    // Проверяем энергию
    if (worker.energy < energyCost) {
      throw new Error(`Not enough energy. Required: ${energyCost}, Available: ${worker.energy}`);
    }

    // Проверяем, что у владельца есть деньги для зарплаты
    if (business.user.narCoin < salary) {
      throw new Error('Business owner does not have enough NAR to pay salary');
    }

    // Списываем энергию у работника
    await this.prisma.user.update({
      where: { id: workerId },
      data: {
        energy: { decrement: energyCost },
      },
    });

    // Начисляем зарплату работнику
    await this.prisma.user.update({
      where: { id: workerId },
      data: {
        narCoin: { increment: salary },
      },
    });

    // Списываем зарплату у владельца
    await this.prisma.user.update({
      where: { id: business.userId },
      data: {
        narCoin: { decrement: salary },
      },
    });

    return {
      success: true,
      energySpent: energyCost,
      salary,
      hours,
    };
  }

  /**
   * Получить доступные вакансии (предприятия, где можно работать)
   */
  async getAvailableJobs(districtId?: number) {
    // Возвращаем вакансии вместо предприятий
    if (districtId) {
      return this.getDistrictJobPostings(districtId);
    }
    // Если districtId не указан, возвращаем все активные вакансии
    return this.prisma.jobPosting.findMany({
      where: { isActive: true },
      include: {
        business: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
              },
            },
            district: true,
          },
        },
        employees: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailableJobsOld(districtId?: number) {
    const where: any = {};
    if (districtId) {
      where.districtId = districtId;
    }

    const businesses = await this.prisma.business.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            narCoin: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    });

    // Фильтруем предприятия, у владельцев которых есть деньги для зарплаты
    return businesses
      .filter((business) => {
        const minSalary = this.calculateSalary(business.type, business.level, 1);
        return business.user.narCoin >= minSalary;
      })
      .map((business) => ({
        ...business,
        hourlySalary: this.calculateSalary(business.type, business.level, 1),
      }));
  }

  /**
   * Расчет зарплаты за работу
   */
  private calculateSalary(businessType: string, level: number, hours: number): number {
    // Базовая зарплата зависит от типа предприятия и уровня
    const baseSalaries: Record<string, number> = {
      COURT_TABLE: 5,
      BOARD_WORKSHOP: 15,
      DICE_FACTORY: 20,
      CUPS_WORKSHOP: 18,
      CLUB: 30,
      SCHOOL: 25,
      ARENA: 50,
    };

    const baseSalary = baseSalaries[businessType] || 10;
    // Зарплата увеличивается с уровнем предприятия
    const salaryPerHour = baseSalary * (1 + (level - 1) * 0.2);
    return Math.floor(salaryPerHour * hours);
  }

  /**
   * Создать вакансию на предприятии
   */
  async createJobPosting(businessId: number, ownerId: number, data: {
    title: string;
    description?: string;
    salaryPerHour: number;
    energyPerHour?: number;
    maxWorkers?: number;
  }) {
    // Проверяем, что пользователь является владельцем предприятия
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.userId !== ownerId) {
      throw new Error('Business not found or user is not the owner');
    }

    return this.prisma.jobPosting.create({
      data: {
        businessId,
        title: data.title,
        description: data.description,
        salaryPerHour: data.salaryPerHour,
        energyPerHour: data.energyPerHour || 10,
        maxWorkers: data.maxWorkers || 1,
        isActive: true,
      },
    });
  }

  /**
   * Получить вакансии предприятия
   */
  async getBusinessJobPostings(businessId: number) {
    return this.prisma.jobPosting.findMany({
      where: { businessId, isActive: true },
      include: {
        employees: {
          include: {
            worker: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Получить все активные вакансии в районе
   */
  async getDistrictJobPostings(districtId: number) {
    return this.prisma.jobPosting.findMany({
      where: {
        business: {
          districtId,
        },
        isActive: true,
      },
      include: {
        business: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
              },
            },
            district: true,
          },
        },
        employees: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Удалить/деактивировать вакансию
   */
  async deleteJobPosting(jobPostingId: number, ownerId: number) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: { business: true },
    });

    if (!jobPosting || jobPosting.business.userId !== ownerId) {
      throw new Error('Job posting not found or user is not the owner');
    }

    return this.prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: { isActive: false },
    });
  }

  /**
   * Устроиться на вакансию
   */
  async applyForJob(jobPostingId: number, workerId: number) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        business: true,
        employees: true,
      },
    });

    if (!jobPosting || !jobPosting.isActive) {
      throw new Error('Job posting not found or not active');
    }

    // Проверяем лимит работников
    if (jobPosting.employees.length >= jobPosting.maxWorkers) {
      throw new Error('Job posting is full');
    }

    // Проверяем, не устроен ли уже
    const existing = jobPosting.employees.find(e => e.workerId === workerId);
    if (existing) {
      throw new Error('Already working at this job');
    }

    // Нельзя работать на своем предприятии
    if (jobPosting.business.userId === workerId) {
      throw new Error('Cannot work at your own business');
    }

    return this.prisma.jobEmployee.create({
      data: {
        jobPostingId,
        workerId,
      },
    });
  }

  /**
   * Работать на вакансии (обновленная версия)
   */
  async workAtJob(jobPostingId: number, workerId: number, hours: number = 1) {
    const jobPosting = await this.prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        business: {
          include: { user: true },
        },
        employees: {
          where: { workerId },
        },
      },
    });

    if (!jobPosting || !jobPosting.isActive) {
      throw new Error('Job posting not found or not active');
    }

    // Проверяем, устроен ли работник
    const employee = jobPosting.employees[0];
    if (!employee) {
      throw new Error('Not hired for this job. Apply first.');
    }

    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new Error('Worker not found');
    }

    const energyCost = hours * jobPosting.energyPerHour;
    const salary = jobPosting.salaryPerHour * hours;

    // Проверяем энергию
    if (worker.energy < energyCost) {
      throw new Error(`Not enough energy. Required: ${energyCost}, Available: ${worker.energy}`);
    }

    // Проверяем, что у владельца есть деньги для зарплаты
    if (jobPosting.business.user.narCoin < salary) {
      throw new Error('Business owner does not have enough NAR to pay salary');
    }

    // Списываем энергию у работника
    await this.prisma.user.update({
      where: { id: workerId },
      data: {
        energy: { decrement: energyCost },
      },
    });

    // Начисляем зарплату работнику
    await this.prisma.user.update({
      where: { id: workerId },
      data: {
        narCoin: { increment: salary },
      },
    });

    // Списываем зарплату у владельца
    await this.prisma.user.update({
      where: { id: jobPosting.business.userId },
      data: {
        narCoin: { decrement: salary },
      },
    });

    // Обновляем статистику работника
    await this.prisma.jobEmployee.update({
      where: { id: employee.id },
      data: {
        hoursWorked: { increment: hours },
        totalEarned: { increment: salary },
        lastWorked: new Date(),
      },
    });

    return {
      salary,
      energyCost,
      hoursWorked: employee.hoursWorked + hours,
      totalEarned: employee.totalEarned + salary,
    };
  }
}

