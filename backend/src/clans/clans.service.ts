import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EconomyService } from '../economy/economy.service';

@Injectable()
export class ClansService {
  constructor(
    private readonly db: DatabaseService,
    private readonly economyService: EconomyService,
  ) {}

  async createClan(userId: number, data: { name: string; description?: string }) {
    const existingMember = await this.db.query(
      'SELECT * FROM clan_members WHERE "userId" = $1 LIMIT 1',
      [userId]
    ).then(r => r.rows[0]);

    if (existingMember) {
      throw new Error('User is already a member of a clan');
    }

    const existingClan = await this.db.findOne('clans', { name: data.name });
    if (existingClan) {
      throw new Error('Clan name already exists');
    }

    const clan = await this.db.create('clans', {
      name: data.name,
      description: data.description || null,
      leaderId: userId,
      treasury: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.db.create('clan_members', {
      clanId: clan.id,
      userId,
      role: 'LEADER',
      createdAt: new Date(),
    });

    return clan;
  }

  async getAllClans() {
    const clans = await this.db.findMany('clans', undefined, { orderBy: '"treasury" DESC' });

    const clansWithRelations = await Promise.all(
      clans.map(async (clan) => {
        const [leader, members, districts, memberCount, districtCount] = await Promise.all([
          this.db.query(
            'SELECT id, nickname, "firstName", "photoUrl" FROM users WHERE id = $1',
            [clan.leaderId]
          ).then(r => r.rows[0]),
          this.db.query(
            `SELECT cm.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
             FROM clan_members cm
             JOIN users u ON cm."userId" = u.id
             WHERE cm."clanId" = $1`,
            [clan.id]
          ).then(r => r.rows.map(m => ({
            ...m,
            user: {
              id: m.userId,
              nickname: m.nickname,
              firstName: m.firstName,
              photoUrl: m.photoUrl,
            },
          }))),
          this.db.findMany('districts', { clanId: clan.id }),
          this.db.count('clan_members', { clanId: clan.id }),
          this.db.count('districts', { clanId: clan.id }),
        ]);

        return {
          ...clan,
          leader: leader || null,
          members,
          districts,
          _count: {
            members: memberCount,
            districts: districtCount,
          },
        };
      })
    );

    return clansWithRelations;
  }

  async getClanById(id: number) {
    const clan = await this.db.findOne('clans', { id });
    if (!clan) {
      return null;
    }

    const [leader, members, districts] = await Promise.all([
      this.db.query(
        'SELECT id, nickname, "firstName", "photoUrl" FROM users WHERE id = $1',
        [clan.leaderId]
      ).then(r => r.rows[0]),
      this.db.query(
        `SELECT cm.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
         FROM clan_members cm
         JOIN users u ON cm."userId" = u.id
         WHERE cm."clanId" = $1
         ORDER BY cm.role ASC`,
        [clan.id]
      ).then(r => r.rows.map(m => ({
        ...m,
        user: {
          id: m.userId,
          nickname: m.nickname,
          firstName: m.firstName,
          photoUrl: m.photoUrl,
        },
      }))),
      this.db.query(
        `SELECT d.*, df.balance as "fundBalance"
         FROM districts d
         LEFT JOIN district_funds df ON d.id = df."districtId"
         WHERE d."clanId" = $1`,
        [clan.id]
      ).then(r => r.rows.map(d => ({
        ...d,
        fund: d.fundBalance ? { balance: d.fundBalance } : null,
      }))),
    ]);

    return {
      ...clan,
      leader: leader || null,
      members,
      districts,
    };
  }

  async getUserClan(userId: number) {
    const member = await this.db.query(
      `SELECT cm.*, c.*, u.id as "leaderId", u.nickname, u."firstName", u."photoUrl"
       FROM clan_members cm
       JOIN clans c ON cm."clanId" = c.id
       LEFT JOIN users u ON c."leaderId" = u.id
       WHERE cm."userId" = $1
       LIMIT 1`,
      [userId]
    ).then(r => r.rows[0]);

    if (!member) {
      return null;
    }

    const districts = await this.db.findMany('districts', { clanId: member.clanId });

    return {
      ...member,
      leader: {
        id: member.leaderId,
        nickname: member.nickname,
        firstName: member.firstName,
        photoUrl: member.photoUrl,
      },
      districts,
    };
  }

  async joinClan(userId: number, clanId: number) {
    const existingMember = await this.db.query(
      'SELECT * FROM clan_members WHERE "userId" = $1 LIMIT 1',
      [userId]
    ).then(r => r.rows[0]);

    if (existingMember) {
      throw new Error('User is already a member of a clan');
    }

    const clan = await this.db.findOne('clans', { id: clanId });
    if (!clan) {
      throw new Error('Clan not found');
    }

    return await this.db.create('clan_members', {
      clanId,
      userId,
      role: 'MEMBER',
      createdAt: new Date(),
    });
  }

  async leaveClan(userId: number, clanId: number) {
    const member = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, userId]
    ).then(r => r.rows[0]);

    if (!member) {
      throw new Error('User is not a member of this clan');
    }

    if (member.role === 'LEADER') {
      throw new Error('Leader cannot leave the clan');
    }

    await this.db.delete('clan_members', { clanId, userId });
    return { success: true };
  }

