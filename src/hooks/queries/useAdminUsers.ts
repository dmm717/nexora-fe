import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { toast } from 'sonner';

export const adminUserKeys = {
  all: ['adminUsers'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (cursor?: string) => [...adminUserKeys.lists(), { cursor }] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
  roles: ['adminRoles'] as const,
};

// --- Users List & Detail ---
export function useAdminUsers(cursor?: string) {
  return useQuery({
    queryKey: adminUserKeys.list(cursor),
    queryFn: () => adminApi.getUsers(cursor),
    staleTime: 30000, // Keep data fresh enough for back/forward navigation
  });
}

export function useAdminUserDetail(userId: string | null) {
  return useQuery({
    queryKey: adminUserKeys.detail(userId!),
    queryFn: () => adminApi.getUserDetails(userId!),
    enabled: !!userId,
  });
}

// --- Roles Management ---
export function useAdminRoles() {
  return useQuery({
    queryKey: adminUserKeys.roles,
    queryFn: adminApi.getRoles,
    staleTime: Infinity, // System roles rarely change
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { roles: string[]; reason: string } }) => 
      adminApi.updateUserRoles(userId, data),
    onSuccess: (data, variables) => {
      toast.success('Đã cập nhật quyền thành công!');
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(variables.userId) });
    },
    onError: () => toast.error('Lỗi khi cập nhật quyền.'),
  });
}

// --- Status Management ---
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { active: boolean; reason: string } }) => 
      adminApi.updateUserStatus(userId, data),
    onSuccess: (data, variables) => {
      toast.success(variables.data.active ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản thành công!');
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(variables.userId) });
    },
    onError: () => toast.error('Lỗi khi cập nhật trạng thái.'),
  });
}

// --- Plan & Quota ---
export function useGrantPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      // Generate Idempotency-Key
      const idempotencyKey = crypto.randomUUID();
      return adminApi.grantPlan(userId, idempotencyKey, data);
    },
    onSuccess: (_, variables) => {
      toast.success('Đã cấp gói cước thành công!');
      queryClient.invalidateQueries({ queryKey: adminUserKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(variables.userId) });
    },
    onError: () => toast.error('Lỗi khi cấp gói cước.'),
  });
}

export function useAdjustFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) => {
      // Generate Idempotency-Key
      const idempotencyKey = crypto.randomUUID();
      return adminApi.adjustFeatures(userId, idempotencyKey, data);
    },
    onSuccess: (_, variables) => {
      toast.success('Đã điều chỉnh tính năng thành công!');
      queryClient.invalidateQueries({ queryKey: adminUserKeys.detail(variables.userId) });
    },
    onError: (error: unknown) => {
      // BE may return error if adjust below 0
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const msg = err.response?.data?.error?.message || 'Lỗi khi điều chỉnh tính năng.';
      toast.error(msg);
    },
  });
}
