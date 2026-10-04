import { expect, test } from '@playwright/test';

const official = 'nexorainterview.vn@gmail.com';

for (const settings of ['unavailable', 'empty', 'official', 'custom'] as const) {
  test(`legal support fallback and footer ${settings} settings keep correct mailto destinations`, async ({ page }) => {
    // Mock public content only; this test never publishes or overwrites a policy.
    await page.route('**/api/v1/**', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }));
    await page.route('**/api/v1/public/pages/*', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    const configured = settings === 'custom' ? 'owner-selected@example.test' : settings === 'empty' ? '' : official;
    await page.route('**/api/v1/public/site-settings', route => route.fulfill({
      status: settings === 'unavailable' ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { contactEmail: configured, brandDescription: 'Nexora', facebookUrl: null, tiktokUrl: null } }),
    }));
    for (const path of ['/privacy', '/terms']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Nội dung hiện chưa khả dụng', exact: true })).toBeVisible();
      await expect(page.getByRole('main').getByRole('link', { name: official, exact: true })).toHaveAttribute('href', `mailto:${official}`);
      const footerEmail = settings === 'custom' ? configured : official;
      await expect(page.getByRole('contentinfo').getByRole('link', { name: footerEmail, exact: true })).toHaveAttribute('href', `mailto:${footerEmail}`);
      const targets = await page.locator('a[href^="mailto:"]').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(targets).toEqual([`mailto:${official}`, `mailto:${footerEmail}`]);
    }
  });
}
