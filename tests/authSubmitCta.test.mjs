import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const authTsxPath = path.resolve('src/components/features/auth/Auth.tsx');
const authModuleCssPath = path.resolve('src/components/features/auth/Auth.module.css');
const buttonTsxPath = path.resolve('src/components/ui/Button/Button.tsx');

test('Auth CTA: Button component explicitly handles type prop and passes it to DOM button', () => {
  const buttonSource = fs.readFileSync(buttonTsxPath, 'utf8');
  assert.ok(buttonSource.includes("type = 'button'"), 'Button must destructure type prop with default button');
  assert.ok(buttonSource.includes('type={type}'), 'Button must assign type={type} to native button element');
  assert.ok(buttonSource.includes("fullWidth ? 'w-full' : ''"), 'Button must support fullWidth boolean prop');
});

test('Auth CTA: Auth.tsx renders submit Button with type="submit" and fullWidth', () => {
  const authSource = fs.readFileSync(authTsxPath, 'utf8');
  assert.ok(authSource.includes('type="submit"'), 'Auth form must render Button with type="submit"');
  assert.ok(authSource.includes('fullWidth'), 'Auth submit Button must have fullWidth prop');
  assert.ok(authSource.includes('isLoading={isSubmitting}'), 'Auth submit Button must bind isLoading={isSubmitting}');
  assert.ok(
    authSource.includes("isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản'"),
    'Auth submit Button text must be "Đăng nhập ngay" for login and "Tạo tài khoản" for register'
  );
});

test('Auth CTA: GSAP animations use fromTo and clearProps to prevent stuck opacity 0', () => {
  const authSource = fs.readFileSync(authTsxPath, 'utf8');
  assert.ok(
    authSource.includes("clearProps: 'opacity,transform'"),
    'GSAP animations must include clearProps to eliminate inline opacity/transform locks'
  );
  assert.ok(
    !authSource.includes('gsap.from(elements,'),
    'Auth must avoid un-reverted gsap.from on form elements which can lock elements at opacity 0'
  );
});

test('Auth CTA: Auth.module.css provides submitButton styling with 100% width and adequate height', () => {
  const css = fs.readFileSync(authModuleCssPath, 'utf8');
  assert.ok(css.includes('.submitButton'), 'Auth.module.css must include .submitButton class');
  assert.ok(css.includes('width: 100%'), '.submitButton must specify width: 100%');
  assert.ok(css.includes('min-height: 44px'), '.submitButton must provide comfortable touch/click target');
});
