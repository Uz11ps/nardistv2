import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AcademyService {
  constructor(private readonly db: DatabaseService) {}

  async getArticles(category?: string) {
    const where = category ? { category, isPublished: true } : { isPublished: true };
    return await this.db.findMany('academy_articles', where, { orderBy: '"createdAt" DESC' });
  }

  async getArticle(id: number, userId?: number) {
    const article = await this.db.findOne('academy_articles', { id });

    if (!article || !article.isPublished) {
      throw new Error('Article not found');
    }

    if (article.isPaid && userId) {
      const hasAccess = await this.checkArticleAccess(userId, id);
      if (!hasAccess) {
        throw new Error('Article access denied. Payment required.');
      }
    }

    await this.db.query(
      'UPDATE academy_articles SET views = views + 1 WHERE id = $1',
      [id]
    );

    return article;
  }

  async checkArticleAccess(userId: number, articleId: number): Promise<boolean> {
    const userResult = await this.db.query(
      `SELECT u.*, s.*
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s."userId"
       WHERE u.id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return false;
    }

    if (user.isActive && user.endDate && new Date() < new Date(user.endDate)) {
      return true;
    }

    return false;
  }

  async purchaseArticleWithNAR(userId: number, articleId: number) {
    const article = await this.db.findOne('academy_articles', { id: articleId });

    if (!article || !article.isPaid) {
      throw new Error('Article not found or not paid');
    }

    if (!article.priceCoin || article.priceCoin <= 0) {
      throw new Error('Article cannot be purchased with NAR');
    }

    const user = await this.db.findOne('users', { id: userId });
    if (!user || user.narCoin < article.priceCoin) {
      throw new Error('Not enough NAR coins');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [article.priceCoin, userId]
      );
    });

    return { success: true, articleId };
  }

  async purchaseArticleWithCrypto(userId: number, articleId: number, paymentData: any) {
    const article = await this.db.findOne('academy_articles', { id: articleId });

    if (!article || !article.isPaid) {
      throw new Error('Article not found or not paid');
    }

    if (!article.priceCrypto) {
      throw new Error('Article cannot be purchased with crypto');
    }

    return { success: true, articleId, transactionId: paymentData.transactionId };
  }

  async promoteToTrainer(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.level < 20) {
      throw new Error('User level must be at least 20');
    }

    const existing = await this.db.findOne('academy_roles', { userId });

    if (existing) {
      return await this.db.update('academy_roles',
        { userId },
        { role: 'TRAINER', updatedAt: new Date() }
      );
    } else {
      return await this.db.create('academy_roles', {
        userId,
        role: 'TRAINER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
