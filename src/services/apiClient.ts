import {
  getAccessToken,
  getPrincipalEpoch,
  invalidatePrincipal,
  isPrincipalEpochCurrent,
  setAccessToken,
} from '../store/authStore.ts';
import { translateErrorMessage } from '../utils/errorTranslator.ts';
import { AuthRefreshError, refreshSession, StaleAuthSessionError } from './authSession.ts';

export class ApiError extends Error {
  code?: string;
  requestId?: string;
  status?: number;

  constructor(message: string, code?: string, requestId?: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Adds the current in-memory bearer token to a request. Tokens are never
 * persisted outside the auth store.
 */
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const redirectToAuth = () => {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/auth';
  }
};

const throwApiError = async (response: Response, fallbackMessage: string): Promise<never> => {
  const errorData = await response.json().catch(() => ({})) as {
    error?: { message?: unknown; code?: unknown; requestId?: unknown };
    message?: unknown;
  };
  const rawMessage = typeof errorData.error?.message === 'string'
    ? errorData.error.message
    : typeof errorData.message === 'string'
      ? errorData.message
      : fallbackMessage;
  throw new ApiError(
    translateErrorMessage(rawMessage),
    typeof errorData.error?.code === 'string' ? errorData.error.code : undefined,
    typeof errorData.error?.requestId === 'string' ? errorData.error.requestId : undefined,
    response.status,
  );
};

/**
 * Handles an API response and performs a same-principal refresh/retry for a
 * 401. Every lifecycle decision is guarded by the epoch captured at request
 * start, so stale requests cannot affect the active principal.
 */
const handleResponse = async (
  response: Response,
  fetchParams: { url: string; options: RequestInit; principalEpoch: number },
) => {
  if (response.ok) {
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const headersObj = fetchParams.options.headers as Record<string, string> | undefined;
  const skipAuthRedirect = headersObj?.['X-Skip-Auth-Redirect'] === 'true';
  const isExcludedFrom401Redirect = fetchParams.url.includes('/auth/') || skipAuthRedirect;

  if (response.status === 401 && !isExcludedFrom401Redirect) {
    const requestEpoch = fetchParams.principalEpoch;

    if (!isPrincipalEpochCurrent(requestEpoch)) {
      throw new StaleAuthSessionError(requestEpoch);
    }

    try {
      const refreshResponse = await refreshSession();
      if (
        refreshResponse.principalEpoch !== requestEpoch
        || !isPrincipalEpochCurrent(requestEpoch)
      ) {
        throw new StaleAuthSessionError(requestEpoch);
      }

      const newToken = refreshResponse.data.accessToken;
      if (!newToken) throw new Error('No new token provided');

      setAccessToken(newToken);

      if (!isPrincipalEpochCurrent(requestEpoch)) {
        throw new StaleAuthSessionError(requestEpoch);
      }

      const retryResponse = await fetch(fetchParams.url, {
        ...fetchParams.options,
        headers: {
          ...fetchParams.options.headers,
          ...getHeaders(),
        },
      });

      if (retryResponse.ok) {
        if (retryResponse.status === 204) return null;
        return await retryResponse.json();
      }

      if (retryResponse.status !== 401) {
        return throwApiError(retryResponse, 'Có lỗi xảy ra từ máy chủ');
      }
    } catch (error: unknown) {
      if (
        error instanceof StaleAuthSessionError
        || !isPrincipalEpochCurrent(requestEpoch)
        || (error instanceof AuthRefreshError && error.principalEpoch !== requestEpoch)
      ) {
        throw new StaleAuthSessionError(requestEpoch);
      }

      if (error instanceof AuthRefreshError && error.status === 401) {
        invalidatePrincipal(requestEpoch);
        redirectToAuth();
      }

      throw error;
    }

    if (!isPrincipalEpochCurrent(requestEpoch)) {
      throw new StaleAuthSessionError(requestEpoch);
    }

    // The refreshed token was also rejected. This is a definitive terminal
    // session expiry for this epoch, not permission for stale work to clear B.
    invalidatePrincipal(requestEpoch);
    redirectToAuth();
    throw new ApiError('Bạn cần đăng nhập để tiếp tục.', 'UNAUTHENTICATED', undefined, 401);
  }

  return throwApiError(response, 'Có lỗi xảy ra từ máy chủ');
};

export const apiClient = {
  get: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const principalEpoch = getPrincipalEpoch();
    const { headers: customHeaders, ...restOptions } = customOptions || {};
    const options: RequestInit = {
      method: 'GET',
      credentials: 'include',
      ...restOptions,
      headers: { ...getHeaders(), ...customHeaders },
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options, principalEpoch });
  },

  post: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const principalEpoch = getPrincipalEpoch();
    const { headers: customHeaders, ...restOptions } = customOptions || {};

    const headers = { ...getHeaders(), ...customHeaders } as Record<string, string>;
    if (!headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }

    const options: RequestInit = {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...restOptions,
      headers,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options, principalEpoch });
  },

  patch: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const principalEpoch = getPrincipalEpoch();
    const { headers: customHeaders, ...restOptions } = customOptions || {};

    const headers = { ...getHeaders(), ...customHeaders } as Record<string, string>;
    if (!headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }

    const options: RequestInit = {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...restOptions,
      headers,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options, principalEpoch });
  },

  delete: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const principalEpoch = getPrincipalEpoch();
    const { headers: customHeaders, ...restOptions } = customOptions || {};
    const options: RequestInit = {
      method: 'DELETE',
      credentials: 'include',
      ...restOptions,
      headers: { ...getHeaders(), ...customHeaders },
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options, principalEpoch });
  },

  put: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const principalEpoch = getPrincipalEpoch();
    const { headers: customHeaders, ...restOptions } = customOptions || {};

    const headers = { ...getHeaders(), ...customHeaders } as Record<string, string>;
    if (!headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }

    const options: RequestInit = {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...restOptions,
      headers,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options, principalEpoch });
  },
};
