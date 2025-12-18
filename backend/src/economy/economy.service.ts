import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EconomyService {
  private readonly BASE_COMMISSION = 15;
  private readonly CITY_TAX_RATE = 10;
  private readonly DISTRICT_RATE = 5;
  private readonly ECONOMY_STAT_REDUCTION = 0.5;

  constructor(private readonly db: DatabaseService) {}

  calculateCommission(betAmount: number, playerEconomyStat: number): {
    totalCommission: number;
    cityTax: number;
    districtFee: number;
    playerRebate: number;
  } {
    const totalBank = betAmount * 2;
    const baseCommission = (totalBank * this.BASE_COMMISSION) / 100;
    const economyReduction = playerEconomyStat * this.ECONOMY_STAT_REDUCTION;
    const effectiveCommissionRate = Math.max(
      this.BASE_COMMISSION - economyReduction,
      10,
    );
    const effectiveCommission = (totalBank * effectiveCommissionRate) / 100;
    const playerRebate = baseCommission - effectiveCommission;
    const cityTax = (totalBank * this.CITY_TAX_RATE) / 100;
    const districtFee = (totalBank * this.DISTRICT_RATE) / 100;

    return {
      totalCommission: effectiveCommission,
      cityTax,
      districtFee,
      playerRebate,
    };
  }

  async processGameEconomy(data: {
    whitePlayerId: number;
    blackPlayerId: number;
    winnerId: number;
    betAmount: number;
    districtId?: number;
  }) {
    const { whitePlayerId, blackPlayerId, winnerId, betAmount, districtId } = data;

    const [whitePlayer, blackPlayer] = await Promise.all([
      this.db.findOne('users', { id: whitePlayerId }),
      this.db.findOne('users', { id: blackPlayerId }),
    ]);

    if (!whitePlayer || !blackPlayer) {
      throw new Error('Players not found');
    }

    const whiteCommission = this.calculateCommission(betAmount, whitePlayer.statsEconomy);
    const blackCommission = this.calculateCommission(betAmount, blackPlayer.statsEconomy);
    const winner = winnerId === whitePlayerId ? whitePlayer : blackPlayer;
    const winnerCommission = winnerId === whitePlayerId ? whiteCommission : blackCommission;

    const totalBank = betAmount * 2;
    const finalCommission = winnerCommission.totalCommission;
    const winnerPrize = totalBank - finalCommission;

    await this.db.query(
      'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
      [winnerPrize, winnerId]
    );

    const cityTax = winnerCommission.cityTax;
    const districtFee = winnerCommission.districtFee;

    if (districtId) {
      await this.updateDistrictFund(districtId, districtFee);
    }

    if (winnerCommission.playerRebate > 0) {
      await this.db.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [Math.floor(winnerCommission.playerRebate), winnerId]
      );
    }

    return {
      winnerPrize,
      totalCommission: finalCommission,
      cityTax,
      districtFee,
      playerRebate: winnerCommission.playerRebate,
    };
  }

  async updateDistrictFund(districtId: number, amount: number) {
    const existing = await this.db.findOne('district_funds', { districtId });

    if (existing) {
      await this.db.query(
        'UPDATE district_funds SET balance = balance + $1, "lastUpdated" = $2 WHERE "districtId" = $3',
        [amount, new Date(), districtId]
      );
    } else {
      await this.db.create('district_funds', {
        districtId,
        balance: amount,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }

    await this.db.update('districts', { id: districtId }, { updatedAt: new Date() });

    return await this.db.findOne('district_funds', { districtId });
  }

  async getDistrictFund(districtId: number) {
    const fund = await this.db.query(
      `SELECT df.*, d.*, c.*
       FROM district_funds df
       LEFT JOIN districts d ON df."districtId" = d.id
       LEFT JOIN clans c ON d."clanId" = c.id
       WHERE df."districtId" = $1`,
      [districtId]
    ).then(r => r.rows[0]);

    return fund || { balance: 0, district: null };
  }

  async distributeDistrictFundToClan(districtId: number, amount: number) {
    const district = await this.db.query(
      `SELECT d.*, c.*
       FROM districts d
       LEFT JOIN clans c ON d."clanId" = c.id
       WHERE d.id = $1`,
      [districtId]
    ).then(r => r.rows[0]);

    if (!district || !district.clanId) {
      throw new Error('District has no controlling clan');
    }

    const fund = await this.db.findOne('district_funds', { districtId });
    if (!fund || fund.balance < amount) {
      throw new Error('Insufficient fund balance');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE clans SET treasury = treasury + $1 WHERE id = $2',
        [amount, district.clanId]
      );
      await client.query(
        'UPDATE district_funds SET balance = balance - $1 WHERE "districtId" = $2',
        [amount, districtId]
      );
    });

    const updatedClan = await this.db.findOne('clans', { id: district.clanId });
    return {
      clanId: district.clanId,
      amount,
      newClanTreasury: updatedClan.treasury,
    };
  }
}
