import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/messages';

export const loginSchema = z.object({
  email: z.string().min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED).email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, VALIDATION_MESSAGES.NAME_MIN),
  email: z.string().min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED).email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(6, VALIDATION_MESSAGES.PASSWORD_MIN),
  confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
}).refine((data) => data.password === data.confirmPassword, {
  message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
