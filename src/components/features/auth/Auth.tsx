'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { toast } from 'sonner';

import styles from './Auth.module.css';
import { authApi } from '@/services/authApi';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from '@/schema/authSchema';
import { Input } from '../../ui/Input/Input';
import { Button } from '../../ui/Button/Button';
import {
  resolveSafeReturnUrl,
  resolveCheckoutDestination,
  peekAuthIntent,
  consumeAuthIntent,
  isValidInternalPath,
} from '@/utils/authIntent';

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isLogin = mode !== 'register';
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [serverError, setServerError] = useState<{
    mode: 'login' | 'register';
    message: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const formWrapperRef = useRef<HTMLFormElement>(null);

  const schema = isLogin ? loginSchema : registerSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
  });

  useEffect(() => {
    reset();
  }, [mode, reset]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const navigateToMode = (nextIsLogin: boolean) => {
    setUnverifiedEmail(null);
    setRegisteredEmail(null);
    setServerError(null);

    const currentParams = new URLSearchParams(searchParams.toString());
    if (nextIsLogin) {
      currentParams.delete('mode');
    } else {
      currentParams.set('mode', 'register');
    }
    const nextUrl = currentParams.toString() ? `/auth?${currentParams.toString()}` : '/auth';
    router.push(nextUrl, { scroll: false });
  };

  const toggleMode = () => navigateToMode(!isLogin);

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.2,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          }
        );
      }
    },
    { scope: containerRef }
  );

  const handleResend = async (email: string) => {
    if (!email || isResending || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await authApi.resendVerification({ email });
      toast.success('Nếu tài khoản cần xác minh, email hướng dẫn đã được gửi.');
      setResendCooldown(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể gửi lại email xác minh.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    setServerError(null);
    const submittedMode = isLogin ? 'login' : 'register';
    try {
      if (isLogin) {
        const loginData = data as LoginFormData;
        await authApi.login({
          email: loginData.email,
          password: loginData.password,
        });
        toast.success('Đăng nhập thành công');

        // Priority 1: Check explicit search parameters from current URL
        const rawReturnTo = searchParams.get('returnTo');
        const planPriceId = searchParams.get('planPriceId');
        const intentAction = searchParams.get('intentAction');

        let destination = '/overview';

        if (intentAction === 'checkout') {
          destination = resolveCheckoutDestination(planPriceId, rawReturnTo)
            ?? resolveSafeReturnUrl(rawReturnTo, '/overview');
          // Explicit URL intent wins, but do not leave an older session intent behind.
          consumeAuthIntent();
        } else if (rawReturnTo && isValidInternalPath(rawReturnTo)) {
          destination = resolveSafeReturnUrl(rawReturnTo, '/overview');

          // Retain legacy canonicalization for billing/pricing return targets
          // that predate the explicit intentAction query parameter.
          if (planPriceId && (destination.startsWith('/billing') || destination.startsWith('/pricing'))) {
            destination = resolveCheckoutDestination(planPriceId, rawReturnTo) ?? destination;
          }

          // Consume any stale session intent so it doesn't linger.
          consumeAuthIntent();
        } else {
          // Priority 2: Recover from stored session intent (e.g. register -> verify/login flow)
          const storedIntent = peekAuthIntent();
          if (storedIntent && isValidInternalPath(storedIntent.targetUrl)) {
            if (storedIntent.action === 'checkout') {
              destination = resolveCheckoutDestination(storedIntent.planPriceId, storedIntent.targetUrl)
                ?? '/overview';
            } else {
              destination = resolveSafeReturnUrl(storedIntent.targetUrl, '/overview');
            }
          }
          // Keep stale intent available until its post-login destination is resolved.
          consumeAuthIntent();
        }

        router.push(destination);
      } else {
        const registerData = data as RegisterFormData;
        await authApi.register({
          displayName: registerData.name,
          email: registerData.email,
          password: registerData.password,
        });
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email.');
        setRegisteredEmail(registerData.email);
        reset();
      }
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      if (apiErr?.code === 'EMAIL_NOT_VERIFIED' || apiErr?.message?.includes('xác minh email')) {
        const loginData = data as LoginFormData;
        setUnverifiedEmail(loginData.email);
        setServerError({
          mode: submittedMode,
          message: 'Tài khoản này cần xác minh email trước khi đăng nhập. Bạn có thể gửi lại email xác minh bên dưới.',
        });
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      setServerError({ mode: submittedMode, message: errorMessage });
    }
  };

  return (
    <main className={styles.container} ref={containerRef}>
      <Link href="/" className={styles.backButton}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Quay lại
      </Link>

      <div className={styles.glassCard} ref={cardRef}>
        <div className={styles.brandLogo}>
          <Image src="/logo.png" alt="Nexora" width={160} height={40} style={{ width: 'auto', height: '40px' }} priority />
        </div>

        {registeredEmail && !isLogin ? (
          <div className={styles.noticeCard} role="status" aria-live="polite">
            <div className={styles.iconWrapper}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className={styles.title}>Kiểm tra email của bạn</h2>
            <p className={styles.noticeText}>
              Chúng tôi đã gửi liên kết xác minh đến <span className={styles.noticeEmail}>{registeredEmail}</span>. Vui lòng kiểm tra hộp thư (bao gồm cả mục spam) và nhấn vào liên kết để kích hoạt tài khoản.
            </p>

              <Button
                type="button"
                fullWidth
                onClick={() => handleResend(registeredEmail)}
                isLoading={isResending}
                disabled={resendCooldown > 0 || isSubmitting}
                className="w-full"
              >
                {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại email xác minh'}
            </Button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigateToMode(true)}
              disabled={isSubmitting}
            >
              Quay lại đăng nhập
            </button>

            <div className={styles.registerWrap}>
              Nhập sai email?{' '}
              <button
                type="button"
                className={styles.registerLink}
                onClick={() => navigateToMode(false)}
                disabled={isSubmitting}
              >
                Đăng ký lại
              </button>
            </div>
          </div>
        ) : (
          <form
            key={isLogin ? 'login' : 'register'}
            ref={formWrapperRef}
            className={styles.authForm}
            onSubmit={handleSubmit(onSubmit)}
            aria-busy={isSubmitting}
            noValidate
          >
            <h2 className={styles.title}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
            <p className={styles.subtitle}>
              {isLogin ? 'Chào mừng bạn quay trở lại' : 'Bắt đầu hành trình nâng tầm sự nghiệp'}
            </p>

            <fieldset className={styles.formControls} disabled={isSubmitting}>
              <legend className={styles.visuallyHidden}>
                {isLogin ? 'Thông tin đăng nhập' : 'Thông tin tạo tài khoản'}
              </legend>

            {isLogin && unverifiedEmail && (
              <div className={styles.warningBanner} role="status">
                <span>Tài khoản <strong>{unverifiedEmail}</strong> chưa được xác minh.</span>
                <button
                  type="button"
                  className={styles.bannerAction}
                  onClick={() => handleResend(unverifiedEmail)}
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending ? 'Đang gửi...' : resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại email xác minh'}
                </button>
              </div>
            )}

            {serverError?.mode === (isLogin ? 'login' : 'register') && (
              <p className={styles.serverError} role="alert">
                {serverError.message}
              </p>
            )}

            {!isLogin && (
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                {...register('name')}
                error={(errors as FieldErrors<RegisterFormData>).name?.message}
                disabled={isSubmitting}
              />
            )}

            <Input
              label="Email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />

            {isLogin ? (
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                disabled={isSubmitting}
              />
            ) : (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <Input
                      label="Mật khẩu"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      error={errors.password?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className={styles.formField}>
                    <Input
                      label="Xác nhận"
                      type="password"
                      placeholder="••••••••"
                      {...register('confirmPassword')}
                      error={(errors as FieldErrors<RegisterFormData>).confirmPassword?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <p className={styles.helperText}>
                  Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
              </>
            )}

            {isLogin && (
              <div className={styles.options}>
                <Link
                  href="/forgot-password"
                  className={`${styles.forgotLink} ${isSubmitting ? styles.linkDisabled : ''}`}
                  aria-disabled={isSubmitting}
                  tabIndex={isSubmitting ? -1 : undefined}
                  onClick={(event) => {
                    if (isSubmitting) event.preventDefault();
                  }}
                >
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className={`${styles.submitButton} w-full`}
            >
              {isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
            </Button>

            <div className={styles.registerWrap}>
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button type="button" onClick={toggleMode} className={styles.registerLink} disabled={isSubmitting}>
                {isLogin ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </div>
            </fieldset>
          </form>
        )}
      </div>
    </main>
  );
}
