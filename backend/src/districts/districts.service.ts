import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistrictsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Инициализация 7 районов города
   */
  async initializeDistricts() {
    const districts = [
      {
        name: 'Дворы',
        description: 'Уличные столы для начинающих',
        type: 'COURTS',
        icon: '🏘️',
        commissionRate: 5,
      },
      {
        name: 'Клубы Нардистов',
        description: 'Премиум-клубы для опытных игроков',
        type: 'CLUBS',
        icon: '🎩',
        commissionRate: 5,
      },
      {
        name: 'Мастерские досок',
        description: 'Производство игровых досок',
        type: 'WORKSHOPS',
        icon: '🔨',
        commissionRate: 5,
      },
      {
        name: 'Фабрики зариков',
        description: 'Производство кубиков',
        type: 'FACTORIES',
        icon: '🏭',
        commissionRate: 5,
      },
      {
        name: 'Цеха стаканов и фишек',
        description: 'Производство аксессуаров',
        type: 'WORKSHOPS_CUPS',
        icon: '⚙️',
        commissionRate: 5,
      },
      {
        name: 'Школа Нардиста',
        description: 'Обучение и развитие',
        type: 'SCHOOL',
        icon: '📚',
        commissionRate: 5,
      },
      {
        name: 'Турнирная Арена',
        description: 'Центр соревнований и спонсоров',
        type: 'ARENA',
        icon: '🏟️',
        commissionRate: 5,
      },
    ];

    const created = [];
    for (const district of districts) {
      const existing = await this.prisma.district.findFirst({
        where: { type: district.type },
      });

      if (!existing) {
        const newDistrict = await this.prisma.district.create({
          data: district,
        });
        // Создаем фонд для района
        await this.prisma.districtFund.create({
          data: {
            districtId: newDistrict.id,
            balance: 0,
          },
        });
        created.push(newDistrict);
      } else {
        created.push(existing);
      }
    }

    return created;
  }

  /**
   * Получить все районы
   */
  async getAllDistricts() {
    return this.prisma.district.findMany({
      include: {
        clan: {
          include: {
            leader: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                photoUrl: true,
              },
            },
          },
        },
        fund: true,
        _count: {
          select: {
            businesses: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Получить район по ID
   */
  async getDistrictById(id: number) {
    return this.prisma.district.findUnique({
      where: { id },
      include: {
        clan: {
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
          },
        },
        fund: true,
        businesses: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Получить район по типу
   */
  async getDistrictByType(type: string) {
    return this.prisma.district.findFirst({
      where: { type },
      include: {
        clan: true,
        fund: true,
      },
    });
  }

  /**
   * Установить контроль клана над районом
   */
  async setClanControl(districtId: number, clanId: number) {
    return this.prisma.district.update({
      where: { id: districtId },
      data: { clanId },
    });
  }

  /**
   * Снять контроль клана с района
   */
  async removeClanControl(districtId: number) {
    return this.prisma.district.update({
      where: { id: districtId },
      data: { clanId: null },
    });
  }
}

