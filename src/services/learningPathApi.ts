import { apiClient } from './apiClient';
import {
  normalizeLearningPathResponse,
  type LearningPathResponse,
  type LearningPathMilestoneResponse,
  type LearningPathActivityResponse,
  type LearningPathProgressResponse,
  type UpdateLearningPathActivityRequest,
} from './learningPathContract';

export type {
  LearningPathResponse,
  LearningPathMilestoneResponse,
  LearningPathActivityResponse,
  LearningPathProgressResponse,
  UpdateLearningPathActivityRequest,
};

export {
  LearningPathValues,
  normalizeLearningPathResponse,
  getActivityDeepLink,
} from './learningPathContract';

export const learningPathApi = {
  get: async (): Promise<LearningPathResponse> => {
    const response = (await apiClient.get('/learning-path')) as { data: unknown };
    return normalizeLearningPathResponse(response.data);
  },

  generate: async (): Promise<LearningPathResponse> => {
    const response = (await apiClient.post('/learning-path', {})) as { data: unknown };
    return normalizeLearningPathResponse(response.data);
  },

  refresh: async (): Promise<LearningPathResponse> => {
    const response = (await apiClient.post('/learning-path/refresh', {})) as { data: unknown };
    return normalizeLearningPathResponse(response.data);
  },

  completeActivity: async (activityId: string): Promise<LearningPathResponse> => {
    const payload: UpdateLearningPathActivityRequest = { status: 'completed' };
    const response = (await apiClient.patch(
      `/learning-path/activities/${activityId}`,
      payload
    )) as { data: unknown };
    return normalizeLearningPathResponse(response.data);
  },
};
