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
    // Проверяем, есть ли запись о покупке (можно добавить модель ArticlePurchase)
    // Пока проверяем через подписку или прямую оплату
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return false;
    }

    // Если есть активная подписка, доступ открыт
    if (user.subscription && user.subscription.isActive && new Date() < user.subscription.endDate) {
      return true;
    }

    // TODO: Проверить прямую покупку статьи (нужно добавить модель ArticlePurchase)
    // Пока возвращаем false для платных статей без подписки
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

    // Списываем NAR
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        narCoin: { decrement: article.priceCoin },
      },
    });

    // TODO: Создать запись о покупке (нужна модель ArticlePurchase)
    // Пока просто возвращаем успех

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

    // TODO: Создать запись о покупке

    return { success: true, articleId, transactionId: paymentData.transactionId };
  }

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
      },
      create: {
        userId,
        role: 'TRAINER',
      },
    });
  }
}

