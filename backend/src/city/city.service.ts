import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CityService {
  constructor(private readonly db: DatabaseService) {}

  async getUserCity(userId: number) {
    return await this.db.findMany('city_buildings', { userId }, { orderBy: '"buildingType" ASC' });
  }

  async collectIncome(userId: number, buildingType: string) {
    const building = await this.db.query(
      'SELECT * FROM city_buildings WHERE "userId" = $1 AND "buildingType" = $2 LIMIT 1',
      [userId, buildingType]
    ).then(r => r.rows[0]);

    if (!building) {
      throw new Error('Building not found');
    }

    const now = new Date();
    const lastCollected = building.lastCollected || building.createdAt;
    const hoursPassed = (now.getTime() - new Date(lastCollected).getTime()) / (1000 * 60 * 60);
    const income = Math.floor(hoursPassed * building.incomePerHour);
    const maxIncome = building.incomePerHour * 24;
    const finalIncome = Math.min(income, maxIncome);

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE city_buildings SET "lastCollected" = $1 WHERE id = $2',
        [now, building.id]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [finalIncome, userId]
      );
    });

    return { income: finalIncome, collectedAt: now };
  }

  async upgradeBuilding(userId: number, buildingType: string) {
    const building = await this.db.query(
      'SELECT * FROM city_buildings WHERE "userId" = $1 AND "buildingType" = $2 LIMIT 1',
      [userId, buildingType]
    ).then(r => r.rows[0]);

    if (!building) {
      throw new Error('Building not found');
    }

    const upgradeCost = building.level * 100;
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.narCoin < upgradeCost) {
      throw new Error('Not enough coins');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [upgradeCost, userId]
      );
      await client.query(
        'UPDATE city_buildings SET level = level + 1, "incomePerHour" = "incomePerHour" + $1, "updatedAt" = $2 WHERE id = $3',
        [building.level * 10, new Date(), building.id]
      );
    });

    return await this.db.findOne('city_buildings', { id: building.id });
  }
}
