import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isValidInternalPath, ALLOWED_PATH_PREFIXES } from '../src/utils/authIntent.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Quản trị hệ thống button is removed from AuthenticatedHeader avatar dropdown', () => {
  const headerSource = read('src/components/header/AuthenticatedHeader.tsx');
  assert.doesNotMatch(headerSource, /Quản trị hệ thống/);
  assert.doesNotMatch(headerSource, /admin_panel_settings/);
  assert.doesNotMatch(headerSource, /router\.push\(['"]\/admin['"]\)/);
});

test('AuthenticatedHeader preserves role badge display for admin users', () => {
  const headerSource = read('src/components/header/AuthenticatedHeader.tsx');
  assert.match(headerSource, /isAdmin\s*&&\s*\(/);
  assert.match(headerSource, /Admin/);
});

test('admin route prefix is whitelisted for safe internal authentication redirection', () => {
  assert.ok(ALLOWED_PATH_PREFIXES.includes('/admin'));
  assert.equal(isValidInternalPath('/admin'), true);
  assert.equal(isValidInternalPath('/admin/users'), true);
  assert.equal(isValidInternalPath('/admin/transactions'), true);
  assert.equal(isValidInternalPath('/admin/plans'), true);
  assert.equal(isValidInternalPath('/admin/scenarios'), true);
});

test('admin routes are guarded by RequireAuth and RequireAdmin', () => {
  const layoutSource = read('src/app/(admin)/layout.tsx');
  assert.match(layoutSource, /<RequireAuth>/);
  assert.match(layoutSource, /<RequireAdmin>/);
  assert.match(layoutSource, /<AdminLayout>/);
});

test('RequireAdmin component authorizes admin role and presents dedicated error page for other users', () => {
  const guardSource = read('src/components/providers/RequireAdmin.tsx');

  // Authorizes admin role (case-insensitive)
  assert.match(guardSource, /userQuery\.data\?\.roles\.some\(\(role\)\s*=>\s*role\.toLowerCase\(\)\s*===\s*['"]admin['"]\)/);

  // Denies non-admins and presents dedicated error page
  assert.match(guardSource, /if\s*\(userQuery\.isError\s*\|\|\s*!isAdmin\)/);
  assert.match(guardSource, /Không có quyền truy cập/);
  assert.match(guardSource, /Khu vực này chỉ dành cho quản trị viên Nexora\./);
  assert.match(guardSource, /href=['"]\/overview['"]/);
  assert.match(guardSource, /Về ứng dụng/);
  assert.match(guardSource, /role=['"]alert['"]/);
});
