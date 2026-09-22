import {
  getAccessToken,
  getPrincipalEpoch,
  invalidatePrincipal,
} from '../store/authStore.ts';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface SessionTerminationResult {
  serverLogoutSucceeded: boolean;
}

const requestServerTermination = async (
  endpoint: '/auth/logout' | '/auth/logout-all',
  token: string,
) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });

  return response.ok;
};

/**
 * Invalidates the local principal before awaiting the best-effort server call.
 * The bearer token is captured first because the local transition clears memory.
 */
const terminateCurrentSession = async (
  endpoint: '/auth/logout' | '/auth/logout-all',
): Promise<SessionTerminationResult> => {
  const token = getAccessToken();
  const currentEpoch = getPrincipalEpoch();

  invalidatePrincipal(currentEpoch);

  if (!token) {
    return { serverLogoutSucceeded: true };
  }

  try {
    return { serverLogoutSucceeded: await requestServerTermination(endpoint, token) };
  } catch (error: unknown) {
    // Local privacy cleanup has already completed. Server revocation is best-effort.
    console.warn('Unable to complete server session termination', error);
    return { serverLogoutSucceeded: false };
  }
};

export const logoutCurrentSession = () => terminateCurrentSession('/auth/logout');

export const logoutAllSessions = () => terminateCurrentSession('/auth/logout-all');
