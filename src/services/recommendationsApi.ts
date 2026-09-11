import { apiClient } from './apiClient';
import {
  normalizeNextPracticeRecommendationResponse,
  type NextPracticeRecommendationResponse,
} from './recommendationContract';

export type { NextPracticeRecommendationResponse };

export {
  normalizeNextPracticeRecommendationResponse,
  getRecommendationDeepLink,
} from './recommendationContract';

export const recommendationsApi = {
  getNext: async (): Promise<NextPracticeRecommendationResponse | null> => {
    const response = (await apiClient.get('/recommendations/next')) as { data: unknown };
    return normalizeNextPracticeRecommendationResponse(response.data);
  },
};

