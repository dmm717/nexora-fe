import { apiClient } from './apiClient';

export interface CareerGoalResponse {
  id: string;
  targetRole: string;
  seniority: string | null;
  industry: string | null;
  targetCompany: string | null;
  targetJobDescriptionId: string | null;
  targetDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCareerGoalRequest {
  targetRole: string;
  seniority?: string | null;
  industry?: string | null;
  targetCompany?: string | null;
  targetJobDescriptionId?: string | null;
  targetDate?: string | null;
}

export interface UpdateCareerGoalRequest {
  targetRoleSpecified?: boolean;
  targetRole?: string | null;
  senioritySpecified?: boolean;
  seniority?: string | null;
  industrySpecified?: boolean;
  industry?: string | null;
  targetCompanySpecified?: boolean;
  targetCompany?: string | null;
  targetJobDescriptionIdSpecified?: boolean;
  targetJobDescriptionId?: string | null;
  targetDateSpecified?: boolean;
  targetDate?: string | null;
  activeSpecified?: boolean;
  active?: boolean | null;
}

export const careerGoalsApi = {
  create: async (data: CreateCareerGoalRequest): Promise<CareerGoalResponse> => {
    const response = (await apiClient.post('/career-goals', data)) as { data: CareerGoalResponse };
    return response.data;
  },

  list: async (): Promise<CareerGoalResponse[]> => {
    const response = (await apiClient.get('/career-goals')) as { data: CareerGoalResponse[] };
    return response.data;
  },

  get: async (id: string): Promise<CareerGoalResponse> => {
    const response = (await apiClient.get(`/career-goals/${id}`)) as { data: CareerGoalResponse };
    return response.data;
  },

  update: async (id: string, data: UpdateCareerGoalRequest): Promise<CareerGoalResponse> => {
    const response = (await apiClient.patch(`/career-goals/${id}`, data)) as { data: CareerGoalResponse };
    return response.data;
  }
};
