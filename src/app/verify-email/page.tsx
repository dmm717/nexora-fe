'use client';
import React, { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import styles from '@/components/features/auth/Auth.module.css';
import { authApi } from '@/services/authApi';
import { VERIFICATION_RESEND_COOLDOWN_SECONDS } from '@/constants/auth';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { AuthPageSkeleton } from '@/components/features/auth/AuthPageSkeleton';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');

  const hasParams = Boolean(userId && token);
  const [status, setStatus] = useState<'verifying' | 'success' | 'invalid'>(() =>
    hasParams ? 'verifying' : 'invalid'
  );
  const [errorMessage, setErrorMessage] = useState<string>(() =>
    hasParams ? '' : 'Liên kết xác minh thiếu thông tin cần thiết.'
  );
  const [resendEmail, setResendEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const resendInFlightRef = useRef(false);

  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!userId || !token || verificationAttempted.current) return;
    verificationAttempted.current = true;

    authApi
      .verifyEmail({ userId, token })
      .then((res) => {
        setStatus('success');
        if (res.data?.email) {
          setResendEmail(res.data.email);
        }
      })
      .catch((err: unknown) => {
        setStatus('invalid');
        const message = err instanceof Error ? err.message : 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.';
        setErrorMessage(message);
      });
  }, [userId, token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail || isResending || resendCooldown > 0 || resendInFlightRef.current) return;
    resendInFlightRef.current = true;
    setResendError(null);
    setIsResending(true);
    try {
      await authApi.resendVerification({ email: resendEmail });
      setResendCooldown(VERIFICATION_RESEND_COOLDOWN_SECONDS);
    } catch {
      setResendError('Chưa thể gửi email lúc này. Vui lòng thử lại sau.');
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
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

        {status === 'verifying' && (
          <div className={styles.noticeCard} role="status" aria-live="polite">
            <div className={styles.iconWrapper}>
              <span className={styles.loader} style={{ borderColor: 'rgba(0, 156, 166, 0.3)', borderTopColor: 'var(--color-primary)', width: 28, height: 28 }}></span>
            </div>
            <h2 className={styles.title}>Đang xác minh email...</h2>
            <p className={styles.noticeText}>Vui lòng chờ trong giây lát trong khi chúng tôi kích hoạt tài khoản của bạn.</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.noticeCard} role="status" aria-live="polite">
            <div className={`${styles.iconWrapper} ${styles.iconWrapperSuccess}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className={styles.title}>Xác minh email thành công</h2>
            <p className={styles.noticeText}>Tài khoản của bạn đã sẵn sàng. Bạn có thể đăng nhập ngay bây giờ.</p>
            <Button type="button" fullWidth onClick={() => router.push('/auth')}>Đăng nhập</Button>
          </div>
        )}

        {status === 'invalid' && (
          <div className={styles.noticeCard} role="alert">
            <div className={`${styles.iconWrapper} ${styles.iconWrapperError}`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className={styles.title}>Xác minh không thành công</h2>
            <p className={styles.noticeText}>
              {errorMessage || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.'}
            </p>

            <form onSubmit={handleResend} aria-busy={isResending} style={{ width: '100%', marginTop: '0.5rem' }}>
              <Input
                label="Email cần xác minh"
                type="email"
                placeholder="name@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                disabled={isResending}
              />
              {resendError && (
                <div className="mt-3 rounded-xl border border-error/20 bg-error-container/40 p-3 text-left text-sm text-on-error-container" role="alert">
                  {resendError}
                </div>
              )}
              <Button
                type="submit"
                isLoading={isResending}
                disabled={!resendEmail || resendCooldown > 0}
                style={{ marginTop: '0.75rem' }}
              >
                {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại email xác minh'}
              </Button>
            </form>

            <Button type="button" fullWidth variant="outline" onClick={() => router.push('/auth')}>Quay lại đăng nhập</Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton fieldCount={1} backHref="/auth" backLabel="Đăng nhập" title="Đang xác minh email..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
