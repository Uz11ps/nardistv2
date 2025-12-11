import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить ресурсы пользователя
   */
  async getUserResources(userId: number) {
    return this.prisma.resource.findMany({
      where: { userId },
      orderBy: { type: 'asc' },
    });
  }

  /**
   * Добавить ресурсы пользователю
   */
  async addResource(userId: number, type: string, amount: number) {
    return this.prisma.resource.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      create: {
        userId,
        type,
        amount,
      },
      update: {
        amount: { increment: amount },
      },
    });
  }

  /**
   * Списать ресурсы
   */
  async removeResource(userId: number, type: string, amount: number) {
    const resource = await this.prisma.resource.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    if (!resource || resource.amount < amount) {
      throw new Error('Insufficient resources');
    }

    if (resource.amount === amount) {
      return this.prisma.resource.delete({
        where: {
          userId_type: {
            userId,
            type,
          },
        },
      });
    }

    return this.prisma.resource.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data: {
        amount: { decrement: amount },
      },
    });
  }

  /**
   * Проверить наличие ресурсов
   */
  async hasResources(userId: number, requirements: { type: string; amount: number }[]) {
    const resources = await this.prisma.resource.findMany({
      where: {
        userId,
        type: { in: requirements.map((r) => r.type) },
      },
    });

    for (const req of requirements) {
      const resource = resources.find((r) => r.type === req.type);
      if (!resource || resource.amount < req.amount) {
        return false;
      }
    }

    return true;
  }
}

