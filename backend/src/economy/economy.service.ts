import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EconomyService {
  private readonly BASE_COMMISSION = 15; // Базовая комиссия 15%
  private readonly CITY_TAX_RATE = 10; // 10% налог города
  private readonly DISTRICT_RATE = 5; // 5% район
  private readonly ECONOMY_STAT_REDUCTION = 0.5; // 0.5% снижения комиссии за поинт Экономики

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Расчет комиссии с учетом ветки Экономика игрока
   */
  calculateCommission(betAmount: number, playerEconomyStat: number): {
    totalCommission: number;
    cityTax: number;
    districtFee: number;
    playerRebate: number; // Возврат игроку за прокачку Экономики
  } {
    const totalBank = betAmount * 2; // Общий банк (ставка обоих игроков)
    const baseCommission = (totalBank * this.BASE_COMMISSION) / 100;

    // Снижение комиссии за счет ветки Экономика (максимум до 10%)
    const economyReduction = playerEconomyStat * this.ECONOMY_STAT_REDUCTION;
    const effectiveCommissionRate = Math.max(
      this.BASE_COMMISSION - economyReduction,
      10, // Минимум 10% комиссии
    );
    const effectiveCommission = (totalBank * effectiveCommissionRate) / 100;

    // Возврат игроку (разница между базовой и эффективной комиссией)
    const playerRebate = baseCommission - effectiveCommission;

    // Разделение комиссии
    const cityTax = (totalBank * this.CITY_TAX_RATE) / 100;
    const districtFee = (totalBank * this.DISTRICT_RATE) / 100;

    return {
      totalCommission: effectiveCommission,
      cityTax,
      districtFee,
      playerRebate,
    };
  }

  /**
   * Обработка экономики игры (комиссия, распределение)
   */
  async processGameEconomy(data: {
    whitePlayerId: number;
    blackPlayerId: number;
    winnerId: number;
    betAmount: number;
    districtId?: number;
  }) {
    const { whitePlayerId, blackPlayerId, winnerId, betAmount, districtId } = data;

    // Получаем игроков
    const [whitePlayer, blackPlayer] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: whitePlayerId } }),
      this.prisma.user.findUnique({ where: { id: blackPlayerId } }),
    ]);

    if (!whitePlayer || !blackPlayer) {
      throw new Error('Players not found');
    }

    // Рассчитываем комиссию для каждого игрока
    const whiteCommission = this.calculateCommission(betAmount, whitePlayer.statsEconomy);
    const blackCommission = this.calculateCommission(betAmount, blackPlayer.statsEconomy);

    // Используем среднюю комиссию (или можно взять от победителя)
    const winner = winnerId === whitePlayerId ? whitePlayer : blackPlayer;
    const winnerCommission = winnerId === whitePlayerId ? whiteCommission : blackCommission;

    const totalBank = betAmount * 2;
    const finalCommission = winnerCommission.totalCommission;
    const winnerPrize = totalBank - finalCommission;

    // Обновляем баланс победителя
    await this.prisma.user.update({
      where: { id: winnerId },
      data: {
        narCoin: { increment: winnerPrize },
      },
    });

    // Обновляем баланс проигравшего (уже списано при создании игры)
    const loserId = winnerId === whitePlayerId ? blackPlayerId : whitePlayerId;
    // Ставка уже списана, ничего не делаем

    // Распределение комиссии
    const cityTax = winnerCommission.cityTax;
    const districtFee = winnerCommission.districtFee;

    // Налог города (сжигается или идет в общий фонд)
    // Пока просто логируем, можно добавить отдельную таблицу для городского фонда

    // Комиссия района
    if (districtId) {
      await this.updateDistrictFund(districtId, districtFee);
    }

    // Возврат игроку за прокачку Экономики
    if (winnerCommission.playerRebate > 0) {
      await this.prisma.user.update({
        where: { id: winnerId },
        data: {
          narCoin: { increment: Math.floor(winnerCommission.playerRebate) },
        },
      });
    }

    return {
      winnerPrize,
      totalCommission: finalCommission,
      cityTax,
      districtFee,
      playerRebate: winnerCommission.playerRebate,
    };
  }

  /**
   * Обновление фонда района
   */
  async updateDistrictFund(districtId: number, amount: number) {
    // Создаем или обновляем фонд района
    const fund = await this.prisma.districtFund.upsert({
      where: { districtId },
      create: {
        districtId,
        balance: amount,
      },
      update: {
        balance: { increment: amount },
        lastUpdated: new Date(),
      },
    });

    // Обновляем баланс в районе (для удобства)
    await this.prisma.district.update({
      where: { id: districtId },
      data: {
        updatedAt: new Date(),
      },
    });

    return fund;
  }

  /**
   * Получить баланс фонда района
   */
  async getDistrictFund(districtId: number) {
    const fund = await this.prisma.districtFund.findUnique({
      where: { districtId },
      include: {
        district: {
          include: {
            clan: true,
          },
        },
      },
    });

    return fund || { balance: 0, district: null };
  }

  /**
   * Распределение фонда района клану
   */
  async distributeDistrictFundToClan(districtId: number, amount: number) {
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      include: { clan: true },
    });

    if (!district || !district.clanId) {
      throw new Error('District has no controlling clan');
    }

    const fund = await this.prisma.districtFund.findUnique({
      where: { districtId },
    });

    if (!fund || fund.balance < amount) {
      throw new Error('Insufficient fund balance');
    }

    // Переводим в клановую казну
    await this.prisma.clan.update({
      where: { id: district.clanId },
      data: {
        treasury: { increment: amount },
      },
    });

    // Списываем с фонда
    await this.prisma.districtFund.update({
      where: { districtId },
      data: {
        balance: { decrement: amount },
      },
    });

    return {
      clanId: district.clanId,
      amount,
      newClanTreasury: (await this.prisma.clan.findUnique({ where: { id: district.clanId } }))!.treasury,
    };
  }
}

