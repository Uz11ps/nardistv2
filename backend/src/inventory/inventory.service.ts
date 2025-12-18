import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InventoryService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Получить инвентарь пользователя
   */
  async getUserInventory(userId: number) {
    const items = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii."userId" = $1
       ORDER BY ii."isEquipped" DESC`,
      [userId]
    );

    return items.rows.map(item => ({
      ...item,
      skin: {
        id: item.skinId,
        name: item.name,
        type: item.type,
        previewUrl: item.previewUrl,
        rarity: item.rarity,
        weight: item.weight,
        durabilityMax: item.durabilityMax,
        isDefault: item.isDefault,
        priceCoin: item.priceCoin,
        isActive: item.isActive,
      },
    }));
  }

  /**
   * Добавить предмет в инвентарь
   */
  async addItem(userId: number, skinId: number, rarity: string = 'COMMON') {
    const skin = await this.db.findOne('skins', { id: skinId });

    if (!skin) {
      throw new Error('Skin not found');
    }

    // Проверяем вес (силу игрока)
    const user = await this.db.findOne('users', { id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Получаем надетые предметы
    const equippedItems = await this.db.query(
      `SELECT ii.*, s.weight
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii."userId" = $1 AND ii."isEquipped" = true`,
      [userId]
    );

    const currentWeight = equippedItems.rows.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalWeight = currentWeight + skin.weight;

    if (totalWeight > user.powerMax) {
      throw new Error('Not enough power to equip this item');
    }

    // Создаем предмет
    const item = await this.db.create('inventory_items', {
      userId,
      skinId,
      rarity,
      durability: skin.durabilityMax,
      durabilityMax: skin.durabilityMax,
      weight: skin.weight,
      isEquipped: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Загружаем скин для возврата
    return {
      ...item,
      skin,
    };
  }

  /**
   * Надеть/снять предмет
   */
  async toggleEquip(userId: number, itemId: number) {
    const itemResult = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii.id = $1`,
      [itemId]
    );

    const item = itemResult.rows[0];
    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    if (item.isEquipped) {
      // Снимаем
      return await this.db.update('inventory_items',
        { id: itemId },
        { isEquipped: false, updatedAt: new Date() }
      );
    } else {
      // Проверяем вес перед надеванием
      const user = await this.db.findOne('users', { id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      const equippedItems = await this.db.query(
        `SELECT ii.*, s.weight
         FROM inventory_items ii
         JOIN skins s ON ii."skinId" = s.id
         WHERE ii."userId" = $1 AND ii."isEquipped" = true`,
        [userId]
      );

      const currentWeight = equippedItems.rows.reduce((sum, item) => sum + (item.weight || 0), 0);
      const totalWeight = currentWeight + item.weight;

      if (totalWeight > user.powerMax) {
        throw new Error('Not enough power to equip this item');
      }

      // Надеваем
      return await this.db.update('inventory_items',
        { id: itemId },
        { isEquipped: true, updatedAt: new Date() }
      );
    }
  }

  /**
   * Применить износ к предмету
   */
  async applyWear(userId: number, itemId: number, wearAmount: number) {
    const item = await this.db.findOne('inventory_items', { id: itemId });

    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const newDurability = Math.max(0, item.durability - wearAmount);

    return await this.db.update('inventory_items',
      { id: itemId },
      { durability: newDurability, updatedAt: new Date() }
    );
  }

  /**
   * Применить износ к надетым предметам после игры
   */
  async applyGameWear(userId: number, gameMode: string, diceRollsCount?: number) {
    const equippedItems = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii."userId" = $1 AND ii."isEquipped" = true`,
      [userId]
    );

    const updates = [];
    for (const item of equippedItems.rows) {
      let wearAmount = 0;

      if (item.type === 'DICE') {
        // Зарики изнашиваются по количеству бросков
        if (diceRollsCount && diceRollsCount > 0) {
          wearAmount = diceRollsCount * 0.1;
        } else {
          wearAmount = 2;
        }
      } else {
        // Остальные предметы изнашиваются по играм
        const wearAmounts: Record<string, number> = {
          BOARD: 1,
          CHECKERS: 0.5,
          CUP: 0.3,
          FRAME: 0.1,
        };
        wearAmount = wearAmounts[item.type] || 0;
      }

      if (wearAmount > 0) {
        const newDurability = Math.max(0, item.durability - wearAmount);
        updates.push(
          this.db.update('inventory_items',
            { id: item.id },
            { durability: newDurability, updatedAt: new Date() }
          )
        );
      }
    }

    await Promise.all(updates);

    return { itemsWorn: equippedItems.rows.length };
  }

  /**
   * Получить визуальное состояние предмета на основе прочности
   */
  getVisualState(durability: number, durabilityMax: number): 'NEW' | 'USED' | 'WORN' | 'BROKEN' {
    const percentage = durability / durabilityMax;
    
    if (durability <= 0) {
      return 'BROKEN';
    } else if (percentage > 0.7) {
      return 'NEW';
    } else if (percentage > 0.3) {
      return 'USED';
    } else {
      return 'WORN';
    }
  }

  /**
   * Получить информацию о визуальном состоянии предмета
   */
  async getItemVisualInfo(itemId: number) {
    const itemResult = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii.id = $1`,
      [itemId]
    );

    const item = itemResult.rows[0];
    if (!item) {
      throw new Error('Item not found');
    }

    const visualState = this.getVisualState(item.durability, item.durabilityMax);
    
    return {
      item,
      visualState,
      durabilityPercentage: (item.durability / item.durabilityMax) * 100,
    };
  }

  /**
   * Отремонтировать предмет
   */
  async repairItem(userId: number, itemId: number, repairType: 'PARTIAL' | 'FULL') {
    const itemResult = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii.id = $1`,
      [itemId]
    );

    const item = itemResult.rows[0];
    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const durabilityLost = item.durabilityMax - item.durability;
    if (durabilityLost === 0) {
      return item;
    }

    // Расчет стоимости ремонта
    const repairCostPartial = Math.floor(
      (durabilityLost / item.durabilityMax) * item.priceCoin * 0.3,
    );
    const repairCostFull = Math.floor(item.priceCoin * 0.5);
    const repairCost = repairType === 'FULL' ? repairCostFull : repairCostPartial;

    // Проверяем баланс
    const user = await this.db.findOne('users', { id: userId });
    if (!user || user.narCoin < repairCost) {
      throw new Error('Not enough NAR coins');
    }

    // Восстанавливаем прочность
    const durabilityRestored =
      repairType === 'FULL' ? durabilityLost : Math.floor(durabilityLost * 0.5);

    // Используем транзакцию для атомарности
    await this.db.transaction(async (client) => {
      // Обновляем предмет
      await client.query(
        'UPDATE inventory_items SET durability = LEAST($1, $2 + $3), "updatedAt" = $4 WHERE id = $5',
        [item.durabilityMax, item.durability, durabilityRestored, new Date(), itemId]
      );

      // Списываем стоимость
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [repairCost, userId]
      );
    });

    const updated = await this.db.findOne('inventory_items', { id: itemId });
    return { item: updated, cost: repairCost };
  }
}
