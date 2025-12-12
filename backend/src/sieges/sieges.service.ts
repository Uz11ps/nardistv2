import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiegesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать осаду района
   */
  async createSiege(leaderId: number, districtId: number) {
    // Проверяем права лидера
    const leader = await this.prisma.user.findUnique({
      where: { id: leaderId },
      include: {
        ownedClans: true,
      },
    });

    if (!leader || !leader.ownedClans || leader.ownedClans.length === 0) {
      throw new Error('User is not a clan leader');
    }

    const clan = leader.ownedClans[0];

    // Проверяем район
    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      include: { clan: true },
    });

    if (!district) {
      throw new Error('District not found');
    }

    // Проверяем, что нет активной осады
    const activeSiege = await this.prisma.siege.findFirst({
      where: {
        districtId,
        status: 'ACTIVE',
      },
    });

    if (activeSiege) {
      throw new Error('District is already under siege');
    }

    // Нельзя осаждать свой же район
    if (district.clanId === clan.id) {
      throw new Error('Cannot siege your own district');
    }

    // Создаем осаду
    return this.prisma.siege.create({
      data: {
        districtId,
        attackingClanId: clan.id,
        defendingClanId: district.clanId,
        status: 'ACTIVE',
        requiredWins: 5,
      },
      include: {
        district: true,
        attackingClan: true,
        defendingClan: true,
      },
    });
  }

  /**
   * Зарегистрировать результат игры в осаде
   */
  async recordSiegeGame(siegeId: number, whitePlayerId: number, blackPlayerId: number, winnerId: number, gameHistoryId?: number) {
    const siege = await this.prisma.siege.findUnique({
      where: { id: siegeId },
      include: {
        attackingClan: {
          include: { members: true },
        },
        defendingClan: {
          include: { members: true },
        },
      },
    });

    if (!siege || siege.status !== 'ACTIVE') {
      throw new Error('Siege not found or not active');
    }

    // Определяем, какой клан выиграл
    const winnerIsAttacking = siege.attackingClan.members.some((m) => m.userId === winnerId);
    const winnerIsDefending = siege.defendingClan?.members.some((m) => m.userId === winnerId);

    if (!winnerIsAttacking && !winnerIsDefending) {
      throw new Error('Winner is not a member of participating clans');
    }

    // Записываем игру
    await this.prisma.siegeGame.create({
      data: {
        siegeId,
        whitePlayerId,
        blackPlayerId,
        winnerId,
        gameHistoryId,
      },
    });

    // Обновляем счет
    const updateData: any = {};
    if (winnerIsAttacking) {
      updateData.attackingWins = { increment: 1 };
    } else if (winnerIsDefending) {
      updateData.defendingWins = { increment: 1 };
    }

    const updated = await this.prisma.siege.update({
      where: { id: siegeId },
      data: updateData,
    });

    // Получаем обновленную осаду
    const updatedSiege = await this.prisma.siege.findUnique({
      where: { id: siegeId },
    });

    if (!updatedSiege) {
      return updated;
    }

    // Проверяем, достигнут ли лимит побед
    if (updatedSiege.attackingWins >= updatedSiege.requiredWins) {
      // Атакующий клан побеждает
      await this.finishSiege(siegeId, updatedSiege.attackingClanId);
    } else if (updatedSiege.defendingWins >= updatedSiege.requiredWins && siege.defendingClanId) {
      // Защищающий клан побеждает
      await this.finishSiege(siegeId, siege.defendingClanId);
    }

    return updated;
  }

  /**
   * Завершить осаду и передать контроль района
   */
  private async finishSiege(siegeId: number, winnerClanId: number) {
    const siege = await this.prisma.siege.findUnique({
      where: { id: siegeId },
    });

    if (!siege) {
      return;
    }

    // Обновляем осаду
    await this.prisma.siege.update({
      where: { id: siegeId },
      data: {
        status: 'FINISHED',
        winnerClanId,
        endDate: new Date(),
      },
    });

    // Передаем контроль района победившему клану
    await this.prisma.district.update({
      where: { id: siege.districtId },
      data: {
        clanId: winnerClanId,
      },
    });

    // Если был защищающий клан, сбрасываем его контроль
    // (уже сделано выше через обновление clanId)
  }

  /**
   * Получить активные осады
   */
  async getActiveSieges() {
    return this.prisma.siege.findMany({
      where: { status: 'ACTIVE' },
      include: {
        district: true,
        attackingClan: true,
        defendingClan: true,
        siegeGames: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Получить осады клана
   */
  async getClanSieges(clanId: number) {
    return this.prisma.siege.findMany({
      where: {
        OR: [
          { attackingClanId: clanId },
          { defendingClanId: clanId },
        ],
      },
      include: {
        district: true,
        attackingClan: true,
        defendingClan: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Получить осаду по ID
   */
  async getSiegeById(siegeId: number) {
    return this.prisma.siege.findUnique({
      where: { id: siegeId },
      include: {
        district: true,
        attackingClan: true,
        defendingClan: true,
        siegeGames: {
          include: {
            siege: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}

