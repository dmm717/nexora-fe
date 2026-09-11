import { apiClient } from './apiClient';
import {
  normalizeProgressDashboardResponse,
  type ProgressDashboardResponse,
} from './progressDashboardContract';

export type { ProgressDashboardResponse };

export {
  normalizeProgressDashboardResponse,
  normalizeProgressDashboardReadiness,
  normalizeProgressDashboardCompetency,
  normalizeProgressDashboardImprovement,
  normalizeProgressDashboardWeeklyActivities,
  normalizeProgressHistoricalStats,
} from './progressDashboardContract';

export const progressDashboardApi = {
  get: async (): Promise<ProgressDashboardResponse> => {
    const response = (await apiClient.get('/progress/dashboard')) as { data: unknown };
    return normalizeProgressDashboardResponse(response.data);
  },
};

