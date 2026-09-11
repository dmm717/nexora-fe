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
