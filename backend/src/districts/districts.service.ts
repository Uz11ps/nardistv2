import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DistrictsService {
  constructor(private readonly db: DatabaseService) {}

  async initializeDistricts() {
    const districts = [
      {
        name: 'Дворы',
        description: 'Уличные столы для начинающих',
        type: 'COURTS',
        icon: '🏘️',
        commissionRate: 5,
      },
      {
        name: 'Клубы Нардистов',
        description: 'Премиум-клубы для опытных игроков',
        type: 'CLUBS',
        icon: '🎩',
        commissionRate: 5,
      },
      {
        name: 'Мастерские досок',
        description: 'Производство игровых досок',
        type: 'WORKSHOPS',
        icon: '🔨',
        commissionRate: 5,
      },
      {
        name: 'Фабрики зариков',
        description: 'Производство кубиков',
        type: 'FACTORIES',
        icon: '🏭',
        commissionRate: 5,
      },
      {
        name: 'Цеха стаканов и фишек',
        description: 'Производство аксессуаров',
        type: 'WORKSHOPS_CUPS',
        icon: '⚙️',
        commissionRate: 5,
      },
      {
        name: 'Школа Нардиста',
        description: 'Обучение и развитие',
        type: 'SCHOOL',
        icon: '📚',
        commissionRate: 5,
      },
      {
        name: 'Турнирная Арена',
        description: 'Центр соревнований и спонсоров',
        type: 'ARENA',
        icon: '🏟️',
        commissionRate: 5,
      },
    ];

    const created = [];
    for (const district of districts) {
      const existing = await this.db.query(
        'SELECT * FROM districts WHERE type = $1 LIMIT 1',
        [district.type]
      ).then(r => r.rows[0]);

      if (!existing) {
        const newDistrict = await this.db.create('districts', {
          ...district,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        await this.db.create('district_funds', {
          districtId: newDistrict.id,
          balance: 0,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
        
        created.push(newDistrict);
      } else {
        created.push(existing);
      }
    }

    return created;
  }

  async getAllDistricts() {
    const districts = await this.db.findMany('districts', undefined, { orderBy: 'id ASC' });

    const districtsWithRelations = await Promise.all(
      districts.map(async (district) => {
        const [clan, fund, businessCount] = await Promise.all([
          district.clanId ? this.db.query(
            `SELECT c.*, u.id as "leaderId", u.nickname, u."firstName", u."photoUrl"
             FROM clans c
             LEFT JOIN users u ON c."leaderId" = u.id
             WHERE c.id = $1`,
            [district.clanId]
          ).then(r => r.rows[0]) : null,
          this.db.findOne('district_funds', { districtId: district.id }),
          this.db.count('businesses', { districtId: district.id }),
        ]);

        return {
          ...district,
          clan: clan ? {
            ...clan,
            leader: {
              id: clan.leaderId,
              nickname: clan.nickname,
              firstName: clan.firstName,
              photoUrl: clan.photoUrl,
            },
          } : null,
          fund: fund || null,
          _count: {
            businesses: businessCount,
          },
        };
      })
    );

    return districtsWithRelations;
  }

  async getDistrictById(id: number) {
    const district = await this.db.findOne('districts', { id });
    if (!district) {
      return null;
    }

    const [clan, fund, businesses] = await Promise.all([
      district.clanId ? this.db.query(
        `SELECT c.*, u.id as "leaderId", u.nickname, u."firstName", u."photoUrl"
         FROM clans c
         LEFT JOIN users u ON c."leaderId" = u.id
         WHERE c.id = $1`,
        [district.clanId]
      ).then(r => r.rows[0]) : null,
      this.db.findOne('district_funds', { districtId: district.id }),
      district.clanId ? this.db.query(
        `SELECT cm.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
         FROM clan_members cm
         JOIN users u ON cm."userId" = u.id
         WHERE cm."clanId" = $1
         ORDER BY cm.role ASC`,
        [district.clanId]
      ).then(r => r.rows.map(m => ({
        ...m,
        user: {
          id: m.userId,
          nickname: m.nickname,
          firstName: m.firstName,
          photoUrl: m.photoUrl,
        },
      }))) : [],
      this.db.query(
        `SELECT b.*, u.id as "userId", u.nickname, u."firstName"
         FROM businesses b
         JOIN users u ON b."userId" = u.id
         WHERE b."districtId" = $1`,
        [id]
      ).then(r => r.rows.map(b => ({
        ...b,
        user: {
          id: b.userId,
          nickname: b.nickname,
          firstName: b.firstName,
        },
      }))),
    ]);

    return {
      ...district,
      clan: clan ? {
        ...clan,
        leader: {
          id: clan.leaderId,
          nickname: clan.nickname,
          firstName: clan.firstName,
          photoUrl: clan.photoUrl,
        },
        members: clan.members || [],
      } : null,
      fund: fund || null,
      businesses,
    };
  }

  async getDistrictByType(type: string) {
    const district = await this.db.query(
      'SELECT * FROM districts WHERE type = $1 LIMIT 1',
      [type]
    ).then(r => r.rows[0]);

    if (!district) {
      return null;
    }

    const [clan, fund] = await Promise.all([
      district.clanId ? this.db.findOne('clans', { id: district.clanId }) : null,
      this.db.findOne('district_funds', { districtId: district.id }),
    ]);

    return {
      ...district,
      clan: clan || null,
      fund: fund || null,
    };
  }

  async setClanControl(districtId: number, clanId: number) {
    return await this.db.update('districts',
      { id: districtId },
      { clanId, updatedAt: new Date() }
    );
  }

  async removeClanControl(districtId: number) {
    return await this.db.update('districts',
      { id: districtId },
      { clanId: null, updatedAt: new Date() }
    );
  }
}
