import { api } from './api';

export interface AcademyArticle {
  id: number;
  title: string;
  content: string;
  authorId: number;
  isPaid: boolean;
  priceCoin: number;
  category: string;
  isPublished: boolean;
  views: number;
  createdAt: string;
}

export const academyService = {
  async getArticles(category?: string): Promise<AcademyArticle[]> {
    const response = await api.get<AcademyArticle[]>('/academy/articles', {
      params: category ? { category } : {},
    });
    return response.data;
  },

  async getArticle(id: number): Promise<AcademyArticle> {
    const response = await api.get<AcademyArticle>(`/academy/articles/${id}`);
    return response.data;
  },

  async purchaseArticleWithNAR(articleId: number): Promise<{ success: boolean; articleId: number }> {
    const response = await api.post(`/academy/articles/${articleId}/purchase-nar`);
    return response.data;
  },

  async purchaseArticleWithCrypto(articleId: number, paymentData: any): Promise<{ success: boolean; articleId: number; transactionId?: string }> {
    const response = await api.post(`/academy/articles/${articleId}/purchase-crypto`, paymentData);
    return response.data;
  },
};

