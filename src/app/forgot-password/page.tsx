'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import styles from '@/components/features/auth/Auth.module.css';
import { authApi } from '@/services/authApi';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schema/authSchema';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setSubmitError(null);
    try {
      await authApi.forgotPassword({ email: data.email });
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch {
      setSubmitError('Chưa thể gửi hướng dẫn lúc này. Vui lòng thử lại sau.');
    }
  };

  return (
    <main className={styles.container}>
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

        {isSubmitted ? (
          <div className={styles.noticeCard} role="status" aria-live="polite">
            <div className={`${styles.iconWrapper} ${styles.iconWrapperSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className={styles.title}>Kiểm tra email của bạn</h2>
            <p className={styles.noticeText}>
              Nếu email <span className={styles.noticeEmail}>{submittedEmail}</span> thuộc một tài khoản hợp lệ, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến địa chỉ này.
            </p>
            <p className={styles.helperText} style={{ textAlign: 'center', marginTop: 0 }}>
              Vui lòng kiểm tra cả hòm thư Spam hoặc Thư rác nếu không tìm thấy trong Hộp thư đến.
            </p>
            <Button type="button" fullWidth onClick={() => router.push('/auth')}>Quay lại đăng nhập</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
            <h2 className={styles.title}>Quên mật khẩu</h2>
            <p className={styles.subtitle}>
              Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
            </p>

            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            {submitError && (
              <div className="mt-4 rounded-xl border border-error/20 bg-error-container/40 p-3 text-sm text-on-error-container" role="alert">
                {submitError}
              </div>
            )}

            <Button type="submit" isLoading={isSubmitting} style={{ marginTop: '1rem' }}>
              Gửi liên kết đặt lại mật khẩu
            </Button>

            <div className={styles.registerWrap}>
              <Link href="/auth" className={styles.registerLink} style={{ marginLeft: 0 }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
