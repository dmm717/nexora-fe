import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1664, height: 936 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const [path, heading] of [
      ['/about', /Tự tin bước vào phỏng vấn|Giới thiệu Nexora/],
      ['/terms', /Điều khoản dịch vụ/],
      ['/privacy', /Chính sách bảo mật/],
    ] as const) {
      test(`${path} keeps content readable without horizontal overflow`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
        await expect(page.getByRole('contentinfo')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Giới thiệu', exact: true })).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        expect(overflow).toBe(false);
        await page.screenshot({ path: `test-results/site-public-${viewport.width}-${path.slice(1)}.png`, fullPage: true });
      });
    }
  });
}

test('retired status URL redirects to the public home page', async ({ page }) => {
  await page.goto('/status');
  await expect(page).toHaveURL(/\/$/);
});

for (const [name, milestones, teamMembers, expected] of [
  ['no optional sections', [], [], ['01', '02', '03']],
  ['milestones only', [{ label: '2026', title: 'Launch', description: 'First release' }], [], ['01', '02', '03', '04']],
  ['milestones and team', [{ label: '2026', title: 'Launch', description: 'First release' }], [{ name: 'A', role: 'Builder', bio: null, assetId: null }], ['01', '02', '03', '04', '05']],
] as const) {
  test(`About numbers match visible section eyebrows: ${name}`, async ({ page }) => {
    await page.route('**/api/v1/public/pages/about', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { about: {
        heroTitle: 'Giới thiệu Nexora', heroSubtitle: 'Luyện tập', heroAssetId: null,
        missionTitle: 'Sứ mệnh', missionBody: 'Giúp bạn luyện tập', missionAssetId: null,
        values: [], milestones, teamSectionEnabled: teamMembers.length > 0,
        teamHeading: 'Đội ngũ', teamMembers,
      } } }),
    }));
    await page.goto('/about');
    const toc = page.getByRole('navigation', { name: 'Mục lục trang giới thiệu' });
    await expect(toc.locator('a')).toHaveCount(expected.length);
    const tocNumbers = await toc.locator('a span').allTextContents();
    expect(tocNumbers).toEqual(expected);
    const sectionNumbers = await page.locator('section[id] p.uppercase').allTextContents();
    expect(sectionNumbers.map((value) => value.slice(0, 2))).toEqual(expected);
  });
}

test('public shell carries the ambient ground through translucent footer and disabled social marks', async ({ page }) => {
  await page.goto('/about');
  const shell = page.locator('.nexora-ambient-shell');
  await expect(shell).toBeVisible();
  expect(await shell.evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('radial-gradient');
  const footer = page.getByRole('contentinfo');
  expect(await footer.evaluate((element) => getComputedStyle(element).backgroundColor)).toContain('0.78');
  for (const label of ['Facebook', 'TikTok']) {
    const icon = footer.getByLabel(`${label}: Sắp cập nhật`);
    await expect(icon.locator('svg')).toBeVisible();
    expect(await icon.evaluate((element) => element.tagName)).toBe('SPAN');
  }
});

test('configured social destinations render accessible external links with hover and focus response', async ({ page }) => {
  await page.route('**/api/v1/public/site-settings', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { facebookUrl: 'https://www.facebook.com/nexora', tiktokUrl: 'https://www.tiktok.com/@nexora',
      contactEmail: 'nexorainterview@gmail.com', brandDescription: 'Nexora', madeInVietnamEnabled: true,
      supportAvailabilityEnabled: false, supportLabel: null } }),
  }));
  await page.goto('/about');
  const facebook = page.getByRole('contentinfo').getByRole('link', { name: 'Facebook' });
  const tiktok = page.getByRole('contentinfo').getByRole('link', { name: 'TikTok' });
  await expect(facebook).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(tiktok).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(facebook.locator('svg')).toBeVisible();
  await expect(tiktok.locator('svg')).toBeVisible();
  await facebook.hover();
  await expect(facebook).toHaveCSS('background-color', 'rgb(24, 119, 242)');
  await tiktok.focus();
  await expect(tiktok).toHaveCSS('background-color', 'rgb(23, 37, 84)');
  await page.screenshot({ path: 'test-results/site-social-enabled.png', fullPage: false });
});

test('authenticated overview uses the ambient normal shell at desktop and mobile widths', async ({ page }) => {
  const payload = Buffer.from(JSON.stringify({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const accessToken = `eyJhbGciOiJIUzI1NiJ9.${payload}.test`;
  const user = { id: 'user-1', email: 'test@nexora.ai', displayName: 'Test User', roles: ['Candidate'],
    billing: { entitlement: { planCode: 'free', available: 3, limit: 3, consumed: 0, reserved: 0, features: [] }, orders: [] } };
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/refresh')) return route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ data: { accessToken, user } }) });
    if (path.endsWith('/me')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: user }) });
    return route.fulfill({ status: 503, contentType: 'application/json',
      body: JSON.stringify({ error: { code: 'TEST_UNAVAILABLE', message: 'Test fixture unavailable' } }) });
  });
  await page.goto('/overview');
  await expect(page.locator('.nexora-ambient-shell')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  for (const surface of await page.locator('.product-main-surface').all())
    expect(await surface.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  for (const viewport of [{ width: 1664, height: 936 }, { width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width + 1);
    await page.screenshot({ path: `test-results/site-overview-${viewport.width}.png`, fullPage: true });
  }
});
