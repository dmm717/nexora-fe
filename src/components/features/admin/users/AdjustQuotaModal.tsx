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
import { useAdjustFeature } from '@/hooks/queries/useAdminUsers';
import { useAdminFeatureDefinitions } from '@/hooks/queries/useAdminPlans';
import { getQueryPresentation } from '@/utils/queryPresentation';

const adjustSchema = z.object({
  featureCode: z.string().min(1, 'Vui lòng chọn một tính năng'),
  quantity: z.coerce.number().refine((value) => value !== 0, 'Số lượng không được bằng 0'),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type AdjustFormValues = z.output<typeof adjustSchema>;
type FeatureDefinition = { id: string; code: string; name: string; description: string; isActive: boolean; sortOrder: number };

interface AdjustQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function AdjustQuotaModal({ isOpen, onClose, user }: AdjustQuotaModalProps) {
  const featuresQuery = useAdminFeatureDefinitions();
  const adjustMutation = useAdjustFeature();
  const currentUser = isOpen ? user : null;
  const queryPresentation = getQueryPresentation({
    hasData: featuresQuery.data !== undefined,
    isLoading: featuresQuery.isLoading,
    isError: featuresQuery.isError,
    isFetching: featuresQuery.isFetching,
  });
  const features = featuresQuery.data as FeatureDefinition[] | undefined;

  const safeClose = () => {
    if (!adjustMutation.isPending) onClose();
  };
  const saveAdjustment = (formValues: AdjustFormValues) => {
    if (!currentUser) return;
    adjustMutation.mutate({
      userId: currentUser.id,
      data: {
        featureCode: formValues.featureCode,
        quantity: formValues.quantity,
        reason: formValues.reason,
      },
    }, { onSuccess: safeClose });
  };

  return (
    <Modal
      isOpen={Boolean(currentUser)}
      onClose={safeClose}
      title="Điều chỉnh hạn mức"
      description="Tăng hoặc thu hồi hạn mức và ghi lại lý do điều chỉnh."
      size="md"
    >
      {currentUser && (
        <AdjustForm
          key={currentUser.id}
          user={currentUser}
          features={features}
          isPending={adjustMutation.isPending}
          queryPresentation={queryPresentation}
          onRetry={() => { void featuresQuery.refetch(); }}
          onSubmit={saveAdjustment}
          onCancel={safeClose}
        />
      )}
    </Modal>
  );
}

interface AdjustFormProps {
  user: AdminUserView;
  features: FeatureDefinition[] | undefined;
  isPending: boolean;
  queryPresentation: ReturnType<typeof getQueryPresentation>;
  onRetry: () => void;
  onSubmit: (values: AdjustFormValues) => void;
  onCancel: () => void;
}

function AdjustForm({ user, features, isPending, queryPresentation, onRetry, onSubmit, onCancel }: AdjustFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<
    z.input<typeof adjustSchema>,
    unknown,
    AdjustFormValues
  >({
    resolver: zodResolver(adjustSchema),
    defaultValues: { featureCode: '', quantity: 1, reason: '' },
  });
  const hasFeatures = Boolean(features?.length);

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={isPending} className="space-y-5">
      <Alert variant="warning">
        Điều chỉnh số dư của <strong>{user.email}</strong>. Có thể nhập số âm để thu hồi; số dư không thể thấp hơn 0.
      </Alert>

      {queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="error" onRetry={onRetry} />
      )}
      {queryPresentation.showRefreshing && !queryPresentation.showBackgroundError && (
        <AdminAsyncNotice kind="refreshing" />
      )}
      {queryPresentation.showInitialLoading && (
        <div role="status" aria-label="Đang tải tính năng" className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      {queryPresentation.showBlockingError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">Không thể tải danh sách tính năng.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
        </div>
      )}
      {features?.length === 0 && (
        <Alert variant="info">Chưa có tính năng khả dụng để điều chỉnh.</Alert>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <Select
          label="Chọn tính năng"
          {...register('featureCode')}
          error={errors.featureCode?.message}
          disabled={isPending || !hasFeatures}
        >
          <option value="">-- Chọn tính năng --</option>
          {features?.map((feature) => (
            <option key={feature.code} value={feature.code}>{feature.name} ({feature.code})</option>
          ))}
        </Select>

        <Input
          label="Số lượng (nhập số âm để thu hồi)"
          type="number"
          {...register('quantity')}
          error={errors.quantity?.message}
        />

        <Input
          label="Lý do điều chỉnh (Bắt buộc)"
          {...register('reason')}
          error={errors.reason?.message}
          placeholder="VD: Khuyến mãi sự kiện, thu hồi do lỗi hệ thống..."
        />

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button type="submit" variant="primary" loading={isPending} disabled={!hasFeatures}>
            Xác nhận điều chỉnh
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
