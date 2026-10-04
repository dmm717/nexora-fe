import { expect, test } from '@playwright/test';

const items = [1, 2, 3].map((number) => ({
  id: `feedback-${number}`,
  displayName: `Người dùng ${number}`,
  rating: 5,
  comment: `Trải nghiệm luyện phỏng vấn giúp tôi chuẩn bị kỹ hơn. ${'Nội dung phản hồi dài để kiểm tra vùng cuộn. '.repeat(4)}`,
  publishedAt: '2026-09-24T00:00:00Z',
  avatarUrl: number === 1 ? '/api/v1/avatars/11111111-1111-1111-1111-111111111111' : null,
}));

// Enter through the real SPA navigation after auth bootstrap. This isolates the
// public-feedback layout from the root query client's initial dev cleanup.
async function openLanding(page: import('@playwright/test').Page) {
  await page.goto('/about');
  await expect(page.getByRole('link', { name: 'Đăng nhập', exact: true }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Nexora AI — Trang chủ', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Luyện tập hôm nay');
}

for (const width of [1664, 1440, 390]) {
  test(`first testimonial remains visible at ${width}px and later cards scroll into view`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 936 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/v1/feedback/public?*', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { averageRating: 5, ratingCount: 3, items } }),
    }));
    await page.route('**/api/v1/avatars/*', (route) => route.fulfill({
      status: 404,
    }));
    await openLanding(page);

    const list = page.locator('#testimonials [class*="testimonialList"]');
    await expect(list.locator('article')).toHaveCount(3);
    await expect(list.locator('article').first().locator('img')).toHaveCount(0);
    await expect(list.locator('article').first()).toContainText('ND');
    await expect(list).not.toContainText('test@nexora.ai');
    await list.scrollIntoViewIfNeeded();
    const initial = await list.evaluate((element) => {
      const listRect = element.getBoundingClientRect();
      const first = element.querySelector('article')!;
      const firstRect = first.getBoundingClientRect();
      return {
        scrollTop: element.scrollTop,
        firstTop: firstRect.top,
        firstBottom: firstRect.bottom,
        listTop: listRect.top,
        listBottom: listRect.bottom,
        cardScrollHeight: first.scrollHeight,
        cardClientHeight: first.clientHeight,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    });
    expect(initial.scrollTop).toBe(0);
    expect(initial.firstTop).toBeGreaterThanOrEqual(initial.listTop - 1);
    expect(initial.firstBottom).toBeGreaterThan(initial.firstTop);
    expect(initial.firstBottom).toBeLessThanOrEqual(initial.listBottom + 1);
    expect(initial.cardScrollHeight).toBeLessThanOrEqual(initial.cardClientHeight + 1);
    expect(initial.scrollHeight).toBeGreaterThan(initial.clientHeight);
    await page.screenshot({ path: testInfo.outputPath(`testimonials-${width}.png`) });
    await list.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
}

test('public feedback displays a current avatar when image loads', async ({ page }) => {
  await page.route('**/api/v1/feedback/public?*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { averageRating: 5, ratingCount: 3, items } }),
  }));
  await page.route('**/api/v1/avatars/*', (route) => route.fulfill({
    status: 200,
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==', 'base64'),
  }));
  await openLanding(page);
  const cards = page.locator('#testimonials article');
  await expect(cards).toHaveCount(3);
  await expect(cards.first().locator('img')).toBeVisible();
  await expect(cards.nth(1).locator('img')).toHaveCount(0);
});
