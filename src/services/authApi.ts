import { apiClient } from './apiClient';
import { setAccessToken, clearAccessToken } from '../store/authStore';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

export const authApi = {
  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/auth/register', data);
    return response as AuthResponse;
  },

  login: async (data: LoginRequest) => {
    // Backend API trả về response bọc trong trường `data`
    // Nên kiểu trả về thực tế là { data: AuthResponse }
    const response = await apiClient.post('/auth/login', data) as { data?: AuthResponse };
    // Lưu Access Token vào memory ngay sau khi login thành công
    if (response && response.data && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Dù API có lỗi hay không thì vẫn xoá local memory token
      clearAccessToken();
    }
  },

  logoutAll: async () => {
    try {
      await apiClient.post('/auth/logout-all');
    } finally {
      clearAccessToken();
    }
  }
};
