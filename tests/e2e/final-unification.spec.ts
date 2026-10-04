import { expect, test } from '@playwright/test';

const journeySizes = [[1920, 1080], [1440, 900], [1280, 720], [1024, 768], [768, 1024], [390, 844], [360, 800]];

for (const [width, height] of journeySizes) {
  test(`five-step story remains readable and connected during motion at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (/hydration|hydrated.*match|GSAP target/i.test(message.text())) errors.push(message.text());
    });
    await page.goto('/');
    const section = page.locator('#preparation-loop');
    await expect(section.locator('[data-loop-node]')).toHaveCount(5);
    // Check actual layout across entrance frames, including the first partial viewport reveal.
    await section.scrollIntoViewIfNeeded();
    const frames = await section.evaluate(async section => {
      const samples = [];
      for (let frame = 0; frame < 18; frame++) {
        await new Promise(requestAnimationFrame);
        const origin = section.getBoundingClientRect();
        samples.push([...section.querySelectorAll<HTMLElement>('[data-loop-node]')].map(node => {
          const r = node.getBoundingClientRect();
          return { x: r.x - origin.x, y: r.y - origin.y, width: r.width, height: r.height };
        }));
      }
      return samples;
    });
    for (const cards of frames) {
      for (let i = 1; i < cards.length; i++) {
        const before = cards[i - 1], current = cards[i];
        expect(width >= 1360 ? current.x - before.x - before.width : current.y - before.y - before.height).toBeGreaterThanOrEqual(15);
      }
      for (const card of cards) {
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.x + card.width).toBeLessThanOrEqual(Math.min(width, 1440) + 1);
      }
    }
    expect(frames.at(-1)).toEqual(frames[0]);
    for (const node of await section.locator('[data-loop-node]').all()) {
      expect(await node.locator('h3, p, button').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1))).toBe(true);
    }
    const track = section.locator('[data-loop-track]');
    expect(await track.evaluate((el, vertical) => getComputedStyle(el)[vertical ? 'width' : 'height'], width < 1360)).toBe('2px');
    await section.screenshot({ path: `test-results/journey-${width}x${height}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('reduced motion shows the complete journey without spatial entrance transforms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const section = page.locator('#preparation-loop');
  await section.scrollIntoViewIfNeeded();
  for (const node of await section.locator('[data-loop-node]').all()) {
    await expect(node).toHaveCSS('opacity', '1');
    await expect(node).toHaveCSS('transform', 'none');
  }
  await expect(section.locator('h2')).toHaveCSS('clip-path', 'none');
  await expect(page.locator('[data-brand-canvas]')).toHaveCount(0);
});

test('public practice CTA preserves canonical intent through the authentication gate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu luyện tập', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get('returnTo')).toBe('/interviews/new');
  expect(url.searchParams.get('intentAction')).toBe('interview');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Luyện tập hôm nay');
  await page.goForward();
  await expect(page).toHaveURL(/\/auth\?/);
});

// /account's existing auth guard preserves the legacy URL first; its server redirect
// resolves to /settings after login. Keep that guard ordering and safe-return contract.
for (const [source, target] of [['/interview', '/interviews/new'], ['/ai-interview', '/interviews/new'], ['/interview/room', '/interviews'], ['/account', '/account'], ['/cv-analysis/history', '/cv-analysis/history'], ['/interviews/history', '/interviews/history'], ['/settings', '/settings']]) {
  test(`direct entry ${source} retains its protected destination`, async ({ page }) => {
    await page.goto(source);
    // A transient backend refresh error keeps the guard's recovery UI rather than
    // falsely declaring the user anonymous. Its explicit login action must retain intent too.
    const recovery = page.getByRole('button', { name: 'Đến trang đăng nhập', exact: true });
    await expect.poll(async () => new URL(page.url()).pathname === '/auth' || await recovery.isVisible()).toBe(true);
    if (await recovery.isVisible()) await recovery.click();
    await expect(page).toHaveURL(/\/auth\?returnTo=/);
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(target);
    await expect(page.getByRole('button', { name: 'Đăng nhập ngay' })).toBeVisible();
  });
}

test('CV marketing compatibility retains the actual analysis destination', async ({ page }) => {
  await page.goto('/cv-analysis');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mỗi kinh nghiệm');
  await expect(page.getByRole('link', { name: 'Tối ưu CV theo vị trí' })).toHaveAttribute('href', '/resume-analyses');
});

test('landing menu remains reachable at the desktop breakpoint and restores mobile keyboard focus', async ({ page }) => {
  await page.goto('/');
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const header = page.locator('[data-nexora-header="cinematic"]');
    if (width >= 1024) {
      const links = header.getByRole('navigation', { name: 'Điều hướng chính', exact: true }).getByRole('link');
      for (const link of await links.all()) {
        const box = await link.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      }
    } else {
      const trigger = page.getByRole('button', { name: 'Mở menu', exact: true });
      await trigger.click();
      await expect(page.getByRole('navigation', { name: 'Điều hướng di động', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
  }
});

test('pricing hero uses the full mobile content width instead of an empty artwork column', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/pricing');
  const hero = page.locator('.pricing-hero');
  const copy = hero.locator('.product-page-hero-copy');
  await expect(copy.locator('h1')).toBeVisible();
  const boxes = await Promise.all([hero.boundingBox(), copy.boundingBox()]);
  expect(boxes[1]!.width / boxes[0]!.width).toBeGreaterThan(.75);
  expect(await copy.locator('h1').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
