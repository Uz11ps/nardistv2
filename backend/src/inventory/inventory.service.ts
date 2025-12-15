import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить инвентарь пользователя
   */
  async getUserInventory(userId: number) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        skin: true,
      },
      orderBy: { isEquipped: 'desc' },
    });

    // Добавляем вычисленные previewUrl для каждого предмета на основе состояния износа
    return items.map(item => {
      const visualState = this.getVisualState(item.durability, item.durabilityMax);
      const previewUrl = this.getPreviewUrlForState(item.skin.previewUrl, visualState);
      return {
        ...item,
        previewUrl, // Добавляем вычисленный previewUrl
        visualState, // Добавляем состояние износа
      };
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
   * @param userId - ID игрока
   * @param gameMode - Режим игры
   * @param diceRollsCount - Количество бросков кубиков (для износа зариков)
   */
  async applyGameWear(userId: number, gameMode: string, diceRollsCount?: number) {
    const equippedItems = await this.prisma.inventoryItem.findMany({
      where: {
        userId,
        isEquipped: true,
      },
      include: { skin: true },
    });

    const updates = [];
    for (const item of equippedItems) {
      let wearAmount = 0;

      if (item.skin.type === 'DICE') {
        // Зарики изнашиваются по количеству бросков
        // 1 бросок = 0.1 износа (1000 бросков = 100 износа)
        if (diceRollsCount && diceRollsCount > 0) {
          wearAmount = diceRollsCount * 0.1;
        } else {
          // Fallback: если не указано количество бросков, используем старую логику
          wearAmount = 2;
        }
      } else {
        // Остальные предметы изнашиваются по играм
        const wearAmounts: Record<string, number> = {
          BOARD: 1, // Доска изнашивается на 1 за игру
          CHECKERS: 0.5, // Фишки медленнее
          CUP: 0.3, // Стакан еще медленнее
          FRAME: 0.1, // Рамка почти не изнашивается
        };
        wearAmount = wearAmounts[item.skin.type] || 0;
      }

      if (wearAmount > 0) {
        const newDurability = Math.max(0, item.durability - wearAmount);
        const visualState = this.getVisualState(newDurability, item.durabilityMax);
        const newPreviewUrl = this.getPreviewUrlForState(item.skin.previewUrl, visualState);
        
        // Проверяем падение редкости при критическом износе
        let newRarity = item.rarity;
        if (visualState === 'BROKEN' && item.rarity !== 'COMMON') {
          const rarityOrder = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
          const currentIndex = rarityOrder.indexOf(item.rarity);
          if (currentIndex > 0) {
            newRarity = rarityOrder[currentIndex - 1];
          }
        }
        
        const updateData: any = {
          durability: newDurability,
        };
        
        // Обновляем редкость только если упала
        if (newRarity !== item.rarity) {
          updateData.rarity = newRarity;
        }
        
        updates.push(
          this.prisma.inventoryItem.update({
            where: { id: item.id },
            data: updateData,
          }),
        );
      }
    }

    await Promise.all(updates);

    return { itemsWorn: equippedItems.length };
  }

  /**
   * Получить визуальное состояние предмета на основе прочности
   * @param durability - Текущая прочность
   * @param durabilityMax - Максимальная прочность
   * @returns Состояние: 'NEW' | 'USED' | 'WORN' | 'BROKEN'
   */
  getVisualState(durability: number, durabilityMax: number): 'NEW' | 'USED' | 'WORN' | 'BROKEN' {
    const percentage = durability / durabilityMax;
    
    if (durability <= 0) {
      return 'BROKEN';
    } else if (percentage > 0.7) {
      return 'NEW'; // Новая (70-100%)
    } else if (percentage > 0.3) {
      return 'USED'; // Поюзанная (30-70%)
    } else {
      return 'WORN'; // Изношенная (0-30%)
    }
  }

  /**
   * Получить previewUrl для состояния износа
   * Можно добавить суффиксы к URL или использовать разные изображения
   */
  private getPreviewUrlForState(baseUrl: string, state: 'NEW' | 'USED' | 'WORN' | 'BROKEN'): string {
    if (!baseUrl) {
      return baseUrl;
    }

    // Если URL уже содержит состояние, заменяем его
    const stateSuffixes = {
      NEW: '',
      USED: '_used',
      WORN: '_worn',
      BROKEN: '_broken',
    };

    // Удаляем старые суффиксы
    let cleanUrl = baseUrl.replace(/_(used|worn|broken)(\.\w+)?$/, '');
    
    // Добавляем расширение обратно, если оно было
    const extensionMatch = baseUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const extension = extensionMatch ? extensionMatch[0] : '';
    
    // Если состояние не NEW, добавляем суффикс
    if (state !== 'NEW' && stateSuffixes[state]) {
      // Вставляем суффикс перед расширением
      if (extension) {
        cleanUrl = cleanUrl.replace(extension, '') + stateSuffixes[state] + extension;
      } else {
        cleanUrl = cleanUrl + stateSuffixes[state];
      }
    } else {
      cleanUrl = cleanUrl + extension;
    }

    return cleanUrl;
  }

  /**
   * Получить информацию о визуальном состоянии предмета
   */
  async getItemVisualInfo(itemId: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: { skin: true },
    });

    if (!item) {
      throw new Error('Item not found');
    }

    const visualState = this.getVisualState(item.durability, item.durabilityMax);
    // Вычисляем previewUrl на основе состояния износа
    const previewUrl = this.getPreviewUrlForState(item.skin.previewUrl, visualState);
    
    return {
      item: {
        ...item,
        previewUrl, // Добавляем вычисленный previewUrl
      },
      visualState,
      durabilityPercentage: (item.durability / item.durabilityMax) * 100,
    };
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

