import { api } from './api';

export interface ReferralStats {
  totalReferrals: number;
  referralCode: string;
  referralLink?: {
    telegram: string;
    web: string;
    code: string;
  };
}

export const referralsService = {
  async getStats(): Promise<ReferralStats> {
    const response = await api.get<ReferralStats>('/referrals/stats');
    return response.data;
  },

  async getLink(): Promise<{ telegram: string; web: string; code: string }> {
    const response = await api.get('/referrals/link');
    return response.data;
  },

  async useCode(code: string): Promise<{ success: boolean; referrerId: number }> {
    const response = await api.post('/referrals/use', { code });
    return response.data;
  },
};

