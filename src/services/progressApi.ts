import { apiClient } from './apiClient';

export interface ProgressResponse {
  completedInterviews: number;
  recentInterviewScores: number[];
  averageInterviewScore: number;
  starAverages: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  completedScenarios: number;
  averageScenarioScore: number;
  completedStarAttempts: number;
  recentActivity: Array<{
    type: string;
    resourceId: string;
    timestamp: string;
  }>;
}

export const progressApi = {
  getProgressAnalytics: async () => {
    const response = await apiClient.get('/progress') as { data: ProgressResponse };
    return response.data;
  }
};
