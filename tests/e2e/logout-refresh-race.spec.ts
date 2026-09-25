import { test, expect } from '@playwright/test';

function createMockJwt(userId: string = 'user-1', email: string = 'candidate@nexora.ai'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 7200,
    })
  ).toString('base64url');
  return `${header}.${payload}.mockSignature`;
}

const mockUser = {
  id: 'user-1',
  email: 'candidate@nexora.ai',
  displayName: 'Nguyễn Văn Test',
  roles: ['Candidate'],
  billing: {
    entitlement: { planCode: 'free', limit: 3, consumed: 0, reserved: 0, available: 3, features: [] },
    orders: [],
  },
  yearsOfExperience: 2,
  avatarUrl: null,
};

test.describe('Logout & In-Flight Refresh Race Hardening E2E', () => {
  test('logout barrier prevents session restoration when refresh returns 200 during or after logout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    let isUserExplicitlyLoggedOut = false;
    const logoutResolver: { resolve?: () => void } = {};
    let authenticatedRequestsAfterLogout = 0;

    await page.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();
      const authHeader = route.request().headers()['authorization'];

      // Track if any authenticated request leaks after logout begins
      if (isUserExplicitlyLoggedOut && authHeader) {
        authenticatedRequestsAfterLogout++;
      }

      const json = (data: unknown, status = 200) =>
        route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ data }),
        });

      // 1. Initial auth refresh (when page first boots)
      if (path.endsWith('/auth/refresh')) {
        // PRODUCTION RACE REPRODUCTION:
        // Even after logout begins, the mock server intentionally returns 200 with a new token
        // to verify that the frontend client NEVER applies or resurrects this token.
        return json({
          accessToken: createMockJwt('resurrected-principal'),
          user: mockUser,
        });
      }

      // 2. Server logout endpoint
      if (path.endsWith('/auth/logout')) {
        isUserExplicitlyLoggedOut = true;
        // Intentionally hold the server logout in flight briefly to simulate network/server latency
        await new Promise<void>((resolve) => {
          logoutResolver.resolve = resolve;
          setTimeout(resolve, 300);
        });
        return route.fulfill({ status: 204 });
      }

      // 3. User profile endpoints
      if (path.endsWith('/me/career-profile')) {
        return json({
          profile: { displayName: 'Nguyễn Văn Test', avatarUrl: null },
          onboarding: { isComplete: true },
        });
      }

      if (path.endsWith('/me')) {
        return json(mockUser);
      }

      if (path.endsWith('/resumes')) {
        return json([]);
      }

      if (path.endsWith('/career-goals')) {
        return json([]);
      }

      if (path.endsWith('/auth/login') && method === 'POST') {
        isUserExplicitlyLoggedOut = false;
        return json({
          accessToken: createMockJwt('user-logged-in-again'),
          user: mockUser,
        });
      }

      return json({});
    });

    // 1. Authenticated user starts on /overview
    await page.goto('/overview');
    await expect(page.getByRole('button', { name: 'Tài khoản' })).toBeVisible();

    // 2. User clicks real "Đăng xuất" in AuthenticatedHeader
    await page.getByRole('button', { name: 'Tài khoản' }).click();
    const logoutItem = page.getByRole('menuitem', { name: 'Đăng xuất' });
    await expect(logoutItem).toBeVisible();

    // 3. Click logout (server request will be held and concurrent refresh returns 200)
    await logoutItem.click();

    // Ensure the held server logout resolves
    logoutResolver.resolve?.();

    // 4. Client finishes logout and lands on /auth
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();

    // 5. User attempts to navigate directly to protected route /interviews/new
    await page.goto('/interviews/new');

    // 6. Expected:
    // - Refresh result must NOT resurrect local principal
    // - Protected interview wizard preflight must NOT render
    // - Browser lands on /auth?returnTo=%2Finterviews%2Fnew
    await expect(page).toHaveURL(/\/auth\?returnTo=%2Finterviews%2Fnew/);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tài khoản' })).not.toBeVisible();
    expect(authenticatedRequestsAfterLogout).toBe(0);

    // 7. Verify hard navigation to other protected routes also preserves safe returnTo
    await page.goto('/overview');
    await expect(page).toHaveURL(/\/auth\?returnTo=%2Foverview/);

    await page.goto('/account');
    await expect(page).toHaveURL(/\/auth\?returnTo=%2Faccount/);

    await page.goto('/practice');
    await expect(page).toHaveURL(/\/auth\?returnTo=%2Fpractice/);

    // 8. Explicit successful login clears/re-arms the barrier and follows returnTo
    await page.goto('/auth?returnTo=%2Finterviews%2Fnew');
    await page.getByLabel('Email').fill('candidate@nexora.ai');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('Password123@');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // User is successfully redirected back to /interviews/new as authenticated user
    await expect(page).toHaveURL(/\/interviews\/new/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Chuẩn bị vào phòng phỏng vấn Nexora AI' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thoát phiên luyện' })).toBeVisible();
  });

  test('normal non-logout page reload preserves valid session', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/**', async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const json = (data: unknown) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data }),
        });

      if (path.endsWith('/auth/refresh')) {
        return json({
          accessToken: createMockJwt('normal-session-token'),
          user: mockUser,
        });
      }
      if (path.endsWith('/me/career-profile')) {
        return json({
          profile: { displayName: 'Nguyễn Văn Test', avatarUrl: null },
          onboarding: { isComplete: true },
        });
      }
      if (path.endsWith('/me')) {
        return json(mockUser);
      }
      return json({});
    });

    // 1. Load /overview
    await page.goto('/overview');
    await expect(page.getByRole('button', { name: 'Tài khoản' })).toBeVisible();

    // 2. Regular page reload (NOT logout)
    await page.reload();

    // 3. User remains authenticated on /overview
    await expect(page).toHaveURL(/\/overview/);
    await expect(page.getByRole('button', { name: 'Tài khoản' })).toBeVisible();
  });
});
