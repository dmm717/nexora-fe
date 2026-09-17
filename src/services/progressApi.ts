import { apiClient } from './apiClient';
import {
  normalizeProgressHistoricalStats,
  type ProgressHistoricalStatsResponse,
} from './progressDashboardContract';

export type ProgressResponse = ProgressHistoricalStatsResponse;

export const progressApi = {
  getProgressAnalytics: async (): Promise<ProgressResponse> => {
    const response = (await apiClient.get('/progress')) as { data: unknown };
    return normalizeProgressHistoricalStats(response.data);
  },
};
