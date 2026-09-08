'use client';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { toast } from 'sonner';

import { FieldErrors } from 'react-hook-form';
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

  // Derive state change from URL if mode changes, but mostly we rely on the component's internal state for fast toggle.
  useEffect(() => {
    // Only reset form when mode explicitly changes from URL initially or externally
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const newIsLogin = !isLogin;

    if (formWrapperRef.current) {
      const form = formWrapperRef.current;

      // 1. Fade OUT the content
      gsap.to(form, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          reset();
          router.push(newIsLogin ? '/auth' : '/auth?mode=register', { scroll: false });
          setIsLogin(newIsLogin);

          // Use a simple timeout to ensure React has flushed the DOM updates before animating in.
          setTimeout(() => {
            if (formWrapperRef.current) {
              gsap.fromTo(formWrapperRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
              );
            }
          }, 50);
        }
      });
    } else {
      reset();
      router.push(newIsLogin ? '/auth' : '/auth?mode=register', { scroll: false });
      setIsLogin(newIsLogin);
    }
  };

  useGSAP(() => {
    // Initial Elegant Reveal Animation
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.1
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
        delay: 0.3
      });
    }
  }, { scope: containerRef });

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      if (isLogin) {
        const loginData = data as LoginFormData;
        await authApi.login({
          email: loginData.email,
          password: loginData.password
        });
        toast.success('Đăng nhập thành công');
        router.push('/dashboard');
      } else {
        const registerData = data as RegisterFormData;
        await authApi.register({
          displayName: registerData.name,
          email: registerData.email,
          password: registerData.password
        });
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        reset();
      }
    } catch (err: unknown) {
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
          <Image src="/logo.png" alt="Nexora" width={160} height={40} style={{ objectFit: 'contain', height: 'auto' }} priority />
        </div>
        <form ref={formWrapperRef} onSubmit={handleSubmit(onSubmit)} noValidate>
          <h2 className={styles.title}>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
          <p className={styles.subtitle}>
            {isLogin ? 'Chào mừng bạn quay trở lại' : 'Bắt đầu hành trình nâng tầm sự nghiệp'}
          </p>

          {/* Inline error message removed, already handled by toast */}

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
          )}

          <div className={styles.options}>
            {isLogin ? (
              <>
                <label className={styles.checkbox}>
                  <input type="checkbox" disabled={isSubmitting} /> Ghi nhớ
                </label>
                <Link href="#" className={styles.forgotLink}>Quên mật khẩu?</Link>
              </>
            ) : (
              <label className={styles.checkbox}>
                <input type="checkbox" required disabled={isSubmitting} />
                <span>Tôi đồng ý với <Link href="#" className={styles.termsLink}>Điều khoản</Link> & <Link href="#" className={styles.termsLink}>Bảo mật</Link></span>
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
      </div>
    </div>
  );
}
