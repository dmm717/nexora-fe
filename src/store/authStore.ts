/**
 * Memory-only storage for Access Token.
 * Rule 1: Do not use localStorage or sessionStorage for tokens.
 */

export type AuthStateListener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<AuthStateListener>();

const notifyListeners = (token: string | null) => {
  for (const listener of listeners) {
    try {
      listener(token);
    } catch (e) {
      console.error('Error in auth state listener', e);
    }
  }
};

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  if (accessToken === token) return;
  accessToken = token;
  notifyListeners(accessToken);
};

export const clearAccessToken = () => {
  if (accessToken === null) return;
  accessToken = null;
  notifyListeners(null);
};

export const subscribeAuthState = (listener: AuthStateListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
