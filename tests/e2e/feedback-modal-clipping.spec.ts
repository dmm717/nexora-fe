import { expect, test } from '@playwright/test';

function createMockToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-feedback-test',
      userId: 'user-feedback-test',
      email: 'candidate@nexora.ai',
      exp: Math.floor(Date.now() / 1000) + 7200,
    })
  ).toString('base64url');
  return `${header}.${payload}.mock`;
}

const mockUser = {
  id: 'user-feedback-test',
  email: 'candidate@nexora.ai',
  displayName: 'Nguyễn Văn A',
  roles: ['Candidate'],
  billing: {
    entitlement: { planCode: 'free', limit: 3, consumed: 0, reserved: 0, available: 3, features: [] },
    orders: [],
  },
  yearsOfExperience: 3,
  avatarUrl: null,
};

const mockExistingFeedback = {
  id: 'fb-12345',
  userId: 'user-feedback-test',
  rating: 5,
  comment: 'Nền tảng luyện phỏng vấn AI rất mượt mà và trực quan! Phản hồi chi tiết giúp tôi tự tin hơn rất nhiều.',
  moderationStatus: 'approved',
  allowPublicDisplay: true,
  createdAt: '2026-03-20T10:00:00Z',
  updatedAt: '2026-03-22T14:30:00Z',
};

for (const viewport of [
  { width: 1723, height: 765 }, // Exact user screenshot viewport
  { width: 1280, height: 640 }, // Compact laptop viewport
]) {
  test.describe(`Feedback Modal Clipping & Stacking at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('feedback modal portals to body, sits above footer, and action buttons remain visible and clickable', async ({
      page,
    }) => {
      // Setup authenticated API routes
      await page.route('**/api/v1/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        const json = (data: unknown) =>
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data }),
          });

        if (path.endsWith('/auth/refresh')) {
          return json({ accessToken: createMockToken(), user: mockUser });
        }
        if (path.endsWith('/me/feedback')) {
          return json(mockExistingFeedback);
        }
        if (path.endsWith('/me/career-profile')) {
          return json({
            profile: { displayName: 'Nguyễn Văn A', avatarUrl: null },
            onboarding: { isComplete: true },
          });
        }
        if (path.endsWith('/me')) {
          return json(mockUser);
        }

        return json({});
      });

      // 1. Navigate to /account
      await page.goto('/account');

      // 2. Ensure page and feedback card loaded
      await expect(page.getByRole('heading', { level: 2, name: 'Đánh giá & Góp ý' })).toBeVisible();
      const editButton = page.getByRole('button', { name: 'Chỉnh sửa đánh giá' });
      await expect(editButton).toBeVisible();

      // 3. Open feedback modal
      await editButton.click();

      // 4. Locate modal dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // 5. Verify Modal is portaled directly under document.body (NOT trapped inside .product-main-surface)
      const isPortaledToBody = await page.evaluate(() => {
        const modalPortal = document.querySelector('[role="dialog"]')?.closest('body > div');
        const mainSurface = document.querySelector('.product-main-surface');
        const dialogEl = document.querySelector('[role="dialog"]');
        if (!dialogEl || !mainSurface) return false;
        // Dialog must NOT be a descendant of .product-main-surface
        return !mainSurface.contains(dialogEl);
      });
      expect(isPortaledToBody).toBe(true);

      // 6. Verify Modal backdrop covers footer and has z-index >= 100
      const modalZIndex = await page.evaluate(() => {
        const backdrop = document.querySelector('[role="dialog"]')?.parentElement;
        return backdrop ? window.getComputedStyle(backdrop).zIndex : null;
      });
      expect(Number(modalZIndex)).toBeGreaterThanOrEqual(100);

      // 7. Verify Modal dialog is contained within viewport (no overflow cutoff)
      const dialogBox = await dialog.boundingBox();
      expect(dialogBox).not.toBeNull();
      if (dialogBox) {
        expect(dialogBox.y).toBeGreaterThanOrEqual(0);
        expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height);
      }

      // 8. Verify action buttons ("Hủy", "Cập nhật đánh giá") are fully visible and clickable
      const submitButton = page.getByRole('button', { name: 'Cập nhật đánh giá' });
      const cancelButton = page.getByRole('button', { name: 'Hủy' });
      await expect(submitButton).toBeVisible();
      await expect(cancelButton).toBeVisible();

      // Test cancel button closes the modal cleanly
      await cancelButton.click();
      await expect(dialog).not.toBeVisible();
    });
  });
}
