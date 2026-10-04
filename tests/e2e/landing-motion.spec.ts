import { expect, test } from '@playwright/test';

test.describe('landing runtime motion', () => {
  test('normal motion initializes GSAP, scroll triggers and visible CV result', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const landing = page.locator('[data-motion-mode]');
    await expect(landing).toHaveAttribute('data-motion-mode', 'normal');
    await expect.poll(async () => Number(await landing.getAttribute('data-motion-trigger-count'))).toBeGreaterThan(0);

    await expect(page.locator('[data-parallax]')).toHaveCount(0);
    await page.locator('#preparation-loop').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-loop-node]').first()).toBeVisible();

    const result = page.locator('[data-document-preview]');
    await expect(result).toBeVisible({ timeout: 4_000 });
    await expect(result).toContainText('Kinh nghiệm');
    await expect(result.locator('[data-cv-count]')).toHaveCount(0);

    await expect(page.getByRole('button', { name: /demo phân tích mẫu/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /trạng thái tài khoản mới/i })).toHaveCount(0);
  });

  test('reduced motion keeps content final and creates no ScrollTrigger instances', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const landing = page.locator('[data-motion-mode]');
    await expect(landing).toHaveAttribute('data-motion-mode', 'reduced');
    await expect(landing).toHaveAttribute('data-motion-trigger-count', '0');

    await expect(page.locator('[data-cinematic-copy]').first()).toHaveCSS('transform', 'none');
    const result = page.locator('[data-document-preview]');
    await expect(result).toBeVisible({ timeout: 4_000 });
    await expect(result).toContainText('Kinh nghiệm');
    await expect(result).not.toContainText('78');
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
