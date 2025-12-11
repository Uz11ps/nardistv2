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
}

