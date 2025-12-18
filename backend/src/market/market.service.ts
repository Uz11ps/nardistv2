import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MarketService {
  constructor(private readonly db: DatabaseService) {}

  async createListing(data: {
    userId: number;
    inventoryItemId?: number;
    skinId?: number;
    price: number;
    type: 'FIXED' | 'AUCTION';
    auctionEnd?: Date;
  }) {
    if (!data.inventoryItemId && !data.skinId) {
      throw new Error('Either inventoryItemId or skinId must be provided');
    }

    if (data.inventoryItemId) {
      const item = await this.db.findOne('inventory_items', { id: data.inventoryItemId });
      if (!item || item.userId !== data.userId) {
        throw new Error('Item not found or access denied');
      }
      if (item.isEquipped) {
        throw new Error('Cannot sell equipped item');
      }
    }

    const listing = await this.db.create('market_listings', {
      userId: data.userId,
      inventoryItemId: data.inventoryItemId || null,
      skinId: data.skinId || null,
      price: data.price,
      type: data.type,
      auctionEnd: data.auctionEnd || null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [skin, user] = await Promise.all([
      listing.skinId ? this.db.findOne('skins', { id: listing.skinId }) : null,
      this.db.query(
        'SELECT id, nickname, "firstName" FROM users WHERE id = $1',
        [data.userId]
      ).then(r => r.rows[0]),
    ]);

    return {
      ...listing,
      skin: skin || null,
      user: user || null,
    };
  }

  async getActiveListings(filters?: {
    type?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    let query = `SELECT ml.*, s.*, u.id as "userId", u.nickname, u."firstName", u."photoUrl"
                 FROM market_listings ml
                 LEFT JOIN skins s ON ml."skinId" = s.id
                 LEFT JOIN users u ON ml."userId" = u.id
                 WHERE ml.status = 'ACTIVE'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.type) {
      query += ` AND ml.type = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters?.skinType) {
      query += ` AND s.type = $${paramIndex++}`;
      params.push(filters.skinType);
    }

    if (filters?.minPrice) {
      query += ` AND ml.price >= $${paramIndex++}`;
      params.push(filters.minPrice);
    }

    if (filters?.maxPrice) {
      query += ` AND ml.price <= $${paramIndex++}`;
      params.push(filters.maxPrice);
    }

    query += ` ORDER BY ml."createdAt" DESC`;

    const listings = await this.db.query(query, params);

    return listings.rows.map(l => ({
      ...l,
      skin: l.skinId ? {
        id: l.skinId,
        name: l.name,
        type: l.type,
        previewUrl: l.previewUrl,
        rarity: l.rarity,
        weight: l.weight,
        durabilityMax: l.durabilityMax,
        isDefault: l.isDefault,
        priceCoin: l.priceCoin,
        isActive: l.isActive,
      } : null,
      user: {
        id: l.userId,
        nickname: l.nickname,
        firstName: l.firstName,
        photoUrl: l.photoUrl,
      },
    }));
  }

  async buyItem(buyerId: number, listingId: number) {
    const listing = await this.db.query(
      `SELECT ml.*, s.*, u.*
       FROM market_listings ml
       LEFT JOIN skins s ON ml."skinId" = s.id
       LEFT JOIN users u ON ml."userId" = u.id
       WHERE ml.id = $1`,
      [listingId]
    ).then(r => r.rows[0]);

    if (!listing || listing.status !== 'ACTIVE') {
      throw new Error('Listing not found or not active');
    }

    if (listing.type !== 'FIXED') {
      throw new Error('This listing is an auction, not a fixed price');
    }

    if (listing.userId === buyerId) {
      throw new Error('Cannot buy your own listing');
    }

    const buyer = await this.db.findOne('users', { id: buyerId });
    if (!buyer || buyer.narCoin < listing.price) {
      throw new Error('Not enough NAR coins');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [listing.price, buyerId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [listing.price, listing.userId]
      );

      if (listing.inventoryItemId) {
        await client.query(
          'UPDATE inventory_items SET "userId" = $1, "isEquipped" = false WHERE id = $2',
          [buyerId, listing.inventoryItemId]
        );
      } else if (listing.skinId) {
        await client.query(
          `INSERT INTO inventory_items ("userId", "skinId", rarity, durability, "durabilityMax", weight, "isEquipped", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)`,
          [
            buyerId,
            listing.skinId,
            listing.rarity,
            listing.durabilityMax,
            listing.durabilityMax,
            listing.weight,
            new Date(),
            new Date(),
          ]
        );
      }

      await client.query(
        'UPDATE market_listings SET status = $1 WHERE id = $2',
        ['SOLD', listingId]
      );
    });

    return { success: true, listingId };
  }

  async placeBid(bidderId: number, listingId: number, bidAmount: number) {
    const listing = await this.db.findOne('market_listings', { id: listingId });

    if (!listing || listing.status !== 'ACTIVE') {
      throw new Error('Listing not found or not active');
    }

    if (listing.type !== 'AUCTION') {
      throw new Error('This listing is not an auction');
    }

    if (listing.userId === bidderId) {
      throw new Error('Cannot bid on your own listing');
    }

    if (listing.auctionEnd && new Date() > new Date(listing.auctionEnd)) {
      throw new Error('Auction has ended');
    }

    if (listing.currentBid && bidAmount <= listing.currentBid) {
      throw new Error('Bid must be higher than current bid');
    }

    const bidder = await this.db.findOne('users', { id: bidderId });
    if (!bidder || bidder.narCoin < bidAmount) {
      throw new Error('Not enough NAR coins');
    }

    await this.db.transaction(async (client) => {
      if (listing.bidderId && listing.currentBid) {
        await client.query(
          'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
          [listing.currentBid, listing.bidderId]
        );
      }

      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [bidAmount, bidderId]
      );

      await client.query(
        'UPDATE market_listings SET "currentBid" = $1, "bidderId" = $2 WHERE id = $3',
        [bidAmount, bidderId, listingId]
      );
    });

    return { success: true, bidAmount };
  }

  async cancelListing(userId: number, listingId: number) {
    const listing = await this.db.findOne('market_listings', { id: listingId });

    if (!listing || listing.userId !== userId) {
      throw new Error('Listing not found or access denied');
    }

    if (listing.status !== 'ACTIVE') {
      throw new Error('Cannot cancel non-active listing');
    }

    await this.db.transaction(async (client) => {
      if (listing.bidderId && listing.currentBid) {
        await client.query(
          'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
          [listing.currentBid, listing.bidderId]
        );
      }

      await client.query(
        'UPDATE market_listings SET status = $1 WHERE id = $2',
        ['CANCELLED', listingId]
      );
    });

    return { success: true };
  }
}
