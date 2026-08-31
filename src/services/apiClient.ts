import { getAccessToken, setAccessToken, clearAccessToken } from '../store/authStore';
import { translateErrorMessage } from '../utils/errorTranslator';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Thêm các header cần thiết:
 * - Authorization (Bearer) nếu có token
 * - Idempotency-Key (với các hàm POST)
 */
const getHeaders = (isPost = false) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (isPost) {
    // Sử dụng randomUUID (native trong trình duyệt hiện đại)
    headers['Idempotency-Key'] = crypto.randomUUID();
  }

  return headers;
};

// --- Refresh Token Queue Logic ---
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void, reject: (error: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};
// ---------------------------------

/**
 * Xử lý lỗi chung và refresh token khi 401
 */
const handleResponse = async (response: Response, fetchParams: { url: string; options: RequestInit }) => {
  if (response.ok) {
    // Có thể API trả về 204 No Content => không cần parse JSON
    if (response.status === 204) return null;
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const isAuthEndpoint = fetchParams.url.includes('/auth/login') || 
                         fetchParams.url.includes('/auth/register') || 
                         fetchParams.url.includes('/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint) {
    if (isRefreshing) {
      // Nếu đang refresh, cho request này vào hàng đợi
      try {
        await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        // Khi promise resolve, token đã được set trong authStore, retry request
        const newHeaders = getHeaders(fetchParams.options.method === 'POST');
        const retryRes = await fetch(fetchParams.url, {
          ...fetchParams.options,
          headers: newHeaders
        });
        if (retryRes.ok) {
          if (retryRes.status === 204) return null;
          return await retryRes.json();
        }
      } catch {
        // Queue bị reject => Sẽ chạy xuống logic clear token
      }
    } else {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include' // Bắt buộc để gửi cookie chứa refresh token lên server
        });

        if (refreshRes.ok) {
          const payload = await refreshRes.json();
          const newToken = payload.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            processQueue(null, newToken);

            // Retry lại request ban đầu với token mới
            const newHeaders = getHeaders(fetchParams.options.method === 'POST');
            const retryRes = await fetch(fetchParams.url, {
              ...fetchParams.options,
              headers: newHeaders
            });
            
            if (retryRes.ok) {
              if (retryRes.status === 204) return null;
              return await retryRes.json();
            }
            
            // Nếu retry vẫn lỗi (mà không phải 401), xử lý lỗi bên dưới
            const errorData = await retryRes.json().catch(() => ({}));
            const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
            throw new Error(translateErrorMessage(rawMessage));
          } else {
            processQueue(new Error('No new token provided'));
          }
        } else {
          processQueue(new Error('Refresh API returned error'));
        }
      } catch (e) {
        console.error('Refresh token failed', e);
        processQueue(e as Error);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu logic refresh thất bại hoặc retry thất bại do 401
    clearAccessToken();
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/auth'; // Chuyển hướng về login
    }
  }

  // Ném lỗi để UI xử lý (nếu không phải 401 hoặc đã thử retry mà vẫn lỗi nhưng không redirect)
  const errorData = await response.json().catch(() => ({}));
  const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
  throw new Error(translateErrorMessage(rawMessage));
};

export const apiClient = {
  get: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'GET',
      headers: { ...getHeaders(false), ...customOptions?.headers },
      credentials: 'include',
      ...customOptions,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  post: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'POST',
      headers: { ...getHeaders(true), ...customOptions?.headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...customOptions,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  patch: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'PATCH',
      headers: { ...getHeaders(true), ...customOptions?.headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      ...customOptions,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  delete: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'DELETE',
      headers: { ...getHeaders(false), ...customOptions?.headers },
      credentials: 'include',
      ...customOptions,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },
};
