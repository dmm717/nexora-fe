/**
 * Memory-only storage for Access Token.
 * Rule 1: Do not use localStorage or sessionStorage for tokens.
 */

export interface AuthStoreSnapshot {
  accessToken: string | null;
  principalEpoch: number;
  principalId: string | null;
}

export type AuthStateListener = (token: string | null, snapshot?: AuthStoreSnapshot) => void;

export interface SetAccessTokenOptions {
  principalId?: string | null;
}

let accessToken: string | null = null;
let principalEpoch = 0;
let principalId: string | null = null;
const listeners = new Set<AuthStateListener>();
let onClearAccessTokenHook: (() => void) | null = null;

export const setOnClearAccessTokenHook = (fn: (() => void) | null) => {
  onClearAccessTokenHook = fn;
};

const decodePrincipalId = (token: string): string | null => {
  const payloadPart = token.split('.')[1];
  if (!payloadPart) return null;

  try {
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = typeof Buffer !== 'undefined'
      ? Buffer.from(padded, 'base64').toString('utf8')
      : typeof atob === 'function'
        ? atob(padded)
        : '';
    if (!json) return null;

    const payload = JSON.parse(json) as Record<string, unknown>;
    const claimNames = [
      'sub',
      'userId',
      'uid',
      'id',
      'nameid',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
      'email',
    ];

    for (const claimName of claimNames) {
      const value = payload[claimName];
      if (typeof value === 'string' && value.length > 0) return value;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }
  } catch {
    // Opaque/non-JWT tokens are handled conservatively by the caller.
  }

  return null;
};

const getSnapshot = (): AuthStoreSnapshot => ({
  accessToken,
  principalEpoch,
  principalId,
});

const notifyListeners = () => {
  const snapshot = getSnapshot();
  for (const listener of listeners) {
    try {
      listener(snapshot.accessToken, snapshot);
    } catch (e) {
      console.error('Error in auth state listener', e);
    }
  }
};

export const getAccessToken = () => accessToken;

export const getPrincipalEpoch = () => principalEpoch;

export const getPrincipalId = () => principalId;

export const getAuthStoreSnapshot = (): AuthStoreSnapshot => getSnapshot();

export const isPrincipalEpochCurrent = (epoch: number) => principalEpoch === epoch;

export const setAccessToken = (token: string | null, options: SetAccessTokenOptions = {}) => {
  const nextPrincipalId = token === null
    ? null
    : decodePrincipalId(token) ?? options.principalId ?? null;

  if (accessToken === token && principalId === nextPrincipalId) return;

  const hasActivePrincipal = accessToken !== null || principalId !== null;
  const tokenChanged = accessToken !== token;
  const hasKnownPrincipalIdentity = principalId !== null && nextPrincipalId !== null;
  const samePrincipal = hasKnownPrincipalIdentity && principalId === nextPrincipalId;

  // A token rotation is safe to apply in-place only when both tokens identify the
  // same principal. Unknown identities fail closed and get a fresh epoch.
  const replacesPrincipal = token !== null && (
    !hasActivePrincipal || (tokenChanged && !samePrincipal)
  );

  if (replacesPrincipal) {
    principalEpoch += 1;
  }

  accessToken = token;
  principalId = nextPrincipalId;
  notifyListeners();
};

export const clearAccessToken = () => {
  onClearAccessTokenHook?.();
  if (accessToken === null && principalId === null) return;
  accessToken = null;
  principalId = null;
  notifyListeners();
};

/**
 * Terminates the current principal locally and advances the security boundary.
 * An expected epoch prevents stale async work from terminating a newer session.
 */
export const invalidatePrincipal = (expectedEpoch?: number): boolean => {
  if (expectedEpoch !== undefined && expectedEpoch !== principalEpoch) return false;
  if (accessToken === null && principalId === null) return false;

  principalEpoch += 1;
  accessToken = null;
  principalId = null;
  notifyListeners();
  return true;
};

export const subscribeAuthState = (listener: AuthStateListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const subscribePrincipalEpoch = (listener: () => void): (() => void) => (
  subscribeAuthState(() => listener())
);
