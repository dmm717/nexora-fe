'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { bootstrapAuthSession } from '@/services/authSession';
import { getAccessToken } from '@/store/authStore';

export interface AuthSessionState {
  authReady: boolean;
  sessionInitialized: boolean;
  isAuthenticated: boolean;
  bootstrapError: Error | null;
}

const defaultAuthSessionState: AuthSessionState = {
  authReady: false,
  sessionInitialized: false,
  isAuthenticated: false,
  bootstrapError: null,
};

const AuthSessionContext = createContext<AuthSessionState>(defaultAuthSessionState);

export const useAuth = () => useContext(AuthSessionContext);
export const useAuthSession = useAuth;

export default function AuthBootstrapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const initializeSession = async () => {
      if (getAccessToken()) {
        if (!cancelled) {
          setIsAuthenticated(true);
          setSessionInitialized(true);
        }
        return;
      }

      try {
        const authenticated = await bootstrapAuthSession();
        if (cancelled) return;

        setIsAuthenticated(authenticated);
        setSessionInitialized(true);

        if (!authenticated && pathname !== '/auth') {
          router.replace('/auth');
        }
      } catch (error: unknown) {
        if (cancelled) return;

        const normalizedError = error instanceof Error
          ? error
          : new Error('Unable to restore the authentication session');

        console.error('Auth session bootstrap failed', normalizedError);
        setBootstrapError(normalizedError);
        setIsAuthenticated(Boolean(getAccessToken()));
        setSessionInitialized(true);
      }
    };

    void initializeSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const authReady = sessionInitialized;
  const authState: AuthSessionState = {
    authReady,
    sessionInitialized,
    isAuthenticated,
    bootstrapError,
  };

  if (!sessionInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc' }} role="status" aria-live="polite">
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/auth') {
    if (bootstrapError) {
      return (
        <div role="alert">
          Không thể khôi phục phiên đăng nhập. Vui lòng thử lại.
        </div>
      );
    }

    return null;
  }

  return (
    <AuthSessionContext.Provider value={authState}>
      {children}
    </AuthSessionContext.Provider>
  );
}
