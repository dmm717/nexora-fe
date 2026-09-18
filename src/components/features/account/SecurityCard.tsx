import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { userApi } from '@/services/userApi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button';
import { passwordSchema, type PasswordFormValues } from '@/schema/accountSchema';

export { passwordSchema, type PasswordFormValues };

export const SecurityCard: React.FC = () => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setFeedback(null);
    try {
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setFeedback({
        type: 'success',
        message: 'Đổi mật khẩu thành công!',
      });
      toast.success('Đã cập nhật mật khẩu mới thành công');
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu';
      setFeedback({
        type: 'error',
        message,
      });
      toast.error(message);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-on-surface">Bảo mật mật khẩu</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Đổi mật khẩu định kỳ để bảo vệ tài khoản. Mật khẩu mới yêu cầu tối thiểu 8 ký tự.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-error-container/30 text-error border border-error/20'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          type="password"
          label="Mật khẩu hiện tại"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
        />

        <Input
          type="password"
          label="Mật khẩu mới"
          placeholder="Tối thiểu 8 ký tự"
          autoComplete="new-password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
        />

        <Input
          type="password"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  );
};
export default SecurityCard;
