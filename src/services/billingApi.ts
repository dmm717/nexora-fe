import { apiClient } from './apiClient';

export interface PlanPrice {
  id: string;
  amountMinor: number;
  currency: string;
  durationDays: number | null;
  interviewQuota: number;
}

export interface PlanView {
  id: string;
  code: string;
  name: string;
  prices: PlanPrice[];
}

export interface CheckoutSessionResponse {
  orderId: string;
  status: string;
  amountMinor: number;
  currency: string;
  provider: string;
  checkout?: {
    method: string;
    url: string;
    fields: Array<{ name: string; value: string }>;
  };
}

export const billingApi = {
  getPlans: async (): Promise<PlanView[]> => {
    const response = await apiClient.get('/plans') as { data: PlanView[] };
    return response.data;
  },

  createCheckoutSession: async (planPriceId: string): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.post('/checkout-sessions', { planPriceId }) as { data: CheckoutSessionResponse };
    return response.data;
  },

  getOrderStatus: async (orderId: string): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.get(`/checkout-sessions/${orderId}`) as { data: CheckoutSessionResponse };
    return response.data;
  },

  refreshOrderStatus: async (orderId: string): Promise<CheckoutSessionResponse> => {
    const response = await apiClient.post(`/checkout-sessions/${orderId}/refresh`) as { data: CheckoutSessionResponse };
    return response.data;
  }
};
