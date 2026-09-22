import { apiClient } from './apiClient';

export interface PlatformStatsResponse {
  userCount: number;
  completedInterviewCount: number;
  completedCvAnalysisCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export const platformStatsApi = {
  get: async (): Promise<PlatformStatsResponse> => {
    const response = (await apiClient.get('/public/platform-stats')) as {
      data: PlatformStatsResponse;
    };
    return response.data;
  },
};
