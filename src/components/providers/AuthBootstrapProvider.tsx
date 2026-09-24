'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { bootstrapAuthSession, StaleAuthSessionError } from '@/services/authSession';
import { getAccessToken, getPrincipalEpoch, subscribeAuthState } from '@/store/authStore';
import { useAuthRouteBootstrap } from '@/hooks/useAuthRouteBootstrap';

export interface AuthSessionState {
  authReady: boolean;
  sessionInitialized: boolean;
  isAuthenticated: boolean;
  principalEpoch: number;
  bootstrapError: Error | null;
}

const defaultAuthSessionState: AuthSessionState = {
  authReady: false,
  sessionInitialized: false,
  isAuthenticated: false,
  principalEpoch: 0,
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
  const [principalEpoch, setPrincipalEpoch] = useState(() => getPrincipalEpoch());
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);

  // Remember definitive 401 unauthenticated responses within the current anonymous session
  // to avoid redundant network probes on SPA navigation.
  // Transient failures (5xx, network errors) are NEVER cached as definitive.
  const isDefinitivelyUnauthenticatedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Subscribe to authStore so any token mutation (login, logout, refresh, 401 fallback)
    // immediately updates React context without requiring page reloads or remounts.
    const unsubscribe = subscribeAuthState((token, snapshot) => {
      if (!cancelled) {
        setPrincipalEpoch(snapshot?.principalEpoch ?? getPrincipalEpoch());
        setIsAuthenticated(Boolean(token));
        if (token) {
          isDefinitivelyUnauthenticatedRef.current = false;
          setBootstrapError(null);
          setSessionInitialized(true);
        } else {
          isDefinitivelyUnauthenticatedRef.current = true;
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

    // 2. Perform route-aware session restoration.
    // Notice: We do NOT skip execution if a bootstrap operation is already in progress.
    // bootstrapAuthSession internally deduplicates the in-flight network request via its
    // shared promise. Every relevant route effect awaits that shared promise so the newest,
    // non-cancelled route effect always receives and publishes the final state.
    const runBootstrapIfNeeded = async () => {
      if (getAccessToken()) {
        if (!cancelled) {
          setIsAuthenticated(true);
          setBootstrapError(null);
          setSessionInitialized(true);
        }
        return;
      }

      // If current route is truly stateless (e.g. /design-system),
      // we do not need to eagerly probe auth
      if (!shouldBootstrap) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setSessionInitialized(true);
        }
        return;
      }

      // If bootstrap already returned a definitive 401 in this anonymous session,
      // skip repeating the expected 401 on internal SPA route transitions
      if (isDefinitivelyUnauthenticatedRef.current) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setSessionInitialized(true);
        }
        return;
      }

      if (!cancelled) {
        setBootstrapError(null);
        setSessionInitialized(false);
      }

      try {
        const authenticated = await bootstrapAuthSession();
        if (cancelled) return;

        if (authenticated) {
          isDefinitivelyUnauthenticatedRef.current = false;
          setIsAuthenticated(true);
          setBootstrapError(null);
        } else {
          isDefinitivelyUnauthenticatedRef.current = true;
          setIsAuthenticated(false);
          setBootstrapError(null);
        }
        setSessionInitialized(true);
      } catch (error: unknown) {
        if (cancelled) return;

        if (error instanceof StaleAuthSessionError) {
          setBootstrapError(null);
          setIsAuthenticated(Boolean(getAccessToken()));
          setSessionInitialized(true);
          return;
        }

        // Transient error (5xx, network failure, etc.):
        // Do NOT set isDefinitivelyUnauthenticatedRef!
        // This ensures the error remains retryable.
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
    principalEpoch,
    bootstrapError,
  };

  return (
    <AuthSessionContext.Provider value={authState}>
      {children}
    </AuthSessionContext.Provider>
  );
}
