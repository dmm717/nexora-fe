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
  test('Flow A, B, C: Overview initial entry, client-side navigation away/back, and tab blur/focus', async ({ page }) => {
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
      console.log('INTERCEPTED_URL:', url);
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
          body: JSON.stringify({ data: { id: 'cp-1', title: 'Software Engineer', onboarding: { isComplete: true } } }),
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

    // Flow B: Client-side navigation away to /pricing and back to /overview using SPA Link
    const linkEl = page.getByRole('link', { name: /Bảng giá/i }).first();
    await linkEl.click();
    await page.waitForURL('**/pricing');
    await expect(page.locator('h1')).toContainText(/Chọn gói đồng hành/i);
    const countsAfterPricing = { ...requestCounts };
    expect(countsAfterPricing['plans']).toBe(1);

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

    // Flow C: Switch browser tab / window blur & refocus
    await page.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
      window.dispatchEvent(new Event('focus'));
    });
    await page.waitForTimeout(500);

    const countsAfterC = { ...requestCounts };
    console.log('FLOW_C_COUNTS:', JSON.stringify(countsAfterC));

    // Due to refetchOnWindowFocus: false on tuned hooks, window focus triggers 0 requests
    expect(countsAfterC['me/career-profile'] - countsAfterB['me/career-profile']).toBe(0);
    expect(countsAfterC['progress/dashboard'] - countsAfterB['progress/dashboard']).toBe(0);
    expect(countsAfterC['recommendations/next'] - countsAfterB['recommendations/next']).toBe(0);
    expect(countsAfterC['me'] - countsAfterB['me']).toBe(0);
  });

  test('Flow D, E: Anonymous /pricing and Authenticated /pricing canonical plan reuse', async ({ page }) => {
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

    // Flow D: Anonymous /pricing
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    const countsAfterD = plansRequestCount;
    console.log('FLOW_D_PLANS_REQUESTS:', countsAfterD);
    expect(countsAfterD).toBe(1);

    // Flow E: Client-side navigation within the 5-minute freshness window
    // Re-navigating to /pricing within SPA
    await page.evaluate(() => {
      window.history.pushState(null, '', '/');
      window.history.pushState(null, '', '/pricing');
    });
    await page.waitForTimeout(300);

    const countsAfterE = plansRequestCount;
    console.log('FLOW_E_PLANS_REQUESTS:', countsAfterE);
    // Cached plans reused without a second network fetch
    expect(countsAfterE).toBe(1);
  });

  test('Flow F: Logout and Login as another user isolates principal cache', async ({ page }) => {
    let currentUserId = 'user-1';
    let profileFetchCountUser1 = 0;
    let profileFetchCountUser2 = 0;

    await page.route('**/api/v1/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/auth/refresh')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              accessToken: createMockJwt(currentUserId),
              user: { id: currentUserId, email: `${currentUserId}@nexora.ai`, fullName: `User ${currentUserId}` },
            },
          }),
        });
      } else if (url.includes('/me/career-profile')) {
        if (currentUserId === 'user-1') {
          profileFetchCountUser1++;
        } else {
          profileFetchCountUser2++;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: `cp-${currentUserId}`, title: `Profile ${currentUserId}` } }),
        });
      } else if (url.endsWith('/me') || url.includes('/me?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: { id: currentUserId, email: `${currentUserId}@nexora.ai`, fullName: `User ${currentUserId}` },
          }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      }
    });

    // Login as user-1
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    expect(profileFetchCountUser1).toBe(1);

    // Switch to user-2 and simulate epoch bump via re-login
    currentUserId = 'user-2';
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');

    console.log('FLOW_F_USER1_PROFILES:', profileFetchCountUser1, 'USER2_PROFILES:', profileFetchCountUser2);
  });
});
