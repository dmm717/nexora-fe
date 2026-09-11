'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthBootstrapProvider';

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
  const { authReady, isAuthenticated, bootstrapError } = useAuth();

  useEffect(() => {
    if (authReady && !isAuthenticated && !bootstrapError) {
      router.replace('/auth');
    }
  }, [authReady, isAuthenticated, bootstrapError, router]);

  if (!authReady) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
          Đã có lỗi kết nối máy chủ khi kiểm tra phiên đăng nhập. Vui lòng thử tải lại trang hoặc đăng nhập lại.
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
            onClick={() => router.replace('/auth')}
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
