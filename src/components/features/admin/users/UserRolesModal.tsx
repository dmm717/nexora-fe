import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminUserView } from '@/services/adminApi';
import { useAdminRoles, useUpdateUserRoles } from '@/hooks/queries/useAdminUsers';
import { getQueryPresentation } from '@/utils/queryPresentation';

const roleSchema = z.object({
  roles: z.array(z.string()).min(1, 'Người dùng phải có ít nhất 1 quyền (User)'),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự) để lưu Audit Log'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface UserRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function UserRolesModal({ isOpen, onClose, user }: UserRolesModalProps) {
  const rolesQuery = useAdminRoles();
  const updateRolesMutation = useUpdateUserRoles();
  const currentUser = isOpen ? user : null;
  const safeClose = () => {
    if (!updateRolesMutation.isPending) onClose();
  };
  const queryPresentation = getQueryPresentation({
    hasData: rolesQuery.data !== undefined,
    isLoading: rolesQuery.isLoading,
    isError: rolesQuery.isError,
    isFetching: rolesQuery.isFetching,
  });

  const saveRoles = (formValues: RoleFormValues) => {
    if (!currentUser) return;
    updateRolesMutation.mutate({
      userId: currentUser.id,
      data: { roles: formValues.roles, reason: formValues.reason },
    }, { onSuccess: safeClose });
  };

  return (
    <Modal
      isOpen={Boolean(currentUser)}
      onClose={safeClose}
      title="Cập nhật quyền"
      description="Thay đổi quyền truy cập của người dùng và ghi lại lý do."
      size="md"
    >
      {currentUser && (
        <RolesForm
          key={currentUser.id}
          user={currentUser}
          roles={rolesQuery.data}
          isPending={updateRolesMutation.isPending}
          queryPresentation={queryPresentation}
          onRetry={() => { void rolesQuery.refetch(); }}
          onSubmit={saveRoles}
          onCancel={safeClose}
        />
      )}
    </Modal>
  );
}

interface RolesFormProps {
  user: AdminUserView;
  roles: { id: string; name: string; normalizedName: string }[] | undefined;
  isPending: boolean;
  queryPresentation: ReturnType<typeof getQueryPresentation>;
  onRetry: () => void;
  onSubmit: (values: RoleFormValues) => void;
  onCancel: () => void;
}

function RolesForm({ user, roles, isPending, queryPresentation, onRetry, onSubmit, onCancel }: RolesFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { roles: user.roles || [], reason: '' },
  });
  const canChooseRole = roles !== undefined && roles.length > 0;
  const cannotSubmit = isPending || !canChooseRole;

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={isPending} className="space-y-5">
      <p className="text-sm text-on-surface-variant">
        Đang thao tác trên <strong className="font-semibold text-on-surface">{user.email}</strong>
      </p>

      {queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="error" onRetry={onRetry} />
      )}
      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="refreshing" />
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-2">
        <legend className="mb-2 text-sm font-semibold text-on-surface">Chọn quyền</legend>
        {queryPresentation.showInitialLoading && (
          <div role="status" aria-label="Đang tải quyền hệ thống" className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        )}
        {queryPresentation.showBlockingError && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant">Không thể tải danh sách quyền hệ thống.</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
          </div>
        )}
        {roles?.length === 0 && (
          <Alert variant="info">Chưa có quyền hệ thống khả dụng để chỉnh sửa.</Alert>
        )}
        {canChooseRole && (
          <div className="space-y-2 rounded-xl border border-outline-variant/60 bg-surface-container-low p-4">
            {roles.map((role) => (
              <label key={role.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-on-surface hover:bg-white">
                <input
                  type="checkbox"
                  value={role.name}
                  {...register('roles')}
                  className="h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
                <span>{role.name}</span>
              </label>
            ))}
          </div>
        )}
        {errors.roles && <p role="alert" className="text-xs font-medium text-error">{errors.roles.message}</p>}
      </fieldset>

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <Input
          label="Lý do thay đổi (Bắt buộc)"
          {...register('reason')}
          error={errors.reason?.message}
          placeholder="VD: Chuyển công tác, thăng cấp..."
        />
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button type="submit" disabled={cannotSubmit} loading={isPending}>Lưu quyền</Button>
        </div>
      </fieldset>
    </form>
  );
}
