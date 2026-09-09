import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../constants/messages';

export const passwordComplexityRegex = {
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasDigit: /[0-9]/,
  hasSpecial: /[^a-zA-Z0-9]/,
};

export const passwordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.PASSWORD_MIN)
  .max(128, VALIDATION_MESSAGES.PASSWORD_MAX)
  .refine(
    (val) => passwordComplexityRegex.hasUppercase.test(val),
    { message: VALIDATION_MESSAGES.PASSWORD_REQUIRES_UPPERCASE }
  )
  .refine(
    (val) => passwordComplexityRegex.hasLowercase.test(val),
    { message: VALIDATION_MESSAGES.PASSWORD_REQUIRES_LOWERCASE }
  )
  .refine(
    (val) => passwordComplexityRegex.hasDigit.test(val),
    { message: VALIDATION_MESSAGES.PASSWORD_REQUIRES_DIGIT }
  )
  .refine(
    (val) => passwordComplexityRegex.hasSpecial.test(val),
    { message: VALIDATION_MESSAGES.PASSWORD_REQUIRES_SPECIAL }
  );

export const loginSchema = z.object({
  email: z.string().min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED).email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(8, VALIDATION_MESSAGES.PASSWORD_MIN),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, VALIDATION_MESSAGES.NAME_MIN),
    email: z.string().min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED).email(VALIDATION_MESSAGES.EMAIL_INVALID),
    password: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED).email(VALIDATION_MESSAGES.EMAIL_INVALID),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_CONFIRM_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
