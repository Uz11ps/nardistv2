import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EconomyService } from '../economy/economy.service';

@Injectable()
export class ClansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly economyService: EconomyService,
  ) {}

  /**
   * Создать клан
   */
  async createClan(userId: number, data: { name: string; description?: string }) {
    // Проверяем, что пользователь не состоит в другом клане
    const existingMember = await this.prisma.clanMember.findFirst({
      where: { userId },
    });

    if (existingMember) {
      throw new Error('User is already a member of a clan');
    }

    // Проверяем, что имя клана уникально
    const existingClan = await this.prisma.clan.findUnique({
      where: { name: data.name },
    });

    if (existingClan) {
      throw new Error('Clan name already exists');
    }

    // Создаем клан
    const clan = await this.prisma.clan.create({
      data: {
        name: data.name,
        description: data.description,
        leaderId: userId,
        treasury: 0,
      },
    });

    // Добавляем создателя как лидера
    await this.prisma.clanMember.create({
      data: {
        clanId: clan.id,
        userId,
        role: 'LEADER',
      },
    });

    return clan;
  }

  /**
   * Получить все кланы
   */
  async getAllClans() {
    return this.prisma.clan.findMany({
      include: {
        leader: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                photoUrl: true,
              },
            },
          },
        },
        districts: true,
        _count: {
          select: {
            members: true,
            districts: true,
          },
        },
      },
      orderBy: { treasury: 'desc' },
    });
  }

  /**
   * Получить клан по ID
   */
  async getClanById(id: number) {
    return this.prisma.clan.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                photoUrl: true,
              },
            },
          },
          orderBy: { role: 'asc' },
        },
        districts: {
          include: {
            fund: true,
          },
        },
      },
    });
  }

  /**
   * Получить клан пользователя
   */
  async getUserClan(userId: number) {
    const member = await this.prisma.clanMember.findFirst({
      where: { userId },
      include: {
        clan: {
          include: {
            leader: true,
            districts: true,
          },
        },
      },
    });

    return member?.clan || null;
  }

  /**
   * Присоединиться к клану
   */
  async joinClan(userId: number, clanId: number) {
    // Проверяем, что пользователь не состоит в другом клане
    const existingMember = await this.prisma.clanMember.findFirst({
      where: { userId },
    });

    if (existingMember) {
      throw new Error('User is already a member of a clan');
    }

    // Проверяем, что клан существует
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
    });

    if (!clan) {
      throw new Error('Clan not found');
    }

    // Добавляем участника
    return this.prisma.clanMember.create({
      data: {
        clanId,
        userId,
        role: 'MEMBER',
      },
    });
  }

  /**
   * Покинуть клан
   */
  async leaveClan(userId: number, clanId: number) {
    const member = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error('User is not a member of this clan');
    }

    if (member.role === 'LEADER') {
      throw new Error('Leader cannot leave the clan');
    }

    return this.prisma.clanMember.delete({
      where: {
        clanId_userId: {
          clanId,
          userId,
        },
      },
    });
  }

  /**
   * Изменить роль участника (только лидер)
   */
  async changeMemberRole(
    leaderId: number,
    clanId: number,
    memberId: number,
    newRole: string,
  ) {
    // Проверяем, что вызывающий является лидером
    const leader = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: leaderId,
        },
      },
    });

    if (!leader || leader.role !== 'LEADER') {
      throw new Error('Only leader can change roles');
    }

    // Обновляем роль
    return this.prisma.clanMember.update({
      where: {
        clanId_userId: {
          clanId,
          userId: memberId,
        },
      },
      data: { role: newRole },
    });
  }

  /**
   * Распределить средства из казны
   */
  async distributeTreasury(
    leaderId: number,
    clanId: number,
    amount: number,
    recipientId: number,
  ) {
    // Проверяем права
    const leader = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: leaderId,
        },
      },
    });

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    // Проверяем баланс
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
    });

    if (!clan || clan.treasury < amount) {
      throw new Error('Insufficient treasury balance');
    }

    // Списываем с казны
    await this.prisma.clan.update({
      where: { id: clanId },
      data: {
        treasury: { decrement: amount },
      },
    });

    // Начисляем игроку
    await this.prisma.user.update({
      where: { id: recipientId },
      data: {
        narCoin: { increment: amount },
      },
    });

    return { success: true, newTreasury: clan.treasury - amount };
  }

  /**
   * Получить фонды районов, контролируемых кланом
   */
  async getDistrictFunds(clanId: number) {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        districts: {
          include: {
            fund: true,
          },
        },
      },
    });

    if (!clan) {
      throw new Error('Clan not found');
    }

    return clan.districts.map((district) => ({
      district,
      fund: district.fund || { balance: 0 },
    }));
  }

  /**
   * Распределить фонд района: часть в казну клана, часть участникам
   */
  async distributeDistrictFund(
    leaderId: number,
    clanId: number,
    districtId: number,
    amount: number,
    clanShare?: number, // Доля для казны клана (0-1), по умолчанию 0.5
  ) {
    // Проверяем права
    const leader = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: leaderId,
        },
      },
    });

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    // Проверяем, что район контролируется кланом
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!district || district.clanId !== clanId) {
      throw new Error('District is not controlled by this clan');
    }

    // Используем метод из EconomyService с распределением
    return this.economyService.distributeDistrictFund(districtId, amount, clanShare);
  }

  /**
   * Обновить информацию о клане
   */
  async updateClan(leaderId: number, clanId: number, data: { name?: string; description?: string }) {
    // Проверяем права
    const leader = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: leaderId,
        },
      },
    });

    if (!leader || leader.role !== 'LEADER') {
      throw new Error('Only leader can update clan');
    }

    // Если меняется имя, проверяем уникальность
    if (data.name) {
      const existingClan = await this.prisma.clan.findUnique({
        where: { name: data.name },
      });

      if (existingClan && existingClan.id !== clanId) {
        throw new Error('Clan name already exists');
      }
    }

    return this.prisma.clan.update({
      where: { id: clanId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  /**
   * Исключить участника из клана
   */
  async kickMember(leaderId: number, clanId: number, memberId: number) {
    // Проверяем права
    const leader = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: leaderId,
        },
      },
    });

    if (!leader || !['LEADER', 'OFFICER'].includes(leader.role)) {
      throw new Error('Insufficient permissions');
    }

    // Нельзя исключить лидера
    const member = await this.prisma.clanMember.findUnique({
      where: {
        clanId_userId: {
          clanId,
          userId: memberId,
        },
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    if (member.role === 'LEADER') {
      throw new Error('Cannot kick leader');
    }

    return this.prisma.clanMember.delete({
      where: {
        clanId_userId: {
          clanId,
          userId: memberId,
        },
      },
    });
  }
}

