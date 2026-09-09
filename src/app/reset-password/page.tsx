'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import styles from '@/components/features/auth/Auth.module.css';
import { authApi } from '@/services/authApi';
import { resetPasswordSchema, ResetPasswordFormData } from '@/schema/authSchema';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(!userId || !token);
  const [tokenErrorMessage, setTokenErrorMessage] = useState(
    !userId || !token ? 'Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu thông tin.' : ''
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!userId || !token) {
      setIsTokenInvalid(true);
      return;
    }

    try {
      await authApi.resetPassword({
        userId,
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      toast.success('Mật khẩu đã được đặt lại thành công.');
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      if (apiErr?.code === 'PASSWORD_RESET_INVALID' || apiErr?.message?.includes('hết hạn') || apiErr?.message?.includes('không hợp lệ')) {
        setIsTokenInvalid(true);
        setTokenErrorMessage('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      } else {
        const message = err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
        toast.error(message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/auth" className={styles.backButton}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Đăng nhập
      </Link>

      <div className={styles.glassCard}>
        <div className={styles.brandLogo}>
          <Image src="/logo.png" alt="Nexora" width={160} height={40} style={{ width: 'auto', height: '40px' }} priority />
        </div>

        {isSuccess ? (
          <div className={styles.noticeCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.title}>Mật khẩu đã được đặt lại</h2>
            <p className={styles.noticeText}>
              Mật khẩu mới của bạn đã được cập nhật thành công. Vui lòng đăng nhập lại để tiếp tục.
            </p>
            <Link href="/auth" style={{ width: '100%' }}>
              <Button type="button">Đăng nhập ngay</Button>
            </Link>
          </div>
        ) : isTokenInvalid ? (
          <div className={styles.noticeCard}>
            <div className={`${styles.iconWrapper} ${styles.iconWrapperError}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className={styles.title}>Liên kết không hợp lệ</h2>
            <p className={styles.noticeText}>
              {tokenErrorMessage || 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'}
            </p>
            <Link href="/forgot-password" style={{ width: '100%' }}>
              <Button type="button">Yêu cầu liên kết mới</Button>
            </Link>
            <Link href="/auth" style={{ width: '100%' }}>
              <button type="button" className={styles.secondaryButton}>
                Quay lại đăng nhập
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <h2 className={styles.title}>Đặt lại mật khẩu</h2>
            <p className={styles.subtitle}>
              Nhập mật khẩu mới an toàn cho tài khoản của bạn.
            </p>

            <Input
              label="Mật khẩu mới"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              error={errors.password?.message}
              disabled={isSubmitting}
            />

            <Input
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={(errors as FieldErrors<ResetPasswordFormData>).confirmPassword?.message}
              disabled={isSubmitting}
            />

            <p className={styles.helperText}>
              Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>

            <Button type="submit" isLoading={isSubmitting} style={{ marginTop: '0.5rem' }}>
              Đặt lại mật khẩu
            </Button>

            <div className={styles.registerWrap}>
              <Link href="/auth" className={styles.registerLink} style={{ marginLeft: 0 }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.glassCard}>
            <div className={styles.noticeCard}>
              <h2 className={styles.title}>Đang tải...</h2>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
