import { apiClient } from './apiClient';
import type {
  CareerGoalResponse,
  CreateCareerGoalRequest,
  UpdateCareerGoalRequest,
} from './careerGoalContract';

export type {
  CareerGoalResponse,
  CreateCareerGoalRequest,
  UpdateCareerGoalRequest,
  CareerGoalFormValues,
} from './careerGoalContract';

export {
  buildCreateCareerGoalRequest,
  buildUpdateCareerGoalRequest,
} from './careerGoalContract';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeCareerGoal = (raw: unknown): CareerGoalResponse => {
  const record = isRecord(raw) ? raw : {};
  const asString = (v: unknown) => (typeof v === 'string' ? v : '');
  const asNullableString = (v: unknown) => (typeof v === 'string' ? v : null);
  return {
    id: asString(record.id),
    targetRole: asString(record.targetRole),
    seniority: asString(record.seniority),
    industry: asNullableString(record.industry),
    targetCompany: asNullableString(record.targetCompany),
    targetJobDescriptionId: asNullableString(record.targetJobDescriptionId),
    targetDate: asNullableString(record.targetDate),
    active: record.active === true,
    createdAt: asString(record.createdAt),
    updatedAt: asString(record.updatedAt),
  };
};

export const careerGoalsApi = {
  create: async (data: CreateCareerGoalRequest): Promise<CareerGoalResponse> => {
    const response = (await apiClient.post('/career-goals', data)) as { data: unknown };
    return normalizeCareerGoal(response.data);
  },

  list: async (): Promise<CareerGoalResponse[]> => {
    const response = (await apiClient.get('/career-goals')) as { data: unknown };
    return Array.isArray(response.data) ? response.data.map(normalizeCareerGoal) : [];
  },

  get: async (id: string): Promise<CareerGoalResponse> => {
    const response = (await apiClient.get(`/career-goals/${id}`)) as { data: unknown };
    return normalizeCareerGoal(response.data);
  },

  update: async (id: string, data: UpdateCareerGoalRequest): Promise<CareerGoalResponse> => {
    const response = (await apiClient.patch(`/career-goals/${id}`, data)) as { data: unknown };
    return normalizeCareerGoal(response.data);
  },
};
