import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(telegramUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: telegramUser.id },
    });

    if (user) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          avatar: telegramUser.photo_url,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        avatar: telegramUser.photo_url,
        referralCode: randomUUID(),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByTelegramId(telegramId: number) {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }