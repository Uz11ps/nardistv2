import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить инвентарь пользователя
   */
  async getUserInventory(userId: number) {
    return this.prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        skin: true,
      },
      orderBy: { isEquipped: 'desc' },
    });
  }

  /**
   * Добавить предмет в инвентарь
   */
  async addItem(userId: number, skinId: number, rarity: string = 'COMMON') {
    const skin = await this.prisma.skin.findUnique({
      where: { id: skinId },
    });

    if (!skin) {
      throw new Error('Skin not found');
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
      throw new Error('Not enough power to equip this item');
    }

    // Создаем предмет
    return this.prisma.inventoryItem.create({
      data: {
        userId,
        skinId,
        rarity,
        durability: skin.durabilityMax,
        durabilityMax: skin.durabilityMax,
        weight: skin.weight,
        isEquipped: false,
      },
      include: {
        skin: true,
      },
    });
  }

  /**
   * Надеть/снять предмет
   */
  async toggleEquip(userId: number, itemId: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { skin: true },
    });

    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    if (item.isEquipped) {
      // Снимаем
      return this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { isEquipped: false },
      });
    } else {
      // Проверяем вес перед надеванием
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
      const totalWeight = currentWeight + item.skin.weight;

      if (totalWeight > user.powerMax) {
        throw new Error('Not enough power to equip this item');
      }

      // Надеваем
      return this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { isEquipped: true },
      });
    }
  }

  /**
   * Применить износ к предмету
   */
  async applyWear(userId: number, itemId: number, wearAmount: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const newDurability = Math.max(0, item.durability - wearAmount);

    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: { durability: newDurability },
    });
  }

  /**
   * Применить износ к надетым предметам после игры
   */
  async applyGameWear(userId: number, gameMode: string) {
    const equippedItems = await this.prisma.inventoryItem.findMany({
      where: {
        userId,
        isEquipped: true,
      },
      include: { skin: true },
    });

    const wearAmounts: Record<string, number> = {
      BOARD: 1, // Доска изнашивается на 1 за игру
      DICE: 2, // Зарики изнашиваются на 2 за игру
      CHECKERS: 0.5, // Фишки медленнее
      CUP: 0.3, // Стакан еще медленнее
      FRAME: 0.1, // Рамка почти не изнашивается
    };

    const updates = [];
    for (const item of equippedItems) {
      const wearAmount = wearAmounts[item.skin.type] || 0;
      if (wearAmount > 0) {
        const newDurability = Math.max(0, item.durability - wearAmount);
        updates.push(
          this.prisma.inventoryItem.update({
            where: { id: item.id },
            data: { durability: newDurability },
          }),
        );
      }
    }

    await Promise.all(updates);

    return { itemsWorn: equippedItems.length };
  }

  /**
   * Отремонтировать предмет
   */
  async repairItem(userId: number, itemId: number, repairType: 'PARTIAL' | 'FULL') {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { skin: true },
    });

    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const durabilityLost = item.durabilityMax - item.durability;
    if (durabilityLost === 0) {
      return item; // Уже полностью отремонтирован
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

    // Списываем стоимость
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: repairCost },
      },
    });

    return { item: updated, cost: repairCost };
  }
}

