'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  }, []);

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
