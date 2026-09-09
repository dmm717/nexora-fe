export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  email: string;
  password?: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface RegistrationResponse {
  email: string;
  verificationRequired: boolean;
}

export interface VerifyEmailRequest {
  userId: string;
  token: string;
}

export interface EmailVerificationResponse {
  email: string;
  alreadyVerified: boolean;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  userId: string;
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export type PasswordRecoveryResponse = MessageResponse;
