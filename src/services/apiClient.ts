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

  if (response.status === 401) {
    // Thử refresh token 1 lần
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Bắt buộc để gửi cookie chứa refresh token lên server
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          // Retry lại request ban đầu với token mới
          const newHeaders = getHeaders(fetchParams.options.method === 'POST');
          const retryRes = await fetch(fetchParams.url, {
            ...fetchParams.options,
            headers: newHeaders
          });
          
          if (retryRes.ok) {
            return retryRes.status === 204 ? null : await retryRes.json();
          }
        }
      }
    } catch (e) {
      console.error('Refresh token failed', e);
    }

    // Nếu refresh thất bại => Xóa token và redirect
    clearAccessToken();
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = '/auth'; // Chuyển hướng về login
    }
  }

  // Ném lỗi để UI xử lý
  const errorData = await response.json().catch(() => ({}));
  const rawMessage = errorData.error?.message || errorData.message || 'Có lỗi xảy ra từ máy chủ';
  throw new Error(translateErrorMessage(rawMessage));
};

export const apiClient = {
  get: async (endpoint: string) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'GET',
      headers: getHeaders(false),
      credentials: 'include',
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  post: async (endpoint: string, body?: unknown) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'POST',
      headers: getHeaders(true),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  },

  patch: async (endpoint: string, body?: unknown) => {
    const url = `${BASE_URL}${endpoint}`;
    const options: RequestInit = {
      method: 'PATCH',
      headers: getHeaders(false),
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, options);
    return handleResponse(response, { url, options });
  }
};
