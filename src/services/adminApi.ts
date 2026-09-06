import { apiClient } from './apiClient';

export interface AdminDashboardResponse {
  totalUsers: number;
  activeUsers: number;
  totalInterviews: number;
  revenue: number;
  quotaUsage: Record<string, number>;
}

// --- Types ---
export interface AdminPlanView { id: string; code: string; name: string; [key: string]: unknown; }
export interface AdminScenarioCategoryView { id: string; name: string; [key: string]: unknown; }
export interface AdminScenarioView { id: string; title: string; [key: string]: unknown; }
export interface AdminUserView { id: string; email: string; [key: string]: unknown; }

export const adminApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard') as { data: AdminDashboardResponse };
    return response.data;
  },

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
    const response = await apiClient.get('/admin/users') as { data: AdminUserView[] };
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
  }
};
