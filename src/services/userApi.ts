import { apiClient } from './apiClient';

export interface BillingSummaryResponse {
  entitlement?: {
    id: string;
    planCode: string;
    startsAt: string;
    endsAt: string;
    limit: number;
    reserved: number;
    consumed: number;
    available: number;
  };
  orders: {
    id: string;
    planCode: string;
    amountMinor: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
  billing?: BillingSummaryResponse | null;
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface DeletionRequestView {
  id: string;
  status: string;
  attempts: number;
  requestedAt: string;
  completedAt: string | null;
}

export interface CoreDataExport {
  [key: string]: unknown;
}

export const userApi = {
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get('/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await apiClient.patch('/me/profile', data);
    return response.data;
  },

  exportData: async (): Promise<CoreDataExport> => {
    const response = await apiClient.get('/me/export');
    return response.data;
  },

  requestDeletion: async (): Promise<DeletionRequestView> => {
    const response = await apiClient.post('/me/deletion-requests');
    return response.data;
  }
};
