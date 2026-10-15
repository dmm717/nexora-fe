import { expect, test } from '@playwright/test';

test.use({ video: { mode: 'on', size: { width: 1440, height: 900 } } });

test('settled hero stays alive, follows the pointer and sleeps offscreen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const hero = page.locator('#hero');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled', { timeout: 20000 });
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-render-mode', '3d');
  await expect(hero).toHaveAttribute('data-presence-active', 'true');
  // Capture a viewport crop so screenshot auto-scrolling cannot move the camera.
  const clip = { x: 0, y: 64, width: 1440, height: 300 };
  const before = await page.screenshot({ clip });
  const time = Number(await hero.getAttribute('data-presence-time'));
  await expect.poll(async () => Number(await hero.getAttribute('data-presence-time'))).toBeGreaterThan(time + 1);
  expect((await page.screenshot({ clip })).equals(before)).toBe(false);
  await page.mouse.move(250, 300);
  await page.mouse.move(600, 380, { steps: 30 });
  await expect.poll(async () => Number(await hero.getAttribute('data-cursor-particles'))).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/hero-galaxy-desktop.png' });
  await expect(page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true }).first()).toBeVisible();
  await page.locator('#report-story').scrollIntoViewIfNeeded();
  await expect(hero).toHaveAttribute('data-presence-active', 'false');
  const stopped = await hero.getAttribute('data-presence-time');
  await page.screenshot({ path: 'test-results/ambient-landing-report.png' });
  expect(await hero.getAttribute('data-presence-time')).toBe(stopped);
  expect(errors).toEqual([]);
});

test('reduced motion keeps the complete hero without a continuous ticker', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled', { timeout: 15000 });
  await expect(page.locator('#hero')).not.toHaveAttribute('data-presence-active', 'true');
  await expect(page.locator('[data-brand-canvas] canvas')).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`ambient background persists through public routes at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/privacy', '/terms', '/auth', '/design-system']) {
      await page.goto(route);
      await expect(page.locator('body')).toHaveClass(/nexora-ambient-shell/);
      const background = await page.locator('body').evaluate(el => getComputedStyle(el).backgroundImage);
      expect(background).toContain('radial-gradient');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundImage)).toBe(background);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `test-results/ambient-${route.slice(1)}-${width}.png` });
    }
  });
}
