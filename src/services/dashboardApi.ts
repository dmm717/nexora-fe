import { apiClient } from './apiClient';
import { BillingSummaryResponse } from './userApi';

export interface InterviewSummary {
  id: string;
  role: string;
  status: string;
  updatedAt: string;
}

export interface ReportSummary {
  id: string;
  interviewId: string;
  overallScore: number;
  createdAt: string;
}

export interface DashboardResponse {
  billing?: BillingSummaryResponse | null;
  interviews: InterviewSummary[];
  reports: ReportSummary[];
}

export const dashboardApi = {
  getDashboardSummary: async () => {
    // API returns { data: DashboardResponse }
    const response = await apiClient.get('/dashboard') as { data: DashboardResponse };
    return response.data;
  }
};
