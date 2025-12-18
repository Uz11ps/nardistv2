import { api } from './api';

export const onboardingService = {
  async getStatus() {
    const response = await api.get('/onboarding/status');
    return response.data;
  },

  async markCityViewed() {
    const response = await api.post('/onboarding/city-view');
    return response.data;
  },
};