  async changeMemberRole(
    leaderId: number,
    clanId: number,
    memberId: number,
    newRole: string,
  ) {
    const leader = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, leaderId]
    ).then(r => r.rows[0]);

    if (!leader || leader.role !== 'LEADER') {
      throw new Error('Only leader can change roles');
    }

    return await this.db.update('clan_members',
      { clanId, userId: memberId },
      { role: newRole }
    );
  }

  async distributeTreasury(
    leaderId: number,
    clanId: number,
    amount: number,
    recipientId: number,
  ) {
    const leader = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, leaderId]
    ).then(r => r.rows[0]);

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    const clan = await this.db.findOne('clans', { id: clanId });
    if (!clan || clan.treasury < amount) {
      throw new Error('Insufficient treasury balance');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE clans SET treasury = treasury - $1 WHERE id = $2',
        [amount, clanId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [amount, recipientId]
      );
    });

    const updatedClan = await this.db.findOne('clans', { id: clanId });
    return { success: true, newTreasury: updatedClan.treasury };
  }

  async getDistrictFunds(clanId: number) {
    const districts = await this.db.query(
      `SELECT d.*, df.balance, df."lastUpdated"
       FROM districts d
       LEFT JOIN district_funds df ON d.id = df."districtId"
       WHERE d."clanId" = $1`,
      [clanId]
    );

    return districts.rows.map(d => ({
      district: {
        ...d,
        fund: d.balance ? { balance: d.balance, lastUpdated: d.lastUpdated } : null,
      },
      fund: d.balance ? { balance: d.balance, lastUpdated: d.lastUpdated } : { balance: 0 },
    }));
  }

  async distributeDistrictFund(
    leaderId: number,
    clanId: number,
    districtId: number,
    amount: number,
  ) {
    const leader = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, leaderId]
    ).then(r => r.rows[0]);

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    const district = await this.db.findOne('districts', { id: districtId });
    if (!district || district.clanId !== clanId) {
      throw new Error('District is not controlled by this clan');
    }

    return await this.economyService.distributeDistrictFundToClan(districtId, amount);
  }

  async updateClan(leaderId: number, clanId: number, data: { name?: string; description?: string }) {
    const leader = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, leaderId]
    ).then(r => r.rows[0]);

    if (!leader || leader.role !== 'LEADER') {
      throw new Error('Only leader can update clan');
    }

    if (data.name) {
      const existingClan = await this.db.findOne('clans', { name: data.name });
      if (existingClan && existingClan.id !== clanId) {
        throw new Error('Clan name already exists');
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    return await this.db.update('clans', { id: clanId }, updateData);
  }

  async kickMember(leaderId: number, clanId: number, memberId: number) {
    const leader = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, leaderId]
    ).then(r => r.rows[0]);

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    const member = await this.db.query(
      'SELECT * FROM clan_members WHERE "clanId" = $1 AND "userId" = $2 LIMIT 1',
      [clanId, memberId]
    ).then(r => r.rows[0]);

    if (!member) {
      throw new Error('Member not found');
    }

    if (member.role === 'LEADER') {
      throw new Error('Cannot kick leader');
    }

    await this.db.delete('clan_members', { clanId, userId: memberId });
    return { success: true };
  }
}
