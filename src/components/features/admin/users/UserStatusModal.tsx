import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Modal } from '@/components/ui/Modal';
import { AdminUserView } from '@/services/adminApi';
import { useUpdateUserStatus } from '@/hooks/queries/useAdminUsers';

const statusSchema = z.object({
  active: z.boolean(),
  reason: z.string().min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự)'),
});

type StatusFormValues = z.infer<typeof statusSchema>;

interface UserStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserView | null;
}

export function UserStatusModal({ isOpen, onClose, user }: UserStatusModalProps) {
  const updateStatusMutation = useUpdateUserStatus();
  const currentUser = isOpen ? user : null;
  const safeClose = () => {
    if (!updateStatusMutation.isPending) onClose();
  };

  const saveStatus = (formValues: StatusFormValues) => {
    if (!currentUser) return;
    updateStatusMutation.mutate({
      userId: currentUser.id,
      data: { active: formValues.active, reason: formValues.reason },
    }, { onSuccess: safeClose });
  };

  return (
    <Modal
      isOpen={Boolean(currentUser)}
      onClose={safeClose}
      title="Thay đổi trạng thái"
      description="Khóa hoặc mở khóa tài khoản và ghi lại lý do thay đổi."
      size="md"
    >
      {currentUser && (
        <StatusForm
          key={currentUser.id}
          user={currentUser}
          isPending={updateStatusMutation.isPending}
          onSubmit={saveStatus}
          onCancel={safeClose}
        />
      )}
    </Modal>
  );
}

interface StatusFormProps {
  user: AdminUserView;
  isPending: boolean;
  onSubmit: (values: StatusFormValues) => void;
  onCancel: () => void;
}

function StatusForm({ user, isPending, onSubmit, onCancel }: StatusFormProps) {
  const { register, handleSubmit, formState: { errors }, control } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { active: user.active, reason: '' },
  });
  const isActive = useWatch({ control, name: 'active' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-busy={isPending} className="space-y-5">
      <p className="text-sm text-on-surface-variant">
        Người dùng <strong className="font-semibold text-on-surface">{user.email}</strong>
      </p>

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm font-medium ${isActive ? 'border-primary/20 bg-primary-fixed/40 text-on-surface' : 'border-error/20 bg-error-container/40 text-on-surface'}`}>
          <input
            type="checkbox"
            {...register('active')}
            className="mt-0.5 h-4 w-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
          <span>
            {isActive
              ? 'Tài khoản đang hoạt động (bỏ chọn để khóa)'
              : 'Tài khoản đang bị khóa (chọn để mở lại)'}
          </span>
        </label>

        <Input
          label="Lý do thay đổi (Bắt buộc)"
          {...register('reason')}
          error={errors.reason?.message}
          placeholder="VD: Vi phạm chính sách, mở lại theo yêu cầu..."
        />

        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button type="submit" variant={isActive ? 'primary' : 'danger'} loading={isPending}>
            {isActive ? 'Xác nhận mở khóa' : 'Xác nhận khóa tài khoản'}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
