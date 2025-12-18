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
    const article = await this.db.findOne('academy_articles', { id: articleId });
    if (!article) {
      return false;
    }

    // Если статья бесплатная, доступ открыт
    if (!article.isPaid) {
      return true;
    }

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

    // Проверяем активную подписку
    if (user.isActive && user.endDate && new Date() < new Date(user.endDate)) {
      return true;
    }

    // Проверяем, куплена ли статья
    const purchase = await this.db.query(
      'SELECT * FROM article_purchases WHERE "userId" = $1 AND "articleId" = $2',
      [userId, articleId]
    );
    
    if (purchase.rows.length > 0) {
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

    // Проверяем, не куплена ли уже статья
    const existingPurchase = await this.db.query(
      'SELECT * FROM article_purchases WHERE "userId" = $1 AND "articleId" = $2',
      [userId, articleId]
    );

    if (existingPurchase.rows.length > 0) {
      return { success: true, articleId, alreadyPurchased: true };
    }

    await this.db.transaction(async (client) => {
      // Списываем NAR
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [article.priceCoin, userId]
      );
      
      // Создаем запись о покупке
      await client.query(
        'INSERT INTO article_purchases ("userId", "articleId", "paymentMethod", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)',
        [userId, articleId, 'NAR', new Date(), new Date()]
      );
    });

    // Создаем запись о покупке
    await this.db.create('article_purchases', {
      userId,
      articleId,
      paymentMethod: 'NAR',
      amount: article.priceCoin,
      createdAt: new Date(),
      updatedAt: new Date(),
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

    // TODO: Интеграция с платежной системой TON/USDT
    // Пока просто возвращаем успех (в реальности нужно проверить платеж)

    // Проверяем, не куплена ли уже статья
    const existingPurchase = await this.db.query(
      'SELECT * FROM article_purchases WHERE "userId" = $1 AND "articleId" = $2',
      [userId, articleId]
    );

    if (existingPurchase.rows.length > 0) {
      return { success: true, articleId, alreadyPurchased: true };
    }

    // Создаем запись о покупке
    await this.db.create('article_purchases', {
      userId,
      articleId,
      paymentMethod: paymentData.method || 'CRYPTO',
      transactionId: paymentData.transactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true, articleId, transactionId: paymentData.transactionId };
  }

  /**
   * Повысить пользователя до тренера (если уровень >= 20)
   */
  async promoteToTrainer(userId: number) {
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.level < 20) {
      throw new Error('User level must be at least 20');
    }

    const existing = await this.db.findOne('academy_roles', { userId });

    if (existing) {
      return await this.db.update('academy_roles',
        { userId },
        { role: 'TRAINER', level: user.level, updatedAt: new Date() }
      );
    } else {
      return await this.db.create('academy_roles', {
        userId,
        role: 'TRAINER',
        level: user.level,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Получить роль пользователя в академии
   */
  async getUserRole(userId: number) {
    const role = await this.db.findOne('academy_roles', { userId });
    return role || { userId, role: 'STUDENT', level: 1 };
  }

  /**
   * Проверить, является ли пользователь тренером
   */
  async isTrainer(userId: number): Promise<boolean> {
    const role = await this.db.findOne('academy_roles', { userId });
    return role?.role === 'TRAINER';
  }

  /**
   * Получить список тренеров
   */
  async getTrainers() {
    const trainers = await this.db.query(
      `SELECT ar.*, u.id, u.nickname, u."firstName", u."lastName", u.level, u.avatar, u."photoUrl"
       FROM academy_roles ar
       JOIN users u ON ar."userId" = u.id
       WHERE ar.role = $1
       ORDER BY ar.level DESC`,
      ['TRAINER']
    );

    return trainers.rows.map(t => ({
      id: t.id,
      nickname: t.nickname,
      firstName: t.firstName,
      lastName: t.lastName,
      level: t.level,
      avatar: t.avatar,
      photoUrl: t.photoUrl,
      trainerLevel: t.level,
    }));
  }

  /**
   * Получить статьи тренера
   */
  async getTrainerArticles(trainerId: number) {
    return await this.db.findMany('academy_articles', {
      authorId: trainerId,
      isPublished: true,
    }, { orderBy: '"createdAt" DESC' });
  }

  /**
   * Создать платный курс/разбор от тренера
   */
  async createTrainerCourse(
    trainerId: number,
    data: {
      title: string;
      content: string;
      priceCoin: number;
      category?: string;
    },
  ) {
    // Проверяем, что пользователь - тренер
    const isTrainer = await this.isTrainer(trainerId);
    if (!isTrainer) {
      throw new Error('Only trainers can create courses');
    }

    return await this.db.create('academy_articles', {
      title: data.title,
      content: data.content,
      authorId: trainerId,
      isPaid: true,
      priceCoin: data.priceCoin,
      category: data.category || 'TRAINER_COURSE',
      isPublished: false, // Тренер должен опубликовать вручную
      views: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
