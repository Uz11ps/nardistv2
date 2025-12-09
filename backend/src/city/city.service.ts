import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserCity(userId: number) {
    return this.prisma.cityBuilding.findMany({
      where: { userId },
      orderBy: { buildingType: 'asc' },
    });
  }

  async collectIncome(userId: number, buildingType: string) {
    const building = await this.prisma.cityBuilding.findUnique({
      where: {
        userId_buildingType: {
          userId,
          buildingType,
        },
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    const now = new Date();
    const lastCollected = building.lastCollected || building.createdAt;
    const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
    const income = Math.floor(hoursPassed * building.incomePerHour);

    // Максимальный доход за раз (кап)
    const maxIncome = building.incomePerHour * 24; // Максимум за 24 часа
    const finalIncome = Math.min(income, maxIncome);

    await this.prisma.cityBuilding.update({
      where: { id: building.id },
      data: { lastCollected: now },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { increment: finalIncome },
      },
    });

    return { income: finalIncome, collectedAt: now };
  }

  async upgradeBuilding(userId: number, buildingType: string) {
    const building = await this.prisma.cityBuilding.findUnique({
      where: {
        userId_buildingType: {
          userId,
          buildingType,
        },
      },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    const upgradeCost = building.level * 100; // Стоимость апгрейда

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.narCoin < upgradeCost) {
      throw new Error('Not enough coins');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: upgradeCost },
      },
    });

    return this.prisma.cityBuilding.update({
      where: { id: building.id },
      data: {
        level: { increment: 1 },
        incomePerHour: { increment: building.level * 10 },
      },
    });
  }
}

