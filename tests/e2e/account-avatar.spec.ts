import { expect, test } from '@playwright/test';

function token() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', userId: 'user-1', email: 'test@nexora.ai', exp: Math.floor(Date.now() / 1000) + 7200 })).toString('base64url');
  return `${header}.${payload}.mock`;
}

test('avatar validation, upload, header sync and removal preserve current user', async ({ page }) => {
  const initialUser = { id: 'user-1', email: 'test@nexora.ai', displayName: 'Test User', roles: ['Candidate'], billing: { entitlement: { planCode: 'free', limit: 3, consumed: 0, reserved: 0, available: 3, features: [] }, orders: [] }, yearsOfExperience: 2, avatarUrl: null };
  let avatarUrl: string | null = null;
  let uploadCount = 0;
  let deleteCount = 0;
  let failNextUpload = false;

  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = (data: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
    if (path.endsWith('/auth/refresh')) return json({ accessToken: token(), user: initialUser });
    if (path.endsWith('/me/avatar') && route.request().method() === 'PUT') {
      if (failNextUpload) {
        failNextUpload = false;
        return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'AVATAR_STORAGE_UNAVAILABLE', message: 'Không thể cập nhật ảnh.' } }) });
      }
      uploadCount++;
      expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=');
      avatarUrl = `/api/v1/avatars/${uploadCount === 1 ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222'}`;
      return json({ avatarUrl });
    }
    if (path.endsWith('/me/avatar') && route.request().method() === 'DELETE') {
      deleteCount++;
      avatarUrl = null;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith('/me')) return json({ ...initialUser, avatarUrl });
    if (path.endsWith('/me/career-profile')) return json({ profile: { displayName: 'Test User', avatarUrl }, onboarding: { isComplete: true } });
    if (path.includes('/avatars/')) return route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64') });
    if (path.endsWith('/me/feedback')) return json(null);
    return json({});
  });

  await page.goto('/account');
  const input = page.getByLabel('Chọn ảnh đại diện JPEG, PNG hoặc WebP');
  await expect(page.getByRole('button', { name: 'Tải ảnh lên' })).toBeVisible();
  await input.setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert').filter({ hasText: 'Chỉ hỗ trợ ảnh' })).toBeVisible();
  expect(uploadCount).toBe(0);

  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert').filter({ hasText: '2 MB' })).toBeVisible();
  expect(uploadCount).toBe(0);

  await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.getByRole('button', { name: 'Thay ảnh' })).toBeVisible();
  expect(uploadCount).toBe(1);
  await expect(page.getByRole('button', { name: 'Tài khoản' }).locator('img')).toBeVisible();
  await expect(page.locator('main')).toContainText('0 / 3 AI Credits');

  failNextUpload = true;
  await input.setInputFiles({ name: 'failed.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.getByRole('alert').filter({ hasText: 'Không thể cập nhật ảnh' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tài khoản' }).locator('img')).toHaveAttribute('src', /11111111-/);
  expect(uploadCount).toBe(1);

  await input.setInputFiles({ name: 'replacement.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.getByRole('button', { name: 'Tài khoản' }).locator('img')).toHaveAttribute('src', /22222222-/);
  expect(uploadCount).toBe(2);

  await page.getByRole('button', { name: 'Xóa ảnh' }).click();
  await expect(page.getByRole('button', { name: 'Tải ảnh lên' })).toBeVisible();
  expect(deleteCount).toBe(1);
  await expect(page.getByRole('button', { name: 'Tài khoản' }).locator('img')).toHaveCount(0);
  await expect(page.locator('main')).toContainText('0 / 3 AI Credits');

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('button', { name: 'Tải ảnh lên' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
  }
});
