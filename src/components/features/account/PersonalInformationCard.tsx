import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserResponse, userApi } from '@/services/userApi';
import { CURRENT_USER_QUERY_KEY } from '@/hooks/queries/useUser';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button';
import {
  profileSchema,
  type ProfileFormValues,
  resolveYearsOfExperience,
} from '@/schema/accountSchema';

export { profileSchema, type ProfileFormValues, resolveYearsOfExperience };

interface PersonalInformationCardProps {
  user: UserResponse;
  onUserUpdated?: (updatedUser: UserResponse) => void;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({
  user,
  onUserUpdated,
}) => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName || '',
      yearsOfExperience: user.yearsOfExperience ?? '',
    },
  });

  useEffect(() => {
    reset({
      displayName: user.displayName || '',
      yearsOfExperience: user.yearsOfExperience ?? '',
    });
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setFeedback(null);
    try {
      const resolvedYears = resolveYearsOfExperience(
        data.yearsOfExperience,
        user.yearsOfExperience
      );

      const requestData = {
        displayName: data.displayName,
        yearsOfExperience: resolvedYears,
      };

      const updated = await userApi.updateProfile(requestData);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updated);
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      if (onUserUpdated) {
        onUserUpdated(updated);
      }

      const wasClearedWithExisting =
        user.yearsOfExperience != null &&
        (data.yearsOfExperience === '' || data.yearsOfExperience === null || data.yearsOfExperience === undefined);

      setFeedback({
        type: 'success',
        message: wasClearedWithExisting
          ? 'Cập nhật thông tin thành công (số năm kinh nghiệm được giữ nguyên do hệ thống chưa hỗ trợ xóa trắng).'
          : 'Cập nhật thông tin cá nhân thành công!',
      });
      if (wasClearedWithExisting) {
        toast.info('Số năm kinh nghiệm được giữ nguyên do hệ thống chưa hỗ trợ xóa trắng');
      } else {
        toast.success('Đã cập nhật thông tin cá nhân');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi khi cập nhật thông tin cá nhân';
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
        <h2 className="text-lg font-bold text-on-surface">Thông tin cá nhân</h2>
        <p className="text-xs text-on-surface-variant mt-1">
          Cập nhật tên hiển thị và số năm kinh nghiệm để cá nhân hóa lộ trình của bạn.
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
        {/* Display Name */}
        <Input
          label="Tên hiển thị"
          placeholder="Ví dụ: Nguyễn Văn A"
          {...register('displayName')}
          error={errors.displayName?.message}
        />

        {/* Read-only Email Field */}
        <div>
          <Input
            label="Địa chỉ Email"
            value={user.email}
            readOnly
            disabled
            className="bg-surface-container-low text-on-surface-variant cursor-not-allowed opacity-90"
          />
          <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Email được định danh theo tài khoản và không thể chỉnh sửa tại đây.
          </p>
        </div>

        {/* Years of Experience */}
        <div>
          <Input
            type="number"
            label="Số năm kinh nghiệm làm việc"
            min={0}
            max={60}
            placeholder="Ví dụ: 3"
            {...register('yearsOfExperience')}
            error={errors.yearsOfExperience?.message}
          />
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Nhập từ 0 đến 60. Để trống sẽ giữ nguyên giá trị hiện có (không hỗ trợ xóa trắng sau khi đã lưu).
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isDirty}
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Card>
  );
};
export default PersonalInformationCard;
