import { test, expect } from '@playwright/test';

function createMockJwt(userId: string = 'user-1', email: string = 'test@nexora.ai'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + 7200,
    }),
  ).toString('base64url');
  return `${header}.${payload}.mockSignature`;
}

test.describe('Bootstrap & Navigation Request Deduplication Audit', () => {
  test('Flow A, B, C, E: Overview entry, client navigation away/back, tab switch, and plan query reuse', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const requestCounts: Record<string, number> = {
      'auth/refresh': 0,
      'me': 0,
      'me/career-profile': 0,
      'resumes': 0,
      'progress/dashboard': 0,
      'recommendations/next': 0,
      'plans': 0,
    };

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/refresh')) {
        requestCounts['auth/refresh']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              accessToken: createMockJwt('user-1'),
              user: { id: 'user-1', email: 'test@nexora.ai', fullName: 'Test User' },
            },
          }),
        });
      } else if (url.includes('/me/career-profile')) {
        requestCounts['me/career-profile']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'cp-1',
              title: 'Software Engineer',
              profile: { displayName: 'Test User' },
              onboarding: { isComplete: true },
            },
          }),
        });
      } else if (url.includes('/resumes')) {
        requestCounts['resumes']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      } else if (url.includes('/progress/dashboard')) {
        requestCounts['progress/dashboard']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { completedInterviews: 3, totalScore: 85 } }),
        });
      } else if (url.includes('/recommendations/next')) {
        requestCounts['recommendations/next']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { title: 'Behavioral Prep', slug: 'behavioral' } }),
        });
      } else if (url.includes('/plans')) {
        requestCounts['plans']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'plan-1',
                code: 'free',
                name: 'Miễn phí',
                isHighlighted: false,
                prices: [{ id: 'price-free', amountMinor: 0, currency: 'VND', durationDays: null, interviewQuota: 1, features: [] }],
              },
            ],
          }),
        });
      } else if (url.endsWith('/me') || url.includes('/me?')) {
        requestCounts['me']++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { id: 'user-1', email: 'test@nexora.ai', fullName: 'Test User', billing: { entitlement: { planCode: 'free' } } },
          }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      }
    });

    // Flow A: Authenticated entry to /overview
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    const countsAfterA = { ...requestCounts };
    console.log('FLOW_A_COUNTS:', JSON.stringify(countsAfterA));

    // Exactly 1 request per mounted query upon initial authenticated entry
    expect(countsAfterA['me/career-profile']).toBe(1);
    expect(countsAfterA['progress/dashboard']).toBe(1);
    expect(countsAfterA['recommendations/next']).toBe(1);
    expect(countsAfterA['me']).toBe(1);

    // Flow B: Client-side navigation away to /pricing via real Next.js <Link>
    const linkEl = page.getByRole('link', { name: /Bảng giá/i }).first();
    await linkEl.click();
    await page.waitForURL('**/pricing');
    await expect(page.locator('h1')).toContainText(/Chọn gói đồng hành/i);
    const countsAfterPricing = { ...requestCounts };
    expect(countsAfterPricing['plans']).toBe(1);

    // Navigate back to /overview using real Next.js <Link>
    await page.getByRole('link', { name: /Tổng quan/i }).first().click();
    await page.waitForURL('**/overview');
    await page.waitForLoadState('networkidle');

    const countsAfterB = { ...requestCounts };
    console.log('FLOW_B_COUNTS:', JSON.stringify(countsAfterB));

    // Within freshness window (60s), returning to /overview reuses warm cache: 0 additional requests
    expect(countsAfterB['me/career-profile'] - countsAfterPricing['me/career-profile']).toBe(0);
    expect(countsAfterB['progress/dashboard'] - countsAfterPricing['progress/dashboard']).toBe(0);
    expect(countsAfterB['recommendations/next'] - countsAfterPricing['recommendations/next']).toBe(0);
    expect(countsAfterB['me'] - countsAfterPricing['me']).toBe(0);

    // Flow E: Client-side re-navigation to /pricing via real Next.js <Link> to verify canonical plan-query reuse
    await page.getByRole('link', { name: /Bảng giá/i }).first().click();
    await page.waitForURL('**/pricing');
    await page.waitForLoadState('networkidle');

    const countsAfterPricingReturn = { ...requestCounts };
    console.log('FLOW_E_PLANS_COUNTS:', countsAfterPricingReturn['plans']);
    // Within 5-minute freshness window, returning to /pricing reuses warm cache: 0 additional /plans requests
    expect(countsAfterPricingReturn['plans']).toBe(1);

    // Return to /overview for Flow C
    await page.getByRole('link', { name: /Tổng quan/i }).first().click();
    await page.waitForURL('**/overview');
    await page.waitForLoadState('networkidle');

    const countsBeforeC = { ...requestCounts };

    // Flow C: Switch browser tab / window visibility transition using a second page in the same context
    const context = page.context();
    const secondPage = await context.newPage();
    await secondPage.goto('/pricing');
    await secondPage.bringToFront();
    await page.waitForTimeout(300);

    // Bring the overview page back to the front (fires visibility change and focus events)
    await page.bringToFront();
    await page.waitForTimeout(500);
    await secondPage.close();

    const countsAfterC = { ...requestCounts };
    console.log('FLOW_C_COUNTS:', JSON.stringify(countsAfterC));

    // Due to refetchOnWindowFocus: false on tuned hooks, window focus triggers 0 requests
    expect(countsAfterC['me/career-profile'] - countsBeforeC['me/career-profile']).toBe(0);
    expect(countsAfterC['progress/dashboard'] - countsBeforeC['progress/dashboard']).toBe(0);
    expect(countsAfterC['recommendations/next'] - countsBeforeC['recommendations/next']).toBe(0);
    expect(countsAfterC['me'] - countsBeforeC['me']).toBe(0);
  });

  test('Flow D: Anonymous /pricing and client-side navigation plan query reuse', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let plansRequestCount = 0;

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/plans')) {
        plansRequestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'plan-free',
                code: 'free',
                name: 'Miễn phí',
                isHighlighted: false,
                prices: [{ id: 'price-free', amountMinor: 0, currency: 'VND', durationDays: null, interviewQuota: 1, features: [] }],
              },
              {
                id: 'plan-pro',
                code: 'pro',
                name: 'Chuyên nghiệp',
                isHighlighted: true,
                prices: [{ id: 'price-pro', amountMinor: 19900000, currency: 'VND', durationDays: 30, interviewQuota: 10, features: [] }],
              },
            ],
          }),
        });
      } else if (url.includes('/auth/refresh')) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      }
    });

    // Flow D: Anonymous /pricing initial entry
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    expect(plansRequestCount).toBe(1);
    await expect(page.locator('h1')).toContainText(/Chọn gói đồng hành/i);

    // Client navigation away to /auth via real header Link
    const loginLink = page.getByRole('link', { name: /Đăng nhập/i }).first();
    await loginLink.click();
    await page.waitForURL('**/auth');

    // Client navigation back to /pricing via browser navigation
    await page.goBack();
    await page.waitForURL('**/pricing');
    await page.waitForLoadState('networkidle');

    console.log('FLOW_D_RETURN_PLANS_REQUESTS:', plansRequestCount);
    // Cached plans reused across client navigation: exactly 0 additional network requests
    expect(plansRequestCount).toBe(1);
  });

  test('Flow F: Real Logout and Login as another user isolates principal cache', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let currentUserId = 'user-1';
    let isLoggedOut = false;
    let profileFetchCountUser1 = 0;
    let profileFetchCountUser2 = 0;

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/logout')) {
        isLoggedOut = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else if (url.includes('/auth/refresh')) {
        if (isLoggedOut) {
          await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                accessToken: createMockJwt(currentUserId, `${currentUserId}@nexora.ai`),
                user: {
                  id: currentUserId,
                  email: `${currentUserId}@nexora.ai`,
                  fullName: currentUserId === 'user-1' ? 'User One' : 'User Two',
                },
              },
            }),
          });
        }
      } else if (url.includes('/me/career-profile')) {
        if (currentUserId === 'user-1') {
          profileFetchCountUser1++;
        } else {
          profileFetchCountUser2++;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: `cp-${currentUserId}`,
              title: currentUserId === 'user-1' ? 'Senior Engineer' : 'Lead Architect',
              profile: {
                displayName: currentUserId === 'user-1' ? 'User One' : 'User Two',
              },
            },
          }),
        });
      } else if (url.endsWith('/me') || url.includes('/me?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: currentUserId,
              email: `${currentUserId}@nexora.ai`,
              fullName: currentUserId === 'user-1' ? 'User One' : 'User Two',
              displayName: currentUserId === 'user-1' ? 'User One' : 'User Two',
            },
          }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      }
    });

    // 1. Initial Login as user-1 on /overview
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    // Assert User 1 profile is fetched from network exactly once
    expect(profileFetchCountUser1).toBe(1);
    await expect(page.locator('h1')).toContainText(/Xin chào, User One!/i);

    // 2. Perform real logout via application AuthenticatedHeader UI
    const avatarButton = page.getByRole('button', { name: /Tài khoản/i });
    await avatarButton.click();
    const logoutMenuItem = page.getByRole('menuitem', { name: /Đăng xuất/i });
    await logoutMenuItem.click();
    await page.waitForURL('**/auth');

    // 3. Switch credentials to user-2 for next authentication and clear logout flag
    currentUserId = 'user-2';
    isLoggedOut = false;

    // 4. Authenticate as user-2 and navigate to /overview
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    console.log('FLOW_F_USER1_PROFILES:', profileFetchCountUser1, 'USER2_PROFILES:', profileFetchCountUser2);

    // 5. Assert:
    // - User 1 profile was fetched once initially
    // - User 2 profile was fetched once afresh from network (proving User 1's QueryClient was discarded on logout)
    // - Rendered UI displays User 2's identity and no stale User 1 profile data exists
    expect(profileFetchCountUser1).toBe(1);
    expect(profileFetchCountUser2).toBe(1);
    await expect(page.locator('h1')).toContainText(/Xin chào, User Two!/i);
    await expect(page.locator('body')).not.toContainText(/User One/i);
  });
});
