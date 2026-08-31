import { apiClient } from './apiClient';

export interface HealthStatus {
  status: string;
  totalDuration?: string;
  entries?: Record<string, { data?: unknown; duration?: string; status: string; tags?: string[] }>;
}

export interface OperationStatus {
  status: string;
  activeJobs?: number;
  failedJobs?: number;
  lastProcessed?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const ROOT_URL = BASE_URL.replace('/api/v1', '');

export const healthApi = {
  // Liveness check (Không nằm trong /api/v1)
  getLiveness: async (): Promise<string> => {
    try {
      const response = await fetch(`${ROOT_URL}/health/live`);
      if (response.ok) {
        return await response.text();
      }
      return 'Unhealthy';
    } catch {
      return 'Offline';
    }
  },

  // Readiness check (Database & Dependencies)
  getReadiness: async (): Promise<HealthStatus> => {
    try {
      const response = await apiClient.get('/health') as HealthStatus;
      return response || { status: 'Unknown' };
    } catch {
      return { status: 'Offline' };
    }
  },

  // Operations status (Background tasks, Jobs)
  getOperations: async (): Promise<OperationStatus> => {
    try {
      const response = await apiClient.get('/health/operations') as OperationStatus;
      return response || { status: 'Unknown' };
    } catch {
      return { status: 'Offline' };
    }
  }
};
