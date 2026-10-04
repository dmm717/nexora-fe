import { expect, test, type Page } from '@playwright/test';

const fakeToken = 'test-only-verification-token-never-real';
const acceptedMessage = 'Nếu email này được liên kết với một tài khoản Nexora hợp lệ, chúng tôi sẽ gửi hướng dẫn xác minh yêu cầu xóa tài khoản đến hộp thư của bạn.';
const status = { id: 'test-deletion-id', status: 'queued', requestedAt: '2026-10-04T10:00:00Z', completedAt: null };

async function isolate(page: Page) {
  // Catch every backend call: these tests can never delete a real account.
  await page.route('**/api/v1/**', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
}

test.beforeEach(async ({ page }) => { await isolate(page); });

test('public email validation, keyboard submit, duplicate protection and generic accepted UI', async ({ page }) => {
  const calls: unknown[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/account-deletion/external/request', async route => {
    calls.push(route.request().postDataJSON());
    expect(route.request().headers().authorization).toBeUndefined();
    expect(route.request().headers().cookie).toBeUndefined();
    await gate;
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: { message: 'do not display account-specific message' } }) });
  });
  const authRequests: string[] = [];
  page.on('request', req => { if (req.url().includes('/auth/')) authRequests.push(req.url()); });
  await page.goto('/account-deletion');
  await page.getByRole('button', { name: 'Gửi hướng dẫn xác minh' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Nhập địa chỉ email hợp lệ');
  expect(calls).toHaveLength(0);
  await page.getByLabel('Email tài khoản Nexora').fill('qb@example.test');
  await page.getByLabel('Email tài khoản Nexora').press('Enter');
  await expect(page.getByRole('button', { name: /Đang gửi yêu cầu/ })).toBeDisabled();
  await page.getByRole('form', { name: 'Yêu cầu xóa tài khoản' }).evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect.poll(() => calls.length).toBe(1);
  release();
  await expect(page.getByRole('main').getByRole('status')).toHaveText(acceptedMessage);
  await expect(page.getByText('do not display account-specific message')).toHaveCount(0);
  expect(calls).toEqual([{ email: 'qb@example.test' }]);
  expect(authRequests).toEqual([]);
  await expect(page).toHaveURL(/\/account-deletion$/);
});

for (const [code, message] of [[429, 'Bạn đã gửi nhiều yêu cầu'], [503, 'Yêu cầu có thể đã được tiếp nhận'], [401, 'Dịch vụ hiện chưa khả dụng']] as const) {
  test(`request ${code} stays public, sanitized and never retries`, async ({ page }) => {
    let calls = 0;
    await page.route('**/account-deletion/external/request', route => {
      calls++;
      return route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify({ error: { message: 'private backend detail' } }) });
    });
    await page.goto('/account-deletion');
    await page.getByLabel('Email tài khoản Nexora').fill('qb@example.test');
    await page.getByRole('button', { name: 'Gửi hướng dẫn xác minh' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(message);
    expect(calls).toBe(1);
    await expect(page).toHaveURL(/\/account-deletion$/);
    await expect(page.getByText('private backend detail')).toHaveCount(0);
  });
}

test('request network failure announces uncertainty', async ({ page }) => {
  await page.route('**/account-deletion/external/request', route => route.abort('failed'));
  await page.goto('/account-deletion');
  await page.getByLabel('Email tài khoản Nexora').fill('qb@example.test');
  await page.getByRole('button', { name: 'Gửi hướng dẫn xác minh' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Yêu cầu có thể đã được tiếp nhận');
});

test('missing token and duplicate token query offer safe request navigation, no POST', async ({ page }) => {
  let posts = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; });
  await page.goto('/account-deletion/confirm');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Thiếu liên kết');
  await expect(page.getByRole('button', { name: /Xác nhận yêu cầu xóa/ })).toHaveCount(0);
  await page.goto(`/account-deletion/confirm?token=${fakeToken}&token=another-test-token`);
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Thiếu liên kết');
  await page.getByRole('link', { name: 'Yêu cầu email xác minh mới' }).click();
  await expect(page).toHaveURL(/\/account-deletion$/);
  expect(posts).toBe(0);
});

test('explicit confirmation only, single POST, token scrubbed and no credential/referrer/tracking leaks', async ({ page, context }) => {
  await context.addCookies([{ name: 'test-session', value: 'private', url: 'http://localhost:3000' }]);
  const logs: string[] = [];
  const externalRequests: string[] = [];
  const calls: unknown[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  page.on('console', msg => logs.push(msg.text()));
  page.on('pageerror', error => logs.push(error.message));
  page.on('request', req => {
    if (/google|sentry|analytics/i.test(new URL(req.url()).hostname)) externalRequests.push(req.url());
  });
  await page.route('**/account-deletion/external/confirm', async route => {
    calls.push(route.request().postDataJSON());
    const headers = route.request().headers();
    expect(headers.authorization).toBeUndefined(); expect(headers.cookie).toBeUndefined(); expect(headers.referer).toBeUndefined();
    await gate;
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: status }) });
  });
  const response = await page.goto(`/account-deletion/confirm?token=${fakeToken}`);
  expect(response?.headers()['referrer-policy']).toBe('no-referrer');
  expect(response?.headers()['x-robots-tag']).toContain('noindex');
  await expect(page).toHaveURL(/\/account-deletion\/confirm$/);
  await expect(page.getByRole('button', { name: 'Xác nhận yêu cầu xóa tài khoản', exact: true })).toBeEnabled();
  expect(calls).toHaveLength(0);
  expect(await page.locator('body').innerText()).not.toContain(fakeToken);
  await expect.poll(() => page.evaluate(() => JSON.stringify(history.state))).not.toContain(fakeToken);
  expect(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookies: document.cookie }))).not.toContain(fakeToken);
  await page.getByRole('button', { name: 'Xác nhận yêu cầu xóa tài khoản', exact: true }).click();
  await expect(page.getByRole('button', { name: /Đang xác nhận/ })).toBeDisabled();
  await expect.poll(() => calls.length).toBe(1);
  release();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Nexora đã tiếp nhận');
  await expect(page.getByText('Đã tiếp nhận', { exact: true })).toBeVisible();
  expect(calls).toEqual([{ token: fakeToken }]);
  expect(logs.join('\n')).not.toContain(fakeToken);
  expect(externalRequests).toEqual([]);
  expect(logs.filter(line => /hydration|uncaught/i.test(line))).toEqual([]);
  await page.reload();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Thiếu liên kết');
  expect(calls).toHaveLength(1);
});

