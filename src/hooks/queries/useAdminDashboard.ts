import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type AdminDashboardFilters, type AdminTransactionFilters } from '@/services/adminApi';

export const adminDashboardKeys = {
  dashboard: (filters: AdminDashboardFilters) => ['adminDashboard', filters] as const,
  transactions: (filters: AdminTransactionFilters) => ['adminTransactions', filters] as const,
};

export function useAdminDashboard(filters: AdminDashboardFilters) {
  return useQuery({
    queryKey: adminDashboardKeys.dashboard(filters),
    queryFn: () => adminApi.getDashboard(filters),
  });
}

export function useAdminTransactions(filters: AdminTransactionFilters) {
  return useQuery({
    queryKey: adminDashboardKeys.transactions(filters),
    queryFn: () => adminApi.getTransactions(filters),
    placeholderData: keepPreviousData,
  });
}
