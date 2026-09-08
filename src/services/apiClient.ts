import { getAccessToken, setAccessToken, clearAccessToken } from '../store/authStore';
import { translateErrorMessage } from '../utils/errorTranslator';

export class ApiError extends Error {
  code?: string;
  requestId?: string;
  
  constructor(message: string, code?: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.requestId = requestId;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';



/**
 * Thêm các header cần thiết:
 * - Authorization (Bearer) nếu có token
 */
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
      } catch (err) {
        // Queue bị reject => Sẽ rơi xuống logic logout ở cuối
        clearAccessToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
          return new Promise(() => {});
        }
        throw err;
      }

      // Khi promise resolve, token đã được set trong authStore, retry request
      const retryRes = await fetch(fetchParams.url, {
        ...fetchParams.options,
        headers: {
          ...fetchParams.options.headers,
          ...getHeaders()
        }
      });
      
      if (retryRes.ok) {
        if (retryRes.status === 204) return null;
        return await retryRes.json();
      }
      
      if (retryRes.status !== 401) {
        const errorData = await retryRes.json().catch(() => ({}));
        const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
        throw new ApiError(translateErrorMessage(rawMessage), errorData.error?.code, errorData.error?.requestId);
      }
      
      // Nếu retry bị 401, rơi xuống dưới để logout
    } else {
      isRefreshing = true;
      let refreshSuccess = false;
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshRes.ok) {
          const payload = await refreshRes.json();
          const newToken = payload.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            processQueue(null, newToken);
            refreshSuccess = true;

            // Retry lại request ban đầu với token mới
            const retryRes = await fetch(fetchParams.url, {
              ...fetchParams.options,
              headers: {
                ...fetchParams.options.headers,
                ...getHeaders()
              }
            });
            
            if (retryRes.ok) {
              if (retryRes.status === 204) return null;
              return await retryRes.json();
            }
            
            // Nếu retry vẫn lỗi (mà không phải 401), xử lý lỗi bên dưới
            if (retryRes.status !== 401) {
              const errorData = await retryRes.json().catch(() => ({}));
              const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
              throw new ApiError(translateErrorMessage(rawMessage), errorData.error?.code, errorData.error?.requestId);
            }
            
            // Nếu retry bị 401, rơi xuống logic clear token
          } else {
            processQueue(new Error('No new token provided'));
          }
        } else {
          processQueue(new Error('Refresh API returned error'));
        }
      } catch (e) {
        console.error('Refresh token failed', e);
        if (!refreshSuccess) processQueue(e as Error);
      } finally {
        isRefreshing = false;
      }
    }

    // Nếu logic refresh thất bại hoặc retry thất bại do 401
    clearAccessToken();
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/auth'; // Chuyển hướng về login
      // Return a pending promise so we don't throw and crash the UI during redirect
      return new Promise(() => {});
    }
    
    const errorData = await response.json().catch(() => ({}));
    const rawMessage = errorData.error?.message || errorData.message || 'Bạn cần đăng nhập để tiếp tục.';
    throw new ApiError(translateErrorMessage(rawMessage), errorData.error?.code || 'UNAUTHENTICATED', errorData.error?.requestId);
  }

  // Ném lỗi để UI xử lý (nếu không phải 401 hoặc isAuthEndpoint)
  const errorData = await response.json().catch(() => ({}));
  const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
  throw new ApiError(translateErrorMessage(rawMessage), errorData.error?.code, errorData.error?.requestId);
};

export const apiClient = {
  get: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const { headers: customHeaders, ...restOptions } = customOptions || {};
    const options: RequestInit = {
      method: 'GET',
      credentials: 'include',
      ...restOptions,
      headers: { ...getHeaders(), ...customHeaders },
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  post: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
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
    return handleResponse(response, { url, options });
  },

  patch: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
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
    return handleResponse(response, { url, options });
  },

  delete: async (endpoint: string, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
    const { headers: customHeaders, ...restOptions } = customOptions || {};
    const options: RequestInit = {
      method: 'DELETE',
      credentials: 'include',
      ...restOptions,
      headers: { ...getHeaders(), ...customHeaders },
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  put: async (endpoint: string, body?: unknown, customOptions?: RequestInit) => {
    const url = `${BASE_URL}${endpoint}`;
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
    return handleResponse(response, { url, options });
  },
};
