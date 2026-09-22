import { apiClient } from './apiClient';
import {
  DEFAULT_PUBLIC_FEEDBACK_LIMIT,
  type AdminFeedbackFilters,
  type AdminFeedbackPageResponse,
  type AdminFeedbackResponse,
  type AdminFeedbackSummaryResponse,
  type FeedbackRequest,
  type FeedbackResponse,
  type PublicFeedbackPageResponse,
} from './feedbackContract';

export * from './feedbackContract';

function toQueryString(values: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const feedbackApi = {
  // Current user feedback
  getMyFeedback: async (): Promise<FeedbackResponse | null> => {
    const response = (await apiClient.get('/me/feedback')) as { data: FeedbackResponse | null };
    return response.data;
  },

  upsertMyFeedback: async (request: FeedbackRequest): Promise<FeedbackResponse> => {
    const response = (await apiClient.put('/me/feedback', request)) as { data: FeedbackResponse };
    return response.data;
  },

  deleteMyFeedback: async (): Promise<void> => {
    await apiClient.delete('/me/feedback');
  },

  // Public testimonials
  getPublicFeedback: async (limit: number = DEFAULT_PUBLIC_FEEDBACK_LIMIT): Promise<PublicFeedbackPageResponse> => {
    const response = (await apiClient.get(`/feedback/public?limit=${limit}`)) as { data: PublicFeedbackPageResponse };
    return response.data;
  },

  // Admin moderation
  getAdminFeedback: async (filters: AdminFeedbackFilters = {}): Promise<AdminFeedbackPageResponse> => {
    const query = toQueryString(filters as Record<string, unknown>);
    const response = (await apiClient.get(`/admin/feedback${query}`)) as { data: AdminFeedbackPageResponse };
    return response.data;
  },

  getAdminFeedbackSummary: async (): Promise<AdminFeedbackSummaryResponse> => {
    const response = (await apiClient.get('/admin/feedback/summary')) as { data: AdminFeedbackSummaryResponse };
    return response.data;
  },

  approveFeedback: async (id: string, reason?: string): Promise<AdminFeedbackResponse> => {
    const response = (await apiClient.post(`/admin/feedback/${id}/approve`, { reason })) as {
      data: AdminFeedbackResponse;
    };
    return response.data;
  },

  rejectFeedback: async (id: string, reason?: string): Promise<AdminFeedbackResponse> => {
    const response = (await apiClient.post(`/admin/feedback/${id}/reject`, { reason })) as {
      data: AdminFeedbackResponse;
    };
    return response.data;
  },

  featureFeedback: async (id: string, reason?: string): Promise<AdminFeedbackResponse> => {
    const response = (await apiClient.post(`/admin/feedback/${id}/feature`, { reason })) as {
      data: AdminFeedbackResponse;
    };
    return response.data;
  },

  unfeatureFeedback: async (id: string, reason?: string): Promise<AdminFeedbackResponse> => {
    const response = (await apiClient.post(`/admin/feedback/${id}/unfeature`, { reason })) as {
      data: AdminFeedbackResponse;
    };
    return response.data;
  },
};
