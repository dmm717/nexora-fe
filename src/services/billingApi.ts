import { apiClient } from './apiClient';

export interface PlanPrice {
  id: string;
  amountMinor: number;
  currency: string;
  durationDays: number | null;
  interviewQuota: number | null;
  features: PlanFeature[];
}

export interface PlanFeature {
  code: string;
  name: string;
  enabled: boolean;
  limit: number | null;
  unlimited: boolean;
}

export interface PlanView {
  id: string;
  code: string;
  name: string;
  description: string;
  badge: string | null;
  isHighlighted: boolean;
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

export interface OrderHistoryItem {
  id: string;
  planCode: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface OrderHistoryPage { items: OrderHistoryItem[]; nextCursor: string | null }

export const billingApi = {
  getOrderHistory: async (cursor?: string | null, status?: string): Promise<OrderHistoryPage> => {
    const params = new URLSearchParams({ pageSize: '20' });
    if (cursor) params.set('cursor', cursor);
    if (status) params.set('status', status);
    return (await apiClient.get(`/me/orders?${params}`) as { data: OrderHistoryPage }).data;
  },
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
