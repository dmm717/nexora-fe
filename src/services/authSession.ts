import { clearAccessToken, getAccessToken, setAccessToken } from '../store/authStore.ts';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface RefreshSessionResponse {
  data: {
    accessToken: string;
  };
}

export class AuthRefreshError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthRefreshError';
    this.status = status;
  }
}

type RefreshErrorBody = {
  error?: {
    message?: unknown;
  };
  message?: unknown;
};

const getRefreshErrorMessage = (body: RefreshErrorBody | undefined, status: number) => {
  if (typeof body?.error?.message === 'string') return body.error.message;
  if (typeof body?.message === 'string') return body.message;
  return `Auth refresh failed with status ${status}`;
};

const requestRefresh = async (): Promise<RefreshSessionResponse> => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const body = await response.json().catch(() => undefined) as RefreshErrorBody | {
    data?: { accessToken?: unknown };
  } | undefined;

  if (!response.ok) {
    throw new AuthRefreshError(
      getRefreshErrorMessage(body as RefreshErrorBody | undefined, response.status),
      response.status,
    );
  }

  const accessToken = (body as { data?: { accessToken?: unknown } } | undefined)?.data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new AuthRefreshError('Auth refresh response did not include an access token', response.status);
  }

  return { data: { accessToken } };
};

// Share the actual network request between bootstrap and the runtime 401 fallback.
let refreshRequestPromise: Promise<RefreshSessionResponse> | null = null;

export const refreshSession = (): Promise<RefreshSessionResponse> => {
  if (!refreshRequestPromise) {
    refreshRequestPromise = requestRefresh().finally(() => {
      refreshRequestPromise = null;
    });
  }

  return refreshRequestPromise;
};

// Share the bootstrap operation itself so multiple mounted consumers cannot start
// separate refresh calls while the first session restoration is still pending.
let bootstrapRequestPromise: Promise<boolean> | null = null;

export const bootstrapAuthSession = (): Promise<boolean> => {
  if (getAccessToken()) return Promise.resolve(true);

  if (!bootstrapRequestPromise) {
    bootstrapRequestPromise = refreshSession()
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return true;
      })
      .catch((error: unknown) => {
        if (error instanceof AuthRefreshError && error.status === 401) {
          clearAccessToken();
          return false;
        }
        throw error;
      })
      .finally(() => {
        bootstrapRequestPromise = null;
      });
  }

  return bootstrapRequestPromise;
};

/**
 * Decodes the payload portion of a JWT token safely without external libraries.
 * IMPORTANT: Client-side decoded JWT claims are used STRICTLY for timing proactive
 * token refreshes before expiry (e.g. SignalR reconnects), NEVER for client-side
 * authorization decisions. All authorization decisions remain strictly server-enforced.
 */
export const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const base64Url = parts[1];
  if (!base64Url) return null;

  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);

    let jsonString: string;
    if (typeof Buffer !== 'undefined') {
      jsonString = Buffer.from(padded, 'base64').toString('utf8');
    } else if (typeof atob === 'function') {
      const binaryString = atob(padded);
      const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
      jsonString = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(jsonString);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

export const parseJwtExpiration = (token: string): number | null => {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return null;
  }
  return payload.exp;
};

export const isTokenValidAndFresh = (
  token: string,
  bufferSeconds: number = 60,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean => {
  const exp = parseJwtExpiration(token);
  if (exp === null) {
    return false;
  }
  return exp - nowSeconds > bufferSeconds;
};

export interface UsableAccessTokenOptions {
  refreshIfExpiringWithinSeconds?: number;
}

/**
 * Returns a guaranteed usable access token for real-time transports (e.g. SignalR).
 *
 * Behavior:
 * A. If no token in memory -> calls refreshSession(), sets in memory, returns new token.
 * B. If token exists and is safely valid (> bufferSeconds remaining) -> returns existing token immediately.
 * C. If token is expired or expiring within bufferSeconds -> calls refreshSession(), sets in memory, returns new token.
 * D. If refresh fails with 401 -> clears access token from memory and rethrows AuthRefreshError.
 *
 * Concurrent calls are automatically deduplicated via refreshSession's in-flight request sharing.
 */
export const getUsableAccessToken = async (
  options: UsableAccessTokenOptions = {}
): Promise<string> => {
  const { refreshIfExpiringWithinSeconds = 60 } = options;
  const currentToken = getAccessToken();

  if (currentToken && isTokenValidAndFresh(currentToken, refreshIfExpiringWithinSeconds)) {
    return currentToken;
  }

  try {
    const response = await refreshSession();
    const newToken = response.data.accessToken;
    setAccessToken(newToken);
    return newToken;
  } catch (error: unknown) {
    if (error instanceof AuthRefreshError && error.status === 401) {
      clearAccessToken();
    }
    throw error;
  }
};
