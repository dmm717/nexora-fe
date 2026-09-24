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
        if (path === '/about' || viewport.width === 390)
          await page.screenshot({ path: `test-results/site-public-${viewport.width}-${path.slice(1)}.png`, fullPage: true });
      });
    }
  });
}

test('retired status URL redirects to the public home page', async ({ page }) => {
  await page.goto('/status');
  await expect(page).toHaveURL(/\/$/);
});
