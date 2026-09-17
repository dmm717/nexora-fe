'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { bootstrapAuthSession } from '@/services/authSession';
import { getAccessToken, subscribeAuthState } from '@/store/authStore';
import { useAuthRouteBootstrap } from '@/hooks/useAuthRouteBootstrap';

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
  const { pathname, shouldBootstrap } = useAuthRouteBootstrap();
  const [sessionInitialized, setSessionInitialized] = useState(() => {
    if (Boolean(getAccessToken())) return true;
    return !shouldBootstrap;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAccessToken()));
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);
  const hasAttemptedBootstrapRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Subscribe to authStore so any token mutation (login, logout, refresh, 401 fallback)
    // immediately updates React context without requiring page reloads or remounts.
    const unsubscribe = subscribeAuthState((token) => {
      if (!cancelled) {
        setIsAuthenticated(Boolean(token));
        if (token) {
          setSessionInitialized(true);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 2. Perform route-aware session restoration if needed
    const runBootstrapIfNeeded = async () => {
      if (getAccessToken()) {
        if (!cancelled) {
          setIsAuthenticated(true);
          setSessionInitialized(true);
        }
        return;
      }

      // If current route does not require eager bootstrap (e.g. public marketing '/' or '/status'),
      // initialize immediately as anonymous without sending an eager /auth/refresh probe
      if (!shouldBootstrap) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setSessionInitialized(true);
        }
        return;
      }

      // If bootstrap was already performed during this session (and returned false / 401),
      // we do not repeat the expected 401 on every client navigation unless the token changes
      if (hasAttemptedBootstrapRef.current) {
        if (!cancelled) {
          setIsAuthenticated(Boolean(getAccessToken()));
          setSessionInitialized(true);
        }
        return;
      }

      hasAttemptedBootstrapRef.current = true;
      if (!cancelled) {
        setSessionInitialized(false);
      }

      try {
        const authenticated = await bootstrapAuthSession();
        if (cancelled) return;

        setIsAuthenticated(authenticated);
        setSessionInitialized(true);
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

    void runBootstrapIfNeeded();

    return () => {
      cancelled = true;
    };
  }, [pathname, shouldBootstrap]);

  const authReady = sessionInitialized;
  const authState: AuthSessionState = {
    authReady,
    sessionInitialized,
    isAuthenticated,
    bootstrapError,
  };

  return (
    <AuthSessionContext.Provider value={authState}>
      {children}
    </AuthSessionContext.Provider>
  );
}
