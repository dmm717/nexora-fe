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

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  const [prevMode, setPrevMode] = useState(mode);
  if (prevMode !== mode) {
    setPrevMode(mode);
    setIsLogin(mode !== 'register');
    setUnverifiedEmail(null);
    setRegisteredEmail(null);
  }

  useEffect(() => {
    reset();
  }, [mode, reset]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const newIsLogin = !isLogin;
    setUnverifiedEmail(null);
    setRegisteredEmail(null);

    if (formWrapperRef.current) {
      const form = formWrapperRef.current;

      gsap.to(form, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          reset();
          router.push(newIsLogin ? '/auth' : '/auth?mode=register', { scroll: false });
          setIsLogin(newIsLogin);

          setTimeout(() => {
            if (formWrapperRef.current) {
              gsap.fromTo(
                formWrapperRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
              );
            }
          }, 50);
        },
      });
    } else {
      reset();
      router.push(newIsLogin ? '/auth' : '/auth?mode=register', { scroll: false });
      setIsLogin(newIsLogin);
    }
  };

  useGSAP(
    () => {
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.1,
          }
        );
      }

      if (formWrapperRef.current) {
        const elements = Array.from(formWrapperRef.current.children);
        gsap.from(elements, {
          y: 15,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
          delay: 0.3,
        });
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
    try {
      if (isLogin) {
        const loginData = data as LoginFormData;
        await authApi.login({
          email: loginData.email,
          password: loginData.password,
        });
        toast.success('Đăng nhập thành công');
        router.push('/overview');
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
        toast.error('Bạn cần xác minh email trước khi đăng nhập.');
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      toast.error(errorMessage);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
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

        {registeredEmail ? (
          <div className={styles.noticeCard}>
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
              onClick={() => handleResend(registeredEmail)}
              isLoading={isResending}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại email xác minh'}
            </Button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setRegisteredEmail(null);
                setIsLogin(true);
                router.push('/auth', { scroll: false });
              }}
            >
              Quay lại đăng nhập
            </button>

            <div className={styles.registerWrap}>
              Nhập sai email?{' '}
              <button
                type="button"
                className={styles.registerLink}
                onClick={() => {
                  setRegisteredEmail(null);
                  setIsLogin(false);
                  router.push('/auth?mode=register', { scroll: false });
                }}
              >
                Đăng ký lại
              </button>
            </div>
          </div>
        ) : (
          <form ref={formWrapperRef} onSubmit={handleSubmit(onSubmit)} noValidate>
            <h2 className={styles.title}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
            <p className={styles.subtitle}>
              {isLogin ? 'Chào mừng bạn quay trở lại' : 'Bắt đầu hành trình nâng tầm sự nghiệp'}
            </p>

            {isLogin && unverifiedEmail && (
              <div className={styles.warningBanner}>
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
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Mật khẩu"
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      error={errors.password?.message}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
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

            <div className={styles.options}>
              {isLogin ? (
                <>
                  <label className={styles.checkbox}>
                    <input type="checkbox" disabled={isSubmitting} /> Ghi nhớ
                  </label>
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Quên mật khẩu?
                  </Link>
                </>
              ) : (
                <label className={styles.checkbox}>
                  <input type="checkbox" required disabled={isSubmitting} />
                  <span>
                    Tôi đồng ý với <Link href="#" className={styles.termsLink}>Điều khoản</Link> & <Link href="#" className={styles.termsLink}>Bảo mật</Link>
                  </span>
                </label>
              )}
            </div>

            <Button type="submit" isLoading={isSubmitting}>
              {isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
            </Button>

            <div className={styles.registerWrap}>
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button type="button" onClick={toggleMode} className={styles.registerLink} disabled={isSubmitting}>
                {isLogin ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
