import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SiegesService {
  constructor(private readonly db: DatabaseService) {}

  async createSiege(leaderId: number, districtId: number) {
    const leaderClans = await this.db.query(
      `SELECT c.*
       FROM clans c
       WHERE c."leaderId" = $1`,
      [leaderId]
    );

    if (leaderClans.rows.length === 0) {
      throw new Error('User is not a clan leader');
    }

    const clan = leaderClans.rows[0];

    const district = await this.db.query(
      `SELECT d.*, c.*
       FROM districts d
       LEFT JOIN clans c ON d."clanId" = c.id
       WHERE d.id = $1`,
      [districtId]
    ).then(r => r.rows[0]);

    if (!district) {
      throw new Error('District not found');
    }

    const activeSiege = await this.db.query(
      'SELECT * FROM sieges WHERE "districtId" = $1 AND status = $2 LIMIT 1',
      [districtId, 'ACTIVE']
    ).then(r => r.rows[0]);

    if (activeSiege) {
      throw new Error('District is already under siege');
    }

    if (district.clanId === clan.id) {
      throw new Error('Cannot siege your own district');
    }

    const siege = await this.db.create('sieges', {
      districtId,
      attackingClanId: clan.id,
      defendingClanId: district.clanId || null,
      status: 'ACTIVE',
      requiredWins: 5,
      attackingWins: 0,
      defendingWins: 0,
      startDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [districtData, attackingClan, defendingClan] = await Promise.all([
      this.db.findOne('districts', { id: districtId }),
      this.db.findOne('clans', { id: clan.id }),
      district.clanId ? this.db.findOne('clans', { id: district.clanId }) : null,
    ]);

    return {
      ...siege,
      district: districtData,
      attackingClan,
      defendingClan,
    };
  }

  async recordSiegeGame(siegeId: number, whitePlayerId: number, blackPlayerId: number, winnerId: number, gameHistoryId?: number) {
    const siege = await this.db.query(
      `SELECT s.*, 
              ac.id as "attackingClanId", ac."leaderId" as "attackingLeaderId",
              dc.id as "defendingClanId", dc."leaderId" as "defendingLeaderId"
       FROM sieges s
       LEFT JOIN clans ac ON s."attackingClanId" = ac.id
       LEFT JOIN clans dc ON s."defendingClanId" = dc.id
       WHERE s.id = $1`,
      [siegeId]
    ).then(r => r.rows[0]);

    if (!siege || siege.status !== 'ACTIVE') {
      throw new Error('Siege not found or not active');
    }

    const [attackingMembers, defendingMembers] = await Promise.all([
      this.db.query(
        'SELECT "userId" FROM clan_members WHERE "clanId" = $1',
        [siege.attackingClanId]
      ).then(r => r.rows.map(m => m.userId)),
      siege.defendingClanId ? this.db.query(
        'SELECT "userId" FROM clan_members WHERE "clanId" = $1',
        [siege.defendingClanId]
      ).then(r => r.rows.map(m => m.userId)) : [],
    ]);

    const winnerIsAttacking = attackingMembers.includes(winnerId);
    const winnerIsDefending = defendingMembers.includes(winnerId);

    if (!winnerIsAttacking && !winnerIsDefending) {
      throw new Error('Winner is not a member of participating clans');
    }

    await this.db.create('siege_games', {
      siegeId,
      whitePlayerId,
      blackPlayerId,
      winnerId,
      gameHistoryId: gameHistoryId || null,
      createdAt: new Date(),
    });

    let updateQuery = 'UPDATE sieges SET ';
    const params: any[] = [];
    let paramIndex = 1;

    if (winnerIsAttacking) {
      updateQuery += `"attackingWins" = "attackingWins" + 1`;
    } else if (winnerIsDefending) {
      updateQuery += `"defendingWins" = "defendingWins" + 1`;
    }

    updateQuery += ` WHERE id = $${paramIndex++}`;
    params.push(siegeId);

    await this.db.query(updateQuery, params);

    const updatedSiege = await this.db.findOne('sieges', { id: siegeId });

    if (updatedSiege.attackingWins >= updatedSiege.requiredWins) {
      await this.finishSiege(siegeId, updatedSiege.attackingClanId);
    } else if (updatedSiege.defendingWins >= updatedSiege.requiredWins && siege.defendingClanId) {
      await this.finishSiege(siegeId, siege.defendingClanId);
    }

    return updatedSiege;
  }

  private async finishSiege(siegeId: number, winnerClanId: number) {
    const siege = await this.db.findOne('sieges', { id: siegeId });
    if (!siege) {
      return;
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE sieges SET status = $1, "winnerClanId" = $2, "endDate" = $3 WHERE id = $4',
        ['FINISHED', winnerClanId, new Date(), siegeId]
      );
      await client.query(
        'UPDATE districts SET "clanId" = $1 WHERE id = $2',
        [winnerClanId, siege.districtId]
      );
    });
  }

  async getActiveSieges() {
    const sieges = await this.db.query(
      `SELECT s.*
       FROM sieges s
       WHERE s.status = 'ACTIVE'
       ORDER BY s."startDate" DESC`
    );

    const siegesWithRelations = await Promise.all(
      sieges.rows.map(async (siege) => {
        const [district, attackingClan, defendingClan, siegeGames] = await Promise.all([
          this.db.findOne('districts', { id: siege.districtId }),
          this.db.findOne('clans', { id: siege.attackingClanId }),
          siege.defendingClanId ? this.db.findOne('clans', { id: siege.defendingClanId }) : null,
          this.db.query(
            `SELECT sg.*, s.*
             FROM siege_games sg
             JOIN sieges s ON sg."siegeId" = s.id
             WHERE sg."siegeId" = $1
             ORDER BY sg."createdAt" DESC
             LIMIT 10`,
            [siege.id]
          ).then(r => r.rows),
        ]);

        return {
          ...siege,
          district,
          attackingClan,
          defendingClan,
          siegeGames,
        };
      })
    );

    return siegesWithRelations;
  }

  async getClanSieges(clanId: number) {
    const sieges = await this.db.query(
      `SELECT s.*
       FROM sieges s
       WHERE s."attackingClanId" = $1 OR s."defendingClanId" = $1
       ORDER BY s."startDate" DESC`,
      [clanId]
    );

    const siegesWithRelations = await Promise.all(
      sieges.rows.map(async (siege) => {
        const [district, attackingClan, defendingClan] = await Promise.all([
          this.db.findOne('districts', { id: siege.districtId }),
          this.db.findOne('clans', { id: siege.attackingClanId }),
          siege.defendingClanId ? this.db.findOne('clans', { id: siege.defendingClanId }) : null,
        ]);

        return {
          ...siege,
          district,
          attackingClan,
          defendingClan,
        };
      })
    );

    return siegesWithRelations;
  }

  async getSiegeById(siegeId: number) {
    const siege = await this.db.findOne('sieges', { id: siegeId });
    if (!siege) {
      return null;
    }

    const [district, attackingClan, defendingClan, siegeGames] = await Promise.all([
      this.db.findOne('districts', { id: siege.districtId }),
      this.db.findOne('clans', { id: siege.attackingClanId }),
      siege.defendingClanId ? this.db.findOne('clans', { id: siege.defendingClanId }) : null,
      this.db.query(
        `SELECT sg.*, s.*
         FROM siege_games sg
         JOIN sieges s ON sg."siegeId" = s.id
         WHERE sg."siegeId" = $1
         ORDER BY sg."createdAt" DESC`,
        [siegeId]
      ).then(r => r.rows),
    ]);

    return {
      ...siege,
      district,
      attackingClan,
      defendingClan,
      siegeGames,
    };
  }
}
