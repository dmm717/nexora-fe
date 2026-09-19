import { expect, test } from '@playwright/test';

test.describe('landing runtime motion', () => {
  test('normal motion initializes GSAP, scroll triggers and replayable CV demo', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const landing = page.locator('[data-motion-mode]');
    await expect(landing).toHaveAttribute('data-motion-mode', 'normal');
    await expect.poll(async () => Number(await landing.getAttribute('data-motion-trigger-count'))).toBeGreaterThan(0);

    const parallax = page.locator('[data-parallax]');
    const initialTransform = await parallax.evaluate((element) => getComputedStyle(element).transform);
    await page.locator('#preparation-loop').scrollIntoViewIfNeeded();
    await expect.poll(async () => parallax.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(initialTransform);

    await page.getByRole('button', { name: 'Xem demo phân tích mẫu' }).click();
    await expect(page.getByText('Đã nhận CV mẫu')).toBeVisible();
    await expect(page.getByText('AI đang đọc các điểm phù hợp trong CV mẫu…')).toBeVisible({ timeout: 2_000 });
    const result = page.locator('[data-cv-demo-result]');
    await expect(result).toBeVisible({ timeout: 4_000 });
    await expect(result.locator('[data-cv-count]')).toHaveText('78', { timeout: 2_000 });
    await expect(result.locator('[data-cv-radial]')).toHaveCSS('stroke-dashoffset', '58px');

    await page.getByRole('button', { name: 'Chạy lại demo phân tích mẫu' }).click();
    await expect(page.getByText('Đã nhận CV mẫu')).toBeVisible();
    await expect(result).toBeVisible({ timeout: 4_000 });
    await expect(result.locator('[data-cv-count]')).toHaveText('78', { timeout: 2_000 });
  });

  test('reduced motion keeps content final and creates no ScrollTrigger instances', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const landing = page.locator('[data-motion-mode]');
    await expect(landing).toHaveAttribute('data-motion-mode', 'reduced');
    await expect(landing).toHaveAttribute('data-motion-trigger-count', '0');

    const parallax = page.locator('[data-parallax]');
    await expect(parallax).toHaveCSS('transform', 'none');
    await page.getByRole('button', { name: 'Xem demo phân tích mẫu' }).click();
    const result = page.locator('[data-cv-demo-result]');
    await expect(result).toBeVisible({ timeout: 4_000 });
    await expect(result.locator('[data-cv-count]')).toHaveText('78');
    await expect(result.locator('[data-cv-meter]').first()).toHaveCSS('transform', 'none');
  });

  test('route remount initializes motion again without duplicating ownership', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const landing = page.locator('[data-motion-mode]');
    await expect(landing).toHaveAttribute('data-motion-mode', 'normal');
    const initialCount = await landing.getAttribute('data-motion-trigger-count');

    await page.goto('/pricing');
    await page.goto('/');
    await expect(landing).toHaveAttribute('data-motion-mode', 'normal');
    await expect(landing).toHaveAttribute('data-motion-trigger-count', initialCount ?? '0');
  });
});
