import { getAccessToken } from '../store/authStore.ts';
import {
  beginSessionTermination,
  finishSessionTermination,
  type SessionTerminationResult,
} from './authSession.ts';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export type { SessionTerminationResult };

const requestServerTermination = async (
  endpoint: '/auth/logout' | '/auth/logout-all',
  token: string,
): Promise<boolean> => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
    keepalive: true,
  });

  return response.ok;
};

/**
 * Invalidates the local principal and initiates the session termination barrier
 * before awaiting the authoritative server revocation call with keepalive.
 */
const terminateCurrentSession = async (
  endpoint: '/auth/logout' | '/auth/logout-all',
): Promise<SessionTerminationResult> => {
  // 1. Capture token before local transition clears memory
  const token = getAccessToken();

  // 2. Mark termination barrier FIRST, invalidate local principal & abort in-flight refresh
  beginSessionTermination();

  if (!token) {
    const result = { serverLogoutSucceeded: true };
    finishSessionTermination(result);
    return result;
  }

  try {
    const serverLogoutSucceeded = await requestServerTermination(endpoint, token);
    const result = { serverLogoutSucceeded };
    finishSessionTermination(result);
    return result;
  } catch (error: unknown) {
    // Local privacy cleanup has already completed. Server revocation is best-effort.
    console.warn('Unable to complete server session termination', error);
    const result = { serverLogoutSucceeded: false };
    finishSessionTermination(result);
    return result;
  }
};

export const logoutCurrentSession = () => terminateCurrentSession('/auth/logout');

export const logoutAllSessions = () => terminateCurrentSession('/auth/logout-all');
