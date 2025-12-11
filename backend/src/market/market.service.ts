import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MarketService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать объявление на рынке
   */
  async createListing(data: {
    userId: number;
    inventoryItemId?: number;
    skinId?: number;
    price: number;
    type: 'FIXED' | 'AUCTION';
    auctionEnd?: Date;
  }) {
    // Проверяем, что указан либо inventoryItemId, либо skinId
    if (!data.inventoryItemId && !data.skinId) {
      throw new Error('Either inventoryItemId or skinId must be provided');
    }

    // Если продается предмет из инвентаря, проверяем владение
    if (data.inventoryItemId) {
      const item = await this.prisma.inventoryItem.findUnique({
        where: { id: data.inventoryItemId },
      });

      if (!item || item.userId !== data.userId) {
        throw new Error('Item not found or access denied');
      }

      if (item.isEquipped) {
        throw new Error('Cannot sell equipped item');
      }
    }

    // Создаем объявление
    return this.prisma.marketListing.create({
      data: {
        userId: data.userId,
        inventoryItemId: data.inventoryItemId,
        skinId: data.skinId,
        price: data.price,
        type: data.type,
        auctionEnd: data.auctionEnd,
        status: 'ACTIVE',
      },
      include: {
        skin: true,
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
          },
        },
      },
    });
  }

  /**
   * Получить все активные объявления
   */
  async getActiveListings(filters?: {
    type?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const where: any = {
      status: 'ACTIVE',
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.skinType) {
      where.skin = {
        type: filters.skinType,
      };
    }

    if (filters?.minPrice) {
      where.price = { gte: filters.minPrice };
    }

    if (filters?.maxPrice) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }

    return this.prisma.marketListing.findMany({
      where,
      include: {
        skin: true,
        user: {
          select: {
            id: true,
            nickname: true,
            firstName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Купить предмет (фиксированная цена)
   */
  async buyItem(buyerId: number, listingId: number) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      include: {
        skin: true,
        user: true,
      },
    });

    if (!listing || listing.status !== 'ACTIVE') {
      throw new Error('Listing not found or not active');
    }

    if (listing.type !== 'FIXED') {
      throw new Error('This listing is an auction, not a fixed price');
    }

    if (listing.userId === buyerId) {
      throw new Error('Cannot buy your own listing');
    }

    // Проверяем баланс покупателя
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer || buyer.narCoin < listing.price) {
      throw new Error('Not enough NAR coins');
    }

    // Списываем деньги у покупателя
    await this.prisma.user.update({
      where: { id: buyerId },
      data: {
        narCoin: { decrement: listing.price },
      },
    });

    // Начисляем продавцу
    await this.prisma.user.update({
      where: { id: listing.userId },
      data: {
        narCoin: { increment: listing.price },
      },
    });

    // Если продавался предмет из инвентаря, передаем его покупателю
    if (listing.inventoryItemId) {
      await this.prisma.inventoryItem.update({
        where: { id: listing.inventoryItemId },
        data: {
          userId: buyerId,
          isEquipped: false,
        },
      });
    } else if (listing.skinId) {
      // Если продавался новый скин, создаем предмет в инвентаре покупателя
      if (!listing.skin) {
        throw new Error('Skin not found');
      }
      await this.prisma.inventoryItem.create({
        data: {
          userId: buyerId,
          skinId: listing.skinId,
          rarity: listing.skin.rarity,
          durability: listing.skin.durabilityMax,
          durabilityMax: listing.skin.durabilityMax,
          weight: listing.skin.weight,
          isEquipped: false,
        },
      });
    }

    // Помечаем объявление как проданное
    await this.prisma.marketListing.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
      },
    });

    return { success: true, listingId };
  }

  /**
   * Сделать ставку на аукционе
   */
  async placeBid(bidderId: number, listingId: number, bidAmount: number) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== 'ACTIVE') {
      throw new Error('Listing not found or not active');
    }

    if (listing.type !== 'AUCTION') {
      throw new Error('This listing is not an auction');
    }

    if (listing.userId === bidderId) {
      throw new Error('Cannot bid on your own listing');
    }

    if (listing.auctionEnd && new Date() > listing.auctionEnd) {
      throw new Error('Auction has ended');
    }

    if (listing.currentBid && bidAmount <= listing.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }

    // Проверяем баланс
    const bidder = await this.prisma.user.findUnique({
      where: { id: bidderId },
    });

    if (!bidder || bidder.narCoin < bidAmount) {
      throw new Error('Not enough NAR coins');
    }

    // Возвращаем предыдущую ставку (если была)
    if (listing.bidderId && listing.currentBid) {
      await this.prisma.user.update({
        where: { id: listing.bidderId },
        data: {
          narCoin: { increment: listing.currentBid },
        },
      });
    }

    // Списываем новую ставку
    await this.prisma.user.update({
      where: { id: bidderId },
      data: {
        narCoin: { decrement: bidAmount },
      },
    });

    // Обновляем объявление
    await this.prisma.marketListing.update({
      where: { id: listingId },
      data: {
        currentBid: bidAmount,
        bidderId: bidderId,
      },
    });

    return { success: true, bidAmount };
  }

  /**
   * Отменить объявление
   */
  async cancelListing(userId: number, listingId: number) {
    const listing = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.userId !== userId) {
      throw new Error('Listing not found or access denied');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('Cannot cancel non-active listing');
    }

    // Возвращаем ставку (если была)
    if (listing.bidderId && listing.currentBid) {
      await this.prisma.user.update({
        where: { id: listing.bidderId },
        data: {
          narCoin: { increment: listing.currentBid },
        },
      });
    }

    // Отменяем объявление
    await this.prisma.marketListing.update({
      where: { id: listingId },
      data: {
        status: 'CANCELLED',
      },
    });

    return { success: true };
  }
}

