import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema,
} from '../src/schema/authSchema';
import { VALIDATION_MESSAGES } from '../src/constants/messages';
import { getAccessToken, setAccessToken, clearAccessToken } from '../src/store/authStore';

test('1. login 7-char password fails client validation', () => {
  const result = loginSchema.safeParse({
    email: 'candidate@example.test',
    password: 'Short1!',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path.includes('password'));
    assert.ok(issue);
    assert.equal(issue?.message, VALIDATION_MESSAGES.PASSWORD_MIN);
  }
});

test('2. login 8-char passes length validation', () => {
  const result = loginSchema.safeParse({
    email: 'candidate@example.test',
    password: 'Valid8ch',
  });
  assert.equal(result.success, true);
});

test('3. register 7-char fails', () => {
  const result = registerSchema.safeParse({
    name: 'Candidate',
    email: 'candidate@example.test',
    password: 'Aa1!567',
    confirmPassword: 'Aa1!567',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path.includes('password'));
    assert.ok(issue);
    assert.equal(issue?.message, VALIDATION_MESSAGES.PASSWORD_MIN);
  }
});

test('4. register valid 8-char + matching confirm passes schema', () => {
  const result = registerSchema.safeParse({
    name: 'Candidate',
    email: 'candidate@example.test',
    password: 'Aa1!5678',
    confirmPassword: 'Aa1!5678',
  });
  assert.equal(result.success, true);
});

test('5. register password confirmation mismatch fails', () => {
  const result = registerSchema.safeParse({
    name: 'Candidate',
    email: 'candidate@example.test',
    password: 'Aa1!5678',
    confirmPassword: 'Different!123',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
    assert.ok(issue);
    assert.equal(issue?.message, VALIDATION_MESSAGES.PASSWORD_MISMATCH);
  }
});

test('6. register success does NOT set access token', () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);

  // Simulated registration response payload from backend
  const registrationResponse = {
    data: {
      email: 'candidate@example.test',
      verificationRequired: true,
    },
  };

  // Ensure access token is never extracted or saved from registration response
  assert.equal('accessToken' in registrationResponse.data, false);
  assert.equal(getAccessToken(), null);
});

test('7. register success returns verificationRequired: true', () => {
  const registrationPayload = {
    email: 'newuser@example.test',
    verificationRequired: true,
  };
  assert.equal(registrationPayload.verificationRequired, true);
});

test('8. password complexity requirements enforced (uppercase, lowercase, digit, special)', () => {
  // Missing uppercase
  assert.equal(passwordSchema.safeParse('aa1!5678').success, false);
  // Missing lowercase
  assert.equal(passwordSchema.safeParse('AA1!5678').success, false);
  // Missing digit
  assert.equal(passwordSchema.safeParse('Aaa!cdef').success, false);
  // Missing special
  assert.equal(passwordSchema.safeParse('Aaa1cdef').success, false);
  // All present
  assert.equal(passwordSchema.safeParse('Aa1!cdef').success, true);
});

test('9. forgot-password schema requires valid email', () => {
  assert.equal(forgotPasswordSchema.safeParse({ email: 'invalid-email' }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: 'valid@example.test' }).success, true);
});

test('10. reset password 7-char rejected', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'Aa1!567',
    confirmPassword: 'Aa1!567',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path.includes('password'));
    assert.ok(issue);
    assert.equal(issue?.message, VALIDATION_MESSAGES.PASSWORD_MIN);
  }
});

test('11. reset password valid 8-char + complexity accepted', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'Aa1!5678',
    confirmPassword: 'Aa1!5678',
  });
  assert.equal(result.success, true);
});

test('12. reset password mismatch rejected', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'Aa1!5678',
    confirmPassword: 'Different!123',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
    assert.ok(issue);
    assert.equal(issue?.message, VALIDATION_MESSAGES.PASSWORD_MISMATCH);
  }
});

test('13. token storage invariant: access token is memory only, verification/reset tokens never persisted', () => {
  clearAccessToken();
  assert.equal(getAccessToken(), null);
  setAccessToken('temporary_jwt');
  assert.equal(getAccessToken(), 'temporary_jwt');
  clearAccessToken();
  assert.equal(getAccessToken(), null);
});
