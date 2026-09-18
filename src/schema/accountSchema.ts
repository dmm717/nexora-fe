import { z } from 'zod';

export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu hiện tại')
      .max(128, 'Mật khẩu hiện tại không được vượt quá 128 ký tự'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
      .max(128, 'Mật khẩu mới không được vượt quá 128 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = passwordSchema;

export type PasswordFormValues = z.infer<typeof passwordSchema>;

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự')
    .max(120, 'Tên hiển thị quá dài')
    .trim(),
  yearsOfExperience: z
    .any()
    .transform((v) => {
      if (v === '' || v === null || v === undefined) return '';
      const num = Number(v);
      return isNaN(num) ? v : num;
    })
    .pipe(
      z.union([
        z.number().int('Phải là số nguyên').min(0, 'Ít nhất 0 năm').max(60, 'Tối đa 60 năm'),
        z.literal(''),
      ])
    )
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Resolves years of experience for profile update.
 * Since backend ignores null for yearsOfExperience, blank input must leave existing value unchanged
 * rather than sending null and pretending to clear a previously stored value.
 *
 * @param input - The raw form input value
 * @param existingYears - The existing user.yearsOfExperience value
 */
export function resolveYearsOfExperience(
  input: string | number | null | undefined,
  existingYears: number | null | undefined
): number | null {
  if (input === '' || input === null || input === undefined) {
    return existingYears ?? null;
  }
  return Number(input);
}