for (const reason of ['invalid', 'expired', 'replayed']) {
  test(`${reason} token follows the backend's shared invalid-link contract`, async ({ page }) => {
    await page.route('**/account-deletion/external/confirm', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { code: 'DELETION_VERIFICATION_INVALID', message: fakeToken } }) }));
    await page.goto(`/account-deletion/confirm?token=${fakeToken}`);
    await page.getByRole('button', { name: 'Xác nhận yêu cầu xóa tài khoản', exact: true }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('không hợp lệ, đã hết hạn hoặc đã được sử dụng');
    await expect(page.getByRole('button', { name: /Thử xác nhận/ })).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain(fakeToken);
    await page.getByRole('link', { name: 'Yêu cầu email xác minh mới' }).click();
    await expect(page).toHaveURL(/\/account-deletion$/);
  });
}

test('confirmation network failure is uncertain and a second POST requires another click', async ({ page }) => {
  let calls = 0;
  await page.route('**/account-deletion/external/confirm', route => { calls++; return route.abort('failed'); });
  await page.goto(`/account-deletion/confirm?token=${fakeToken}`);
  await page.getByRole('button', { name: 'Xác nhận yêu cầu xóa tài khoản', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Yêu cầu có thể đã được tiếp nhận');
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'Thử xác nhận lại' }).click();
  await expect.poll(() => calls).toBe(2);
});

for (const state of ['queued', 'processing', 'completed', 'failed'] as const) {
  test(`confirmation shows server-confirmed ${state} state without promising completion`, async ({ page }) => {
    await page.route('**/account-deletion/external/confirm', route => route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ data: { ...status, status: state, completedAt: state === 'completed' ? '2026-10-04T10:01:00Z' : null } }) }));
    await page.goto(`/account-deletion/confirm?token=${fakeToken}`);
    await page.getByRole('button', { name: 'Xác nhận yêu cầu xóa tài khoản', exact: true }).click();
    await expect(page.getByRole('main').getByRole('status')).toContainText(state === 'completed' ? 'đã hoàn tất' : state === 'failed' ? 'chưa thành công' : 'không đồng nghĩa');
    await expect(page.getByRole('button', { name: /Xác nhận yêu cầu xóa/ })).toHaveCount(0);
  });
}

test('without JavaScript both routes retain readable guidance and never confirm deletion', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await isolate(page);
  let posts = 0;
  page.on('request', request => { if (request.method() === 'POST') posts++; });
  try {
    await page.goto('/account-deletion');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Biểu mẫu cần JavaScript để gửi yêu cầu/)).toBeVisible();
    await page.goto('/account-deletion/confirm');
    await expect(page.getByText(/Chỉ mở trang này không gửi yêu cầu xóa tài khoản/)).toBeVisible();
    expect(posts).toBe(0);
  } finally { await context.close(); }
});

test('authenticated Settings deletion still uses the original endpoint and logout flow', async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ sub: 'test-user', userId: 'test-user', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const jwt = `${Buffer.from('{}').toString('base64url')}.${payload}.test`;
  const user = { id: 'test-user', email: 'qb@example.test', displayName: 'Test User', roles: ['Candidate'], yearsOfExperience: 2, billing: { orders: [], entitlement: null } };
  let deletionCalls = 0;
  let logoutCalls = 0;
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    const json = (data: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
    if (path.endsWith('/auth/refresh')) return json({ accessToken: jwt, user });
    if (path.endsWith('/me/deletion-requests')) { deletionCalls++; return json({ ...status, attempts: 0 }); }
    if (path.endsWith('/auth/logout')) { logoutCalls++; return json(null); }
    if (path.endsWith('/me')) return json(user);
    if (path.endsWith('/me/career-profile')) return json({ profile: user, primaryResume: null, onboarding: {}, skillProfileSummary: {} });
    if (path.endsWith('/me/feedback')) return json(null);
    return json([]);
  });
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Yêu cầu xóa tài khoản', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  expect(deletionCalls).toBe(0);
  await modal.getByRole('button', { name: 'Xác nhận yêu cầu xóa', exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
  expect(deletionCalls).toBe(1);
  expect(logoutCalls).toBe(1);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`public layouts and focus at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/account-deletion', '/account-deletion/confirm']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('A');
      await expect(page.getByRole('link', { name: 'Chính sách bảo mật', exact: true })).toBeVisible();
    }
  });
}
