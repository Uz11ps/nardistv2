import { api } from './api';

export interface InventoryItem {
  id: number;
  userId: number;
  skinId: number;
  rarity: string;
  durability: number;
  durabilityMax: number;
  weight: number;
  isEquipped: boolean;
  skin: {
    id: number;
    name: string;
    type: string;
    previewUrl: string;
  };
}

export const inventoryService = {
  async getMyInventory(): Promise<InventoryItem[]> {
    const response = await api.get<InventoryItem[]>('/inventory');
    // Гарантируем что возвращается массив
    return Array.isArray(response.data) ? response.data : [];
  },

  async toggleEquip(itemId: number): Promise<InventoryItem> {
    const response = await api.post<InventoryItem>(`/inventory/${itemId}/equip`);
    return response.data;
  },

  async repair(itemId: number, repairType: 'PARTIAL' | 'FULL'): Promise<InventoryItem> {
    const response = await api.post<InventoryItem>(`/inventory/${itemId}/repair`, { repairType });
    return response.data;
  },

  async getItemVisualInfo(itemId: number): Promise<{ item: InventoryItem; visualState: 'NEW' | 'USED' | 'WORN' | 'BROKEN'; durabilityPercentage: number }> {
    const response = await api.get(`/inventory/${itemId}/visual-info`);
    return response.data;
  },
};

