/** Anonymous, one-attempt transport. Never use the session-aware apiClient here. */
export type DeletionFailure = 'invalid-link' | 'validation' | 'rate-limit' | 'unavailable' | 'uncertain';

export class AccountDeletionError extends Error {
  readonly kind: DeletionFailure;
  constructor(kind: DeletionFailure) {
    super('Không thể xác nhận kết quả yêu cầu.');
    this.name = 'AccountDeletionError';
    this.kind = kind;
  }
}

export interface PublicDeletionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  completedAt: string | null;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
type Fetcher = typeof fetch;

async function post(path: 'request' | 'confirm', payload: { email: string } | { token: string }, fetcher: Fetcher) {
  let response: Response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/$/, '')}/account-deletion/external/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    // The server may have accepted a POST before the connection was lost.
    throw new AccountDeletionError('uncertain');
  }
  if (response.status === 202) return response;
  if (response.status === 429) throw new AccountDeletionError('rate-limit');
  if (response.status === 400) {
    let code: unknown;
    try { code = (await response.json())?.error?.code; } catch { /* Never surface a raw response. */ }
    if (path === 'confirm' && code === 'DELETION_VERIFICATION_INVALID') {
      throw new AccountDeletionError('invalid-link');
    }
    throw new AccountDeletionError(path === 'request' ? 'validation' : 'unavailable');
  }
  throw new AccountDeletionError(response.status >= 500 ? 'uncertain' : 'unavailable');
}

export async function requestPublicAccountDeletion(email: string, fetcher: Fetcher = fetch): Promise<void> {
  // All accepted responses deliberately produce the same UI, regardless of body/account existence.
  await post('request', { email: email.trim() }, fetcher);
}

export async function confirmPublicAccountDeletion(token: string, fetcher: Fetcher = fetch): Promise<PublicDeletionStatus> {
  const response = await post('confirm', { token }, fetcher);
  try {
    const data = (await response.json())?.data;
    if (!data || typeof data.id !== 'string' || !data.id ||
      !['queued', 'processing', 'completed', 'failed'].includes(data.status) ||
      typeof data.requestedAt !== 'string' || !Number.isFinite(Date.parse(data.requestedAt)) ||
      !(data.completedAt === null || (typeof data.completedAt === 'string' && Number.isFinite(Date.parse(data.completedAt))))) {
      throw new Error();
    }
    return { id: data.id, status: data.status, requestedAt: data.requestedAt, completedAt: data.completedAt };
  } catch {
    throw new AccountDeletionError('uncertain');
  }
}
