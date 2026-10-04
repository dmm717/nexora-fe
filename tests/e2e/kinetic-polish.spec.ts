import { expect, test } from '@playwright/test';

test.use({ video: { mode: 'on', size: { width: 1440, height: 900 } } });
test.setTimeout(45000);

test('kinetic intro shows deconstruction, regrouping, slogan and a real camera continuation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  const motionWarnings: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/GSAP target|hydration|hydrated.*match/i.test(message.text())) motionWarnings.push(message.text());
  });
  await page.addInitScript(() => {
    const beats: string[] = [];
    Object.assign(window, { nexoraObservedBeats: beats });
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.target instanceof HTMLElement && record.attributeName === 'data-intro-beat') {
          beats.push(record.target.dataset.introBeat || '');
        }
      });
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-intro-beat'] });
  });
  await page.goto('/');
  const journey = page.locator('[data-cinematic-journey]');
  await expect(journey).toHaveAttribute('data-intro-beat', 'settled', { timeout: 15000 });
  const beats = await page.evaluate(() => (window as unknown as { nexoraObservedBeats: string[] }).nexoraObservedBeats);
  for (const beat of ['establish', 'deconstruct', 'recompose', 'slogan', 'settled']) expect(beats).toContain(beat);
  await expect(journey).toHaveAttribute('data-render-mode', '3d');
  await page.screenshot({ path: 'test-results/kinetic-settled.png' });
  const camera = Number(await journey.getAttribute('data-camera-x'));
  await page.mouse.wheel(0, 760);
  await expect.poll(async () => Number(await journey.getAttribute('data-camera-x'))).toBeGreaterThan(camera + .1);
  await page.screenshot({ path: 'test-results/kinetic-continuation.png' });
  await page.locator('#ai-interview').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-depth-panel]')).toBeInViewport({ ratio: .5 });
  await page.screenshot({ path: 'test-results/kinetic-studio.png' });
  await page.locator('#report-story').scrollIntoViewIfNeeded();
  await expect(page.locator('#report-story h2')).toBeVisible();
  expect(errors).toEqual([]);
  expect(motionWarnings).toEqual([]);
});

for (const width of [1440, 1280, 768, 390]) {
  test(`kinetic typography and CV preview fit ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/');
    await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled', { timeout: 15000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const logo = await page.locator('[data-brand-wordmark]').boundingBox();
    expect(logo!.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/polish-landing-${width}.png` });
    await page.locator('#cv-analysis').scrollIntoViewIfNeeded();
    await expect(page.locator('#cv-analysis')).toBeVisible();
    await page.screenshot({ path: `test-results/polish-cv-story-${width}.png` });
  });
}

test('user interaction settles intro and breakpoint changes do not replay it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('[data-brand-wordmark]').waitFor();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('reduced motion retains a visible wordmark sequence without moving or hiding meaningful content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const beats: string[] = [];
    Object.assign(window, { nexoraReducedBeats: beats });
    new MutationObserver(records => {
      records.forEach(record => {
        if (record.target instanceof HTMLElement && record.attributeName === 'data-intro-beat') {
          beats.push(record.target.dataset.introBeat || '');
        }
      });
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-intro-beat'] });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-intro-beat', 'settled');
  const beats = await page.evaluate(() => (window as unknown as { nexoraReducedBeats: string[] }).nexoraReducedBeats);
  for (const beat of ['establish', 'deconstruct', 'recompose', 'slogan', 'settled']) expect(beats).toContain(beat);
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
  expect(await page.locator('[data-brand-letter]').first().evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await expect(page.locator('[data-brand-letter]').first()).toHaveCSS('opacity', '1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('without JavaScript the slogan, brand and primary action remain present', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  // Verify the actual server-rendered public page, including its streamed loading boundary.
  await page.goto(process.env.NEXORA_NOJS_BASE_URL || 'http://localhost:3000/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Luyện tập hôm nay');
  await expect(page.locator('[data-brand-wordmark]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bắt đầu luyện tập', exact: true })).toBeVisible();
  await context.close();
});

test('studio artwork responds only to the selected real-state contract and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/design-system');
  const fixture = page.getByRole('region', { name: 'Kiểm tra giao diện studio' });
  await expect(fixture).toBeVisible();
  // The streamed shell can remount this fixture during hydration; resolve the live node again.
  await expect(async () => fixture.scrollIntoViewIfNeeded()).toPass({ timeout: 5000 });
  const mascot = fixture.locator('.ai-mascot > div');
  await expect(mascot).toHaveCSS('animation-name', 'none');
  await fixture.getByRole('button', { name: 'speaking', exact: true }).click();
  await expect(fixture.locator('.ai-presence')).toHaveAttribute('data-state', 'speaking');
  await expect.poll(() => mascot.evaluate(el => getComputedStyle(el).animationName)).toBe('nexora-coach-speaking');
  const first = await mascot.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => mascot.evaluate(el => getComputedStyle(el).transform)).not.toBe(first);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => mascot.evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  await fixture.getByRole('button', { name: 'idle', exact: true }).click();
  await expect(fixture.locator('.ai-presence')).toHaveAttribute('data-state', 'idle');
});
