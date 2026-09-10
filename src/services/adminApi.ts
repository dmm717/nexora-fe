import { apiClient } from './apiClient';

// --- Types ---
export interface AdminPlanFeatureView {
  featureDefinitionId: string;
  code: string;
  name: string;
  enabled: boolean;
  limit?: number;
  unlimited: boolean;
}

export interface AdminPlanPriceView {
  id: string;
  amountMinor: number;
  currency: string;
  durationDays?: number;
  interviewQuota?: number;
  isActive: boolean;
  features: AdminPlanFeatureView[];
}

export interface AdminPlanView {
  id: string;
  code: string;
  name: string;
  description: string;
  badge?: string;
  isHighlighted: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  prices: AdminPlanPriceView[];
}

export interface AdminScenarioCategoryView { 
  id: string; 
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AdminScenarioView {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryId: string;
  difficulty: string;
  competency: string;
  estimatedMinutes: number;
  content: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export interface AdminUserView {
  id: string;
  email: string;
  displayName?: string;
  roles: string[];
  active: boolean;
  createdAt: string;
  currentPlanCode?: string;
  entitlementStatus?: string;
  entitlementStartsAt?: string;
  entitlementEndsAt?: string;
}

export interface AdminUserPageResponse {
  lastId?: string;
  users: AdminUserView[];
}

export interface AdminRoleView { name: string; }

export const adminApi = {

  // --- Plans Management ---
  getPlans: async () => {
    const response = await apiClient.get('/admin/plans') as { data: AdminPlanView[] };
    return response.data;
  },
  createPlan: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/admin/plans', data) as { data: AdminPlanView };
    return response.data;
  },
  getPlanDetails: async (id: string) => {
    const response = await apiClient.get(`/admin/plans/${id}`) as { data: AdminPlanView };
    return response.data;
  },
  updatePlan: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/admin/plans/${id}`, data) as { data: AdminPlanView };
    return response.data;
  },
  createPlanPrice: async (planId: string, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/admin/plans/${planId}/prices`, data) as { data: unknown };
    return response.data;
  },
  updatePlanPrice: async (priceId: string, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/admin/plan-prices/${priceId}`, data) as { data: unknown };
    return response.data;
  },
  updatePlanFeatures: async (priceId: string, data: Record<string, unknown>) => {
    const response = await apiClient.put(`/admin/plan-prices/${priceId}/features`, data) as { data: unknown };
    return response.data;
  },
  getFeatureDefinitions: async () => {
    const response = await apiClient.get('/admin/feature-definitions') as { data: unknown[] };
    return response.data;
  },

  // --- Scenarios Management ---
  getScenarioCategories: async () => {
    const response = await apiClient.get('/admin/scenario-categories') as { data: AdminScenarioCategoryView[] };
    return response.data;
  },
  createScenarioCategory: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/admin/scenario-categories', data) as { data: AdminScenarioCategoryView };
    return response.data;
  },
  updateScenarioCategory: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/admin/scenario-categories/${id}`, data) as { data: AdminScenarioCategoryView };
    return response.data;
  },
  getScenarios: async () => {
    const response = await apiClient.get('/admin/scenarios') as { data: AdminScenarioView[] };
    return response.data;
  },
  createScenario: async (data: Record<string, unknown>) => {
    const response = await apiClient.post('/admin/scenarios', data) as { data: AdminScenarioView };
    return response.data;
  },
  getScenarioDetails: async (id: string) => {
    const response = await apiClient.get(`/admin/scenarios/${id}`) as { data: AdminScenarioView };
    return response.data;
  },
  updateScenario: async (id: string, data: Record<string, unknown>) => {
    const response = await apiClient.patch(`/admin/scenarios/${id}`, data) as { data: AdminScenarioView };
    return response.data;
  },
  publishScenario: async (id: string) => {
    const response = await apiClient.post(`/admin/scenarios/${id}/publish`) as { data: AdminScenarioView };
    return response.data;
  },
  archiveScenario: async (id: string) => {
    const response = await apiClient.post(`/admin/scenarios/${id}/archive`) as { data: AdminScenarioView };
    return response.data;
  },

  // --- Users Management ---
  getUsers: async () => {
    const response = await apiClient.get('/admin/users') as { data: AdminUserPageResponse };
    return response.data;
  },
  getUserDetails: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`) as { data: AdminUserView };
    return response.data;
  },
  grantPlan: async (userId: string, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/admin/users/${userId}/plan-grants`, data) as { data: unknown };
    return response.data;
  },
  adjustFeatures: async (userId: string, data: Record<string, unknown>) => {
    const response = await apiClient.post(`/admin/users/${userId}/feature-adjustments`, data) as { data: unknown };
    return response.data;
  },
  updateUserRoles: async (userId: string, roles: string[]) => {
    const response = await apiClient.put(`/admin/users/${userId}/roles`, { roles }) as { data: AdminUserView };
    return response.data;
  },
  updateUserStatus: async (userId: string, status: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status }) as { data: AdminUserView };
    return response.data;
  },

  // --- Roles Management ---
  getRoles: async () => {
    const response = await apiClient.get('/admin/roles') as { data: AdminRoleView[] };
    return response.data;
  }
};
