import { expect, test } from '@playwright/test';

for (const width of [1440, 390]) {
  test(`cinematic landing ${width}: automatic real 3D, camera scroll and accessible content`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const scene = page.locator('[data-cinematic-journey]');
    await expect(scene).toHaveAttribute('data-render-mode', '3d', { timeout: 20000 });
    await expect(page.locator('[data-brand-canvas] canvas')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Luyện tập hôm nay');
    await expect(page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Xem.*3D|Dùng hình ảnh/ })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `test-results/cinematic-landing-${width}.png` });
    const initialCamera = Number(await scene.getAttribute('data-camera-x'));
    await page.mouse.wheel(0, 650);
    await expect.poll(async () => Number(await scene.getAttribute('data-camera-x'))).toBeGreaterThan(initialCamera + .1);
    await page.screenshot({ path: `test-results/cinematic-scroll-${width}.png` });
    await page.locator('#report-story').scrollIntoViewIfNeeded();
    await expect(page.locator('#report-story')).toContainText('Không chỉ trả lời');
    expect(errors).toEqual([]);
  });
}

test('reduced motion keeps the complete atmospheric opening without loading WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const assets: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.glb')) assets.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-render-policy', 'conservative');
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(assets).toEqual([]);
});

test('unavailable emblem asset automatically falls back without blocking actions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/nexora-emblem.glb', route => route.abort());
  await page.goto('/');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-scene-failed', 'true');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-render-mode', 'image');
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true })).toBeVisible();
});

test('context loss releases WebGL and retains the opening and CTA', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const journey = page.locator('[data-cinematic-journey]');
  await expect(journey).toHaveAttribute('data-render-mode', '3d');
  await page.locator('[data-brand-canvas] canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(journey).toHaveAttribute('data-render-mode', 'image');
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true })).toBeVisible();
});

test('preference changes release the canvas without losing the content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('[data-cinematic-journey]')).toHaveAttribute('data-render-mode', '3d');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
  await expect(page.locator('[data-motion-mode]')).toHaveAttribute('data-motion-trigger-count', '0');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

for (const width of [1440, 390]) test(`document-focused CV introduction at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/cv-analysis');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mỗi kinh nghiệm');
  await expect(page.getByRole('link', { name: 'Tối ưu CV theo vị trí' })).toHaveAttribute('href', '/resume-analyses');
  await expect(page.getByRole('link', { name: 'Phân tích theo ngành', exact: true })).toHaveAttribute('href', '/resume-analyses');
  await expect(page.getByText('Minh họa cấu trúc báo cáo', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('85%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `test-results/cinematic-cv-public-${width}.png` });
  expect(errors).toEqual([]);
});
