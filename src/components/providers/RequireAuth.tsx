'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthBootstrapProvider';
import { NexoraBootLoader } from '@/components/brand/NexoraBootLoader';
import { isValidInternalPath } from '@/utils/authIntent';

export interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Route protection guard for protected sections (e.g. /dashboard/**).
 * Responsibilities:
 * 1. Consumes the root auth session context.
 * 2. Waits for authReady (session restoration attempt completed).
 * 3. If authenticated, renders children.
 * 4. If unauthenticated (authoritative 401 or no session), redirects to /auth.
 * 5. If transient bootstrapError occurs, shows a recoverable error state instead of falsely logging out.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authReady, isAuthenticated, bootstrapError } = useAuth();
  const getSafeAuthRedirectUrl = React.useCallback((): string => {
    const currentPath = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : pathname;

    if (currentPath && isValidInternalPath(currentPath) && !currentPath.startsWith('/auth')) {
      return `/auth?returnTo=${encodeURIComponent(currentPath)}`;
    }
    return '/auth';
  }, [pathname]);

  useEffect(() => {
    if (authReady && !isAuthenticated && !bootstrapError) {
      router.replace(getSafeAuthRedirectUrl());
    }
  }, [authReady, isAuthenticated, bootstrapError, router, getSafeAuthRedirectUrl]);

  if (!authReady) {
    return <NexoraBootLoader message="Đang kết nối phiên đăng nhập..." />;
  }

  if (bootstrapError && !isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          textAlign: 'center',
        }}
        role="alert"
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.5rem' }}>
          Không thể khôi phục phiên đăng nhập
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', maxWidth: '400px' }}>
          Không thể xác minh phiên đăng nhập lúc này. Vui lòng thử tải lại trang hoặc đăng nhập lại.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Thử lại
          </button>
          <button
            onClick={() => router.replace(getSafeAuthRedirectUrl())}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e2e8f0',
              color: '#1e293b',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
