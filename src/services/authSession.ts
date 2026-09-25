import {
  getAccessToken,
  getPrincipalEpoch,
  getPrincipalId,
  invalidatePrincipal,
  isPrincipalEpochCurrent,
  setAccessToken,
  setOnClearAccessTokenHook,
} from '../store/authStore.ts';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

const SESSION_TERMINATION_STORAGE_KEY = 'nexora_session_termination_barrier';

const safeGetSessionStorage = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(SESSION_TERMINATION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return null;
};

const safeSetSessionStorage = (value: string | null): void => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (value === null) {
        window.sessionStorage.removeItem(SESSION_TERMINATION_STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(SESSION_TERMINATION_STORAGE_KEY, value);
      }
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

let sessionTerminationActive = false;

export const isSessionTerminationActive = (): boolean => {
  if (sessionTerminationActive) return true;
  return safeGetSessionStorage() === 'active';
};

export interface SessionTerminationResult {
  serverLogoutSucceeded: boolean;
}

export const beginSessionTermination = (): void => {
  sessionTerminationActive = true;
  safeSetSessionStorage('active');

  // Abort any in-flight refresh network request immediately
  if (refreshAbortController) {
    try {
      refreshAbortController.abort();
    } catch {
      // Best-effort abort
    }
    refreshAbortController = null;
  }

  // Drop tracked refresh promise immediately so concurrent callers do not wait on stale work
  refreshRequestPromise = null;
  refreshRequestEpoch = null;

  // Invalidate local principal and advance security boundary
  invalidatePrincipal();
};

export const finishSessionTermination = (_result?: SessionTerminationResult): void => {
  void _result;
  // Barrier remains active following termination completion until explicit login
};

export const resetSessionTerminationForExplicitLogin = (): void => {
  sessionTerminationActive = false;
  safeSetSessionStorage(null);
};

// Automatically synchronize test resets with the termination barrier
setOnClearAccessTokenHook(() => {
  resetSessionTerminationForExplicitLogin();
});

export interface RefreshSessionResponse {
  data: {
    accessToken: string;
  };
  principalEpoch: number;
}

export class AuthRefreshError extends Error {
  readonly status: number;
  readonly principalEpoch: number;

  constructor(message: string, status: number, principalEpoch: number = getPrincipalEpoch()) {
    super(message);
    this.name = 'AuthRefreshError';
    this.status = status;
    this.principalEpoch = principalEpoch;
  }
}

export class StaleAuthSessionError extends Error {
  readonly principalEpoch: number;

  constructor(principalEpoch: number) {
    super('Discarded work from an obsolete authentication session');
    this.name = 'StaleAuthSessionError';
    this.principalEpoch = principalEpoch;
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

let refreshAbortController: AbortController | null = null;

const requestRefresh = async (requestEpoch: number): Promise<RefreshSessionResponse> => {
  if (isSessionTerminationActive()) {
    throw new StaleAuthSessionError(requestEpoch);
  }

  const controller = new AbortController();
  refreshAbortController = controller;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (error: unknown) {
    if (controller.signal.aborted || isSessionTerminationActive()) {
      throw new StaleAuthSessionError(requestEpoch);
    }
    throw error;
  } finally {
    if (refreshAbortController === controller) {
      refreshAbortController = null;
    }
  }

  if (isSessionTerminationActive() || !isPrincipalEpochCurrent(requestEpoch)) {
    throw new StaleAuthSessionError(requestEpoch);
  }

  const body = await response.json().catch(() => undefined) as RefreshErrorBody | {
    data?: { accessToken?: unknown };
  } | undefined;

  if (isSessionTerminationActive() || !isPrincipalEpochCurrent(requestEpoch)) {
    throw new StaleAuthSessionError(requestEpoch);
  }

  if (!response.ok) {
    throw new AuthRefreshError(
      getRefreshErrorMessage(body as RefreshErrorBody | undefined, response.status),
      response.status,
      requestEpoch,
    );
  }

  const accessToken = (body as { data?: { accessToken?: unknown } } | undefined)?.data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new AuthRefreshError(
      'Auth refresh response did not include an access token',
      response.status,
      requestEpoch,
    );
  }

  return { data: { accessToken }, principalEpoch: requestEpoch };
};

// Share the actual network request between bootstrap and the runtime 401 fallback.
let refreshRequestPromise: Promise<RefreshSessionResponse> | null = null;
let refreshRequestEpoch: number | null = null;

export const refreshSession = (): Promise<RefreshSessionResponse> => {
  const requestEpoch = getPrincipalEpoch();
  if (isSessionTerminationActive()) {
    return Promise.reject(new StaleAuthSessionError(requestEpoch));
  }

  if (!refreshRequestPromise || refreshRequestEpoch !== requestEpoch) {
    const request = requestRefresh(requestEpoch);
    const trackedRequest = request.finally(() => {
      // A newer principal may already have started its own refresh while this
      // obsolete request was in flight. Never clear the newer promise.
      if (refreshRequestPromise === trackedRequest) {
        refreshRequestPromise = null;
        refreshRequestEpoch = null;
      }
    });
    refreshRequestEpoch = requestEpoch;
    refreshRequestPromise = trackedRequest;
  }

  return refreshRequestPromise;
};

export const applyRefreshSessionResponse = (
  response: RefreshSessionResponse,
  expectedEpoch: number = response.principalEpoch,
): string => {
  if (isSessionTerminationActive() || response.principalEpoch !== expectedEpoch) {
    throw new StaleAuthSessionError(response.principalEpoch);
  }

  const newToken = response.data.accessToken;
  // Multiple callers may await the same refresh promise. The first caller
  // establishes the epoch; later callers may safely observe that exact token
  // already applied, while any other token means the response is stale.
  if (!isPrincipalEpochCurrent(expectedEpoch) || isSessionTerminationActive()) {
    if (!isSessionTerminationActive() && getAccessToken() === newToken) return newToken;
    throw new StaleAuthSessionError(response.principalEpoch);
  }

  // Refresh responses normally carry a JWT subject. Preserve the known login
  // principal as a fallback for opaque access tokens so token rotation does not
  // create a false principal transition.
  setAccessToken(newToken, { principalId: getPrincipalId() });
  return newToken;
};

export const bootstrapAuthSession = (): Promise<boolean> => {
  if (isSessionTerminationActive()) return Promise.resolve(false);
  if (getAccessToken()) return Promise.resolve(true);

  const requestEpoch = getPrincipalEpoch();
  return refreshSession()
    .then((response) => {
      if (
        isSessionTerminationActive()
        || response.principalEpoch !== requestEpoch
        || !isPrincipalEpochCurrent(requestEpoch)
      ) {
        return Boolean(!isSessionTerminationActive() && getAccessToken());
      }

      applyRefreshSessionResponse(response, requestEpoch);
      return true;
    })
    .catch((error: unknown) => {
      const errorEpoch = error instanceof AuthRefreshError
        ? error.principalEpoch
        : requestEpoch;

      if (
        error instanceof StaleAuthSessionError
        || isSessionTerminationActive()
        || !isPrincipalEpochCurrent(errorEpoch)
      ) {
        return Boolean(!isSessionTerminationActive() && getAccessToken());
      }

      if (error instanceof AuthRefreshError && error.status === 401) {
        invalidatePrincipal(errorEpoch);
        return false;
      }

      throw error;
    });
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
 * D. If refresh fails with 401 -> invalidates the current principal in memory and rethrows AuthRefreshError.
 *
 * Concurrent calls are automatically deduplicated via refreshSession's in-flight request sharing.
 */
export const getUsableAccessToken = async (
  options: UsableAccessTokenOptions = {}
): Promise<string> => {
  const { refreshIfExpiringWithinSeconds = 60 } = options;
  const requestEpoch = getPrincipalEpoch();

  if (isSessionTerminationActive()) {
    throw new StaleAuthSessionError(requestEpoch);
  }

  const currentToken = getAccessToken();

  if (currentToken && isTokenValidAndFresh(currentToken, refreshIfExpiringWithinSeconds)) {
    return currentToken;
  }

  try {
    const response = await refreshSession();
    return applyRefreshSessionResponse(response, requestEpoch);
  } catch (error: unknown) {
    const errorEpoch = error instanceof AuthRefreshError
      ? error.principalEpoch
      : requestEpoch;

    if (
      error instanceof AuthRefreshError
      && error.status === 401
      && !isSessionTerminationActive()
      && isPrincipalEpochCurrent(errorEpoch)
    ) {
      invalidatePrincipal(errorEpoch);
    }
    throw error;
  }
};
