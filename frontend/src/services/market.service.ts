import { api } from './api';

export interface MarketListing {
  id: number;
  userId: number;
  inventoryItemId?: number;
  skinId?: number;
  price: number;
  type: 'FIXED' | 'AUCTION';
  auctionEnd?: string;
  currentBid?: number;
  bidderId?: number;
  status: string;
  user?: {
    id: number;
    firstName: string;
    username?: string;
  };
  inventoryItem?: {
    id: number;
    skin: {
      name: string;
      type: string;
      previewUrl: string;
    };
  };
  skin?: {
    id: number;
    name: string;
    type: string;
    previewUrl: string;
  };
}

export const marketService = {
  async getListings(filters?: {
    type?: string;
    skinType?: string;
    rarity?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<MarketListing[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.skinType) params.append('skinType', filters.skinType);
    if (filters?.rarity) params.append('rarity', filters.rarity);
    if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    
    const response = await api.get<MarketListing[]>(`/market?${params.toString()}`);
    return response.data;
  },

  async createListing(data: {
    inventoryItemId?: number;
    skinId?: number;
    price: number;
    type: 'FIXED' | 'AUCTION';
    auctionEnd?: string;
  }): Promise<MarketListing> {
    const response = await api.post<MarketListing>('/market/create', data);
    return response.data;
  },

  async buy(listingId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/market/${listingId}/buy`);
    return response.data;
  },

  async placeBid(listingId: number, bidAmount: number): Promise<{ success: boolean }> {
    const response = await api.post(`/market/${listingId}/bid`, { bidAmount });
    return response.data;
  },

  async cancelListing(listingId: number): Promise<{ success: boolean }> {
    const response = await api.post(`/market/${listingId}/cancel`);
    return response.data;
  },
};

