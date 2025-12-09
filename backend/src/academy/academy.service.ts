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

  async getArticle(id: number) {
    const article = await this.prisma.academyArticle.findUnique({
      where: { id },
    });

    if (!article || !article.isPublished) {
      throw new Error('Article not found');
    }

    // Увеличиваем счетчик просмотров
    await this.prisma.academyArticle.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return article;
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

