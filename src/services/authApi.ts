import { apiClient } from './apiClient';
import {
  getPrincipalEpoch,
  invalidatePrincipal,
  isPrincipalEpochCurrent,
  setAccessToken,
} from '../store/authStore';
import {
  applyRefreshSessionResponse,
  AuthRefreshError,
  refreshSession,
} from './authSession';
import { logoutAllSessions, logoutCurrentSession } from './sessionActions';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegistrationResponse,
  VerifyEmailRequest,
  EmailVerificationResponse,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MessageResponse,
} from '../types/auth';

export const authApi = {
  register: async (data: RegisterRequest) => {
    // Backend returns { data: { email: string, verificationRequired: boolean } }
    const response = (await apiClient.post('/auth/register', data)) as {
      data: RegistrationResponse;
    };
    return response;
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    // Backend returns { data: { email: string, alreadyVerified: boolean } }
    const response = (await apiClient.post('/auth/verify-email', data)) as {
      data: EmailVerificationResponse;
    };
    return response;
  },

  resendVerification: async (data: ResendVerificationRequest) => {
    // Backend returns { data: { message: string } }
    const response = (await apiClient.post('/auth/resend-verification', data)) as {
      data: MessageResponse;
    };
    return response;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    // Backend returns { data: { message: string } }
    const response = (await apiClient.post('/auth/forgot-password', data)) as {
      data: MessageResponse;
    };
    return response;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    // Backend returns { data: { message: string } }
    const response = (await apiClient.post('/auth/reset-password', data)) as {
      data: MessageResponse;
    };
    return response;
  },

  login: async (data: LoginRequest) => {
    // Backend returns { data: AuthSessionResponse }
    const response = (await apiClient.post('/auth/login', data)) as {
      data?: AuthResponse;
    };
    // Save Access Token in memory immediately upon successful login
    if (response && response.data && response.data.accessToken) {
      setAccessToken(response.data.accessToken, {
        principalId: response.data.user?.id,
      });
    }
    return response;
  },

  refresh: async () => {
    const requestEpoch = getPrincipalEpoch();
    try {
      const response = await refreshSession();
      applyRefreshSessionResponse(response, requestEpoch);
      return response;
    } catch (error: unknown) {
      if (
        error instanceof AuthRefreshError
        && error.status === 401
        && isPrincipalEpochCurrent(error.principalEpoch)
      ) {
        invalidatePrincipal(error.principalEpoch);
      }
      throw error;
    }
  },

  logout: logoutCurrentSession,

  logoutAll: logoutAllSessions,
};
