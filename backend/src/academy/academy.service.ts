import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademyService {
  constructor(private readonly prisma: PrismaService) {}

  async getArticles(category?: string) {
    return this.prisma.academyArticle.findMany({
      where: {
        isPublished: true,
        category: category || undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getArticle(id: number, userId?: number) {
    const article = await this.prisma.academyArticle.findUnique({
      where: { id },
    });

    if (!article || !article.isPublished) {
      throw new Error('Article not found');
    }

    // Если статья платная, проверяем доступ
    if (article.isPaid && userId) {
      const hasAccess = await this.checkArticleAccess(userId, id);
      if (!hasAccess) {
        throw new Error('Article access denied. Payment required.');
      }
    }

    // Увеличиваем счетчик просмотров
    await this.prisma.academyArticle.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  /**
   * Проверить доступ к статье
   */
  async checkArticleAccess(userId: number, articleId: number): Promise<boolean> {
    const article = await this.prisma.academyArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return false;
    }

    // Если статья бесплатная, доступ открыт
    if (!article.isPaid) {
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        subscription: true,
        articlePurchases: {
          where: { articleId },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Если есть активная подписка, доступ открыт
    if (user.subscription && user.subscription.isActive && new Date() < user.subscription.endDate) {
      return true;
    }

    // Проверяем, куплена ли статья
    if (user.articlePurchases && user.articlePurchases.length > 0) {
      return true;
    }

    return false;
  }

  /**
   * Купить доступ к статье за NAR
   */
  async purchaseArticleWithNAR(userId: number, articleId: number) {
    const article = await this.prisma.academyArticle.findUnique({
      where: { id: articleId },
    });

    if (!article || !article.isPaid) {
      throw new Error('Article not found or not paid');
    }

    if (!article.priceCoin || article.priceCoin <= 0) {
      throw new Error('Article cannot be purchased with NAR');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.narCoin < article.priceCoin) {
      throw new Error('Not enough NAR coins');
    }

    // Проверяем, не куплена ли уже статья
    const existingPurchase = await this.prisma.articlePurchase.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingPurchase) {
      return { success: true, articleId, alreadyPurchased: true };
    }

    // Списываем NAR
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: article.priceCoin },
      },
    });

    // Создаем запись о покупке
    await this.prisma.articlePurchase.create({
      data: {
        userId,
        articleId,
        paymentMethod: 'NAR',
        amount: article.priceCoin,
      },
    });

    return { success: true, articleId };
  }

  /**
   * Купить доступ к статье за TON/USDT
   */
  async purchaseArticleWithCrypto(userId: number, articleId: number, paymentData: any) {
    const article = await this.prisma.academyArticle.findUnique({
      where: { id: articleId },
    });

    if (!article || !article.isPaid) {
      throw new Error('Article not found or not paid');
    }

    if (!article.priceCrypto) {
      throw new Error('Article cannot be purchased with crypto');
    }

    // TODO: Интеграция с платежной системой TON/USDT
    // Пока просто возвращаем успех (в реальности нужно проверить платеж)

    // Проверяем, не куплена ли уже статья
    const existingPurchase = await this.prisma.articlePurchase.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingPurchase) {
      return { success: true, articleId, alreadyPurchased: true };
    }

    // Создаем запись о покупке
    await this.prisma.articlePurchase.create({
      data: {
        userId,
        articleId,
        paymentMethod: paymentData.method || 'CRYPTO',
        transactionId: paymentData.transactionId,
      },
    });

    return { success: true, articleId, transactionId: paymentData.transactionId };
  }

  /**
   * Повысить пользователя до тренера (если уровень >= 20)
   */
  async promoteToTrainer(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.level < 20) {
      throw new Error('User level must be at least 20');
    }

    return this.prisma.academyRole.upsert({
      where: { userId },
      update: {
        role: 'TRAINER',
        level: user.level,
      },
      create: {
        userId,
        role: 'TRAINER',
        level: user.level,
      },
    });
  }

  /**
   * Получить роль пользователя в академии
   */
  async getUserRole(userId: number) {
    const role = await this.prisma.academyRole.findUnique({
      where: { userId },
    });

    return role || { userId, role: 'STUDENT', level: 1 };
  }

  /**
   * Проверить, является ли пользователь тренером
   */
  async isTrainer(userId: number): Promise<boolean> {
    const role = await this.prisma.academyRole.findUnique({
      where: { userId },
    });

    return role?.role === 'TRAINER';
  }

  /**
   * Получить список тренеров
   */
  async getTrainers() {
    const trainers = await this.prisma.academyRole.findMany({
      where: { role: 'TRAINER' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            lastName: true,
            level: true,
            avatar: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { level: 'desc' },
    });

    return trainers.map(t => ({
      ...t.user,
      trainerLevel: t.level,
    }));
  }

  /**
   * Получить статьи тренера
   */
  async getTrainerArticles(trainerId: number) {
    return this.prisma.academyArticle.findMany({
      where: {
        authorId: trainerId,
        isPublished: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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

    return this.prisma.academyArticle.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: trainerId,
        isPaid: true,
        priceCoin: data.priceCoin,
        category: data.category || 'TRAINER_COURSE',
        isPublished: false, // Тренер должен опубликовать вручную
      },
    });
  }
}

