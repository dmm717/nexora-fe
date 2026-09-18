import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserResponse, userApi } from '@/services/userApi';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button';

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
    .max(120, 'Tên hiển thị quá dài')
    .trim(),
  yearsOfExperience: z
    .any()
    .transform((v) => {
      if (v === '' || v === null || v === undefined) return '';
      const num = Number(v);
      return isNaN(num) ? v : num;
    })
    .pipe(
      z.union([
        z.number().int('Phải là số nguyên').min(0, 'Ít nhất 0 năm').max(60, 'Tối đa 60 năm'),
        z.literal(''),
      ])
    )
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PersonalInformationCardProps {
  user: UserResponse;
  onUserUpdated: (updatedUser: UserResponse) => void;
}

export const PersonalInformationCard: React.FC<PersonalInformationCardProps> = ({
  user,
  onUserUpdated,
}) => {
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
      const requestData = {
        displayName: data.displayName,
        yearsOfExperience:
          data.yearsOfExperience === '' || data.yearsOfExperience === null
            ? null
            : Number(data.yearsOfExperience),
      };

      const updated = await userApi.updateProfile(requestData);
      onUserUpdated(updated);
      setFeedback({
        type: 'success',
        message: 'Cập nhật thông tin cá nhân thành công!',
      });
      toast.success('Đã cập nhật thông tin cá nhân');
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
        <Input
          type="number"
          label="Số năm kinh nghiệm làm việc"
          min={0}
          max={60}
          placeholder="Ví dụ: 3"
          {...register('yearsOfExperience')}
          error={errors.yearsOfExperience?.message}
        />

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
