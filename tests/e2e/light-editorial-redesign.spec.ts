import { expect, test } from '@playwright/test';

for (const width of [1440, 390, 360]) {
  test(`isolated studio visual states and disabled devices at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/design-system');
    const fixture = page.getByRole('region', { name: 'Kiểm tra giao diện studio' });
    await expect(fixture).toBeVisible();
    for (const state of ['idle', 'speaking', 'listening', 'thinking', 'error']) {
      await fixture.getByRole('button', { name: state, exact: true }).click();
      await expect(fixture.locator('.ai-presence')).toHaveAttribute('data-state', state);
      await expect(fixture.locator('.ai-presence-status')).not.toBeEmpty();
      await expect(fixture.getByRole('button', { name: 'Microphone tắt · minh họa' })).toBeDisabled();
      await expect(fixture.getByRole('button', { name: 'Camera tắt · minh họa' })).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
      await fixture.screenshot({ path: `test-results/studio-fixture-${width}-${state}.png` });
    }
    await expect(fixture.getByRole('alert')).toContainText('Bản nháp vẫn được giữ');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fixture.getByRole('button', { name: 'speaking', exact: true }).click();
    await expect(fixture.locator('.ai-mascot img')).toHaveCSS('animation-name', 'none');
    await fixture.getByRole('button', { name: 'Mở trình nhập minh họa' }).click();
    await expect(page.getByRole('dialog', { name: /Phụ đề câu trả lời/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nộp câu trả lời', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Đóng trình chỉnh sửa' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
}
