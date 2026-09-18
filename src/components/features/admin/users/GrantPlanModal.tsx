import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { AdminAsyncNotice } from '@/components/features/admin/AdminAsyncNotice';
import { AdminUserView } from '@/services/adminApi';
import { useGrantPlan } from '@/hooks/queries/useAdminUsers';
import { useAdminPlans } from '@/hooks/queries/useAdminPlans';
import { getQueryPresentation } from '@/utils/queryPresentation';

const grantSchema = z.object({
  planPriceId: z.string().min(1, 'Vui lòng chọn một Gói cước (Price)'),
  replaceCurrent: z.boolean(),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type GrantFormValues = z.infer<typeof grantSchema>;

interface GrantPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function GrantPlanModal({ isOpen, onClose, user }: GrantPlanModalProps) {
  const plansQuery = useAdminPlans();
  const grantMutation = useGrantPlan();
  const currentUser = isOpen ? user : null;
  const queryPresentation = getQueryPresentation({
    hasData: plansQuery.data !== undefined,
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    isFetching: plansQuery.isFetching,
  });
  const activePrices = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    (plansQuery.data ?? []).filter((plan) => plan.isActive).forEach((plan) => {
      plan.prices?.filter((price) => price.isActive).forEach((price) => {
        list.push({
          id: price.id,
          label: `[${plan.name}] - ${price.durationDays ? `${price.durationDays} ngày` : 'Vĩnh viễn'} - ${price.amountMinor.toLocaleString('vi-VN')} ${price.currency}`,
        });
      });
    });
    return list;
  }, [plansQuery.data]);

  const safeClose = () => {
    if (!grantMutation.isPending) onClose();
  };
  const saveGrant = (formValues: GrantFormValues) => {
    if (!currentUser) return;
    grantMutation.mutate({
      userId: currentUser.id,
      data: {
        planPriceId: formValues.planPriceId,
        replaceCurrent: formValues.replaceCurrent,
        reason: formValues.reason,
      },
    }, { onSuccess: safeClose });
  };

  return (
    <Modal
      isOpen={Boolean(currentUser)}
      onClose={safeClose}
      title="Cấp phát gói cước"
      description="Cấp gói trực tiếp cho người dùng; hành động sẽ tạo entitlement ngay lập tức."
      size="md"
    >
      {currentUser && (
        <GrantForm
          key={currentUser.id}
          user={currentUser}
          activePrices={activePrices}
          plansLoaded={plansQuery.data !== undefined}
          plansEmpty={plansQuery.data?.length === 0}
          isPending={grantMutation.isPending}
          queryPresentation={queryPresentation}
          onRetry={() => { void plansQuery.refetch(); }}
          onSubmit={saveGrant}
          onCancel={safeClose}
        />
      )}
    </Modal>
  );
}

interface GrantFormProps {
  user: AdminUserView;
  activePrices: { id: string; label: string }[];
  plansLoaded: boolean;
  plansEmpty: boolean;
  isPending: boolean;
  queryPresentation: ReturnType<typeof getQueryPresentation>;
  onRetry: () => void;
  onSubmit: (values: GrantFormValues) => void;
  onCancel: () => void;
}

function GrantForm({
  user,
  activePrices,
  plansLoaded,
  plansEmpty,
  isPending,
  queryPresentation,
  onRetry,
  onSubmit,
  onCancel,
}: GrantFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { planPriceId: '', replaceCurrent: true, reason: '' },
  });
  const hasAvailablePrice = activePrices.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={isPending} className="space-y-5">
      <Alert variant="info">
        Bạn đang cấp gói trực tiếp cho <strong>{user.email}</strong>. Gói được chọn sẽ tạo một entitlement theo cấu hình hiện tại.
      </Alert>

      {queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="error" onRetry={onRetry} />
      )}
      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="refreshing" />
      )}
      {queryPresentation.showInitialLoading && (
        <div role="status" aria-label="Đang tải gói cước" className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {queryPresentation.showBlockingError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">Không thể tải các gói cước khả dụng.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
        </div>
      )}
      {plansLoaded && !hasAvailablePrice && (
        <Alert variant="info">
          {plansEmpty
            ? 'Chưa có gói cước để cấp.'
            : 'Chưa có mức giá đang hoạt động để cấp gói.'}
        </Alert>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <Select
          label="Chọn gói cước khả dụng"
          {...register('planPriceId')}
          error={errors.planPriceId?.message}
          disabled={isPending || !hasAvailablePrice}
        >
          <option value="">-- Chọn gói --</option>
          {activePrices.map((price) => (
            <option key={price.id} value={price.id}>{price.label}</option>
          ))}
        </Select>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-on-surface">
          <input
            type="checkbox"
            {...register('replaceCurrent')}
            className="mt-0.5 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          <span>Thay thế gói cước hiện tại (bỏ chọn để cộng dồn thời hạn nếu gói hỗ trợ).</span>
        </label>

        <Input
          label="Lý do cấp (Bắt buộc)"
          {...register('reason')}
          error={errors.reason?.message}
          placeholder="VD: Khách hàng mua qua chuyển khoản tay, đền bù sự cố..."
        />

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button type="submit" loading={isPending} disabled={!hasAvailablePrice}>Cấp gói cước</Button>
        </div>
      </fieldset>
    </form>
  );
}
