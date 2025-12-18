import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly db: DatabaseService) {}

  async getUserResources(userId: number) {
    return await this.db.findMany('resources', { userId }, { orderBy: 'type ASC' });
  }

  async addResource(userId: number, type: string, amount: number) {
    const existing = await this.db.query(
      'SELECT * FROM resources WHERE "userId" = $1 AND type = $2 LIMIT 1',
      [userId, type]
    ).then(r => r.rows[0]);

    if (existing) {
      return await this.db.query(
        'UPDATE resources SET amount = amount + $1, "updatedAt" = $2 WHERE "userId" = $3 AND type = $4 RETURNING *',
        [amount, new Date(), userId, type]
      ).then(r => r.rows[0]);
    } else {
      return await this.db.create('resources', {
        userId,
        type,
        amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async removeResource(userId: number, type: string, amount: number) {
    const resource = await this.db.query(
      'SELECT * FROM resources WHERE "userId" = $1 AND type = $2 LIMIT 1',
      [userId, type]
    ).then(r => r.rows[0]);

    if (!resource || resource.amount < amount) {
      throw new Error('Insufficient resources');
    }

    if (resource.amount === amount) {
      await this.db.delete('resources', { userId, type });
      return null;
    }

    return await this.db.query(
      'UPDATE resources SET amount = amount - $1, "updatedAt" = $2 WHERE "userId" = $3 AND type = $4 RETURNING *',
      [amount, new Date(), userId, type]
    ).then(r => r.rows[0]);
  }

  async hasResources(userId: number, requirements: { type: string; amount: number }[]) {
    const types = requirements.map(r => r.type);
    const resources = await this.db.query(
      `SELECT * FROM resources WHERE "userId" = $1 AND type = ANY($2)`,
      [userId, types]
    );

    for (const req of requirements) {
      const resource = resources.rows.find((r) => r.type === req.type);
      if (!resource || resource.amount < req.amount) {
        return false;
      }
    }

    return true;
  }
}
