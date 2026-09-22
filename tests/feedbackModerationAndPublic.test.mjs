import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Feedback Contract: safe user-facing status labels without exposing admin internals', async () => {
  const contract = await import('../src/services/feedbackContract.ts');

  assert.equal(contract.getFeedbackStatusLabel('approved'), 'Đã duyệt');
  assert.equal(contract.getFeedbackStatusLabel('APPROVED'), 'Đã duyệt');
  assert.equal(contract.getFeedbackStatusLabel('rejected'), 'Không được hiển thị');
  assert.equal(contract.getFeedbackStatusLabel('REJECTED'), 'Không được hiển thị');
  assert.equal(contract.getFeedbackStatusLabel('pending'), 'Đang chờ duyệt');
  assert.equal(contract.getFeedbackStatusLabel('PENDING'), 'Đang chờ duyệt');
  assert.equal(contract.getFeedbackStatusLabel(undefined), 'Đang chờ duyệt');

  assert.equal(contract.FEEDBACK_MAX_COMMENT_LENGTH, 1000);
});

test('Feedback API: endpoints match backend contracts exactly', () => {
  const apiSource = readFileSync(
    new URL('../src/services/feedbackApi.ts', import.meta.url),
    'utf8'
  );

  assert.match(apiSource, /getMyFeedback:\s*async\s*\(\)/);
  assert.match(apiSource, /apiClient\.get\('\/me\/feedback'\)/);
  assert.match(apiSource, /upsertMyFeedback:\s*async\s*\(request:\s*FeedbackRequest\)/);
  assert.match(apiSource, /apiClient\.put\('\/me\/feedback',\s*request\)/);
  assert.match(apiSource, /deleteMyFeedback:\s*async\s*\(\)/);
  assert.match(apiSource, /apiClient\.delete\('\/me\/feedback'\)/);
  assert.match(apiSource, /getPublicFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.get\(`\/feedback\/public\?limit=\$\{limit\}`\)/);
  assert.match(apiSource, /getAdminFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.get\(`\/admin\/feedback\$\{query\}`\)/);
  assert.match(apiSource, /getAdminFeedbackSummary:\s*async/);
  assert.match(apiSource, /apiClient\.get\('\/admin\/feedback\/summary'\)/);
  assert.match(apiSource, /approveFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.post\(`\/admin\/feedback\/\$\{id\}\/approve`/);
  assert.match(apiSource, /rejectFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.post\(`\/admin\/feedback\/\$\{id\}\/reject`/);
  assert.match(apiSource, /featureFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.post\(`\/admin\/feedback\/\$\{id\}\/feature`/);
  assert.match(apiSource, /unfeatureFeedback:\s*async/);
  assert.match(apiSource, /apiClient\.post\(`\/admin\/feedback\/\$\{id\}\/unfeature`/);
});

test('ProductFeedbackDialog: implements accessible 1-5 radio group, 1000 char counter, and public consent defaults to false', () => {
  const source = readFileSync(
    new URL('../src/components/features/feedback/ProductFeedbackDialog.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /FEEDBACK_MAX_COMMENT_LENGTH/);
  assert.match(source, /role="radiogroup"/);
  assert.match(source, /role="radio"/);
  assert.match(source, /allowPublicDisplay/);
  assert.match(source, /setAllowPublicDisplay\(false\)/);
  assert.match(source, /useUpsertFeedback/);
  assert.match(source, /useDeleteFeedback/);
  assert.match(source, /getFeedbackStatusLabel/);
});

test('AccountSettings: integrates ProductFeedbackCard without exposing admin internals', () => {
  const accountSettingsSource = readFileSync(
    new URL('../src/components/features/account/AccountSettings.tsx', import.meta.url),
    'utf8'
  );
  const cardSource = readFileSync(
    new URL('../src/components/features/account/ProductFeedbackCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(accountSettingsSource, /<ProductFeedbackCard \/>/);
  assert.match(cardSource, /useMyFeedback/);
  assert.match(cardSource, /ProductFeedbackDialog/);
  assert.match(cardSource, /getFeedbackStatusLabel/);
  assert.doesNotMatch(cardSource, /moderatedByUserId/);
  assert.doesNotMatch(cardSource, /moderationReason/);
});

test('Admin Feedback Moderation: route exists under (admin), has sidebar item, KPI cards, and Recharts distribution', () => {
  const layoutSource = readFileSync(
    new URL('../src/components/layouts/AdminLayout.tsx', import.meta.url),
    'utf8'
  );
  const adminFeedbackSource = readFileSync(
    new URL('../src/app/(admin)/admin/feedback/page.tsx', import.meta.url),
    'utf8'
  );

  assert.match(layoutSource, /href:\s*'\/admin\/feedback'/);
  assert.match(layoutSource, /label:\s*'Phản hồi'/);

  assert.match(adminFeedbackSource, /useAdminFeedbackSummary/);
  assert.match(adminFeedbackSource, /useAdminFeedback/);
  assert.match(adminFeedbackSource, /useApproveFeedback/);
  assert.match(adminFeedbackSource, /useRejectFeedback/);
  assert.match(adminFeedbackSource, /useFeatureFeedback/);
  assert.match(adminFeedbackSource, /useUnfeatureFeedback/);
  assert.match(adminFeedbackSource, /BarChart/);
  assert.match(adminFeedbackSource, /ResponsiveContainer/);
});

test('Landing Testimonials: consumes public feedback envelope without computing fake counts or fake photos', () => {
  const landingSource = readFileSync(
    new URL('../src/components/features/landing/MarketingLanding.tsx', import.meta.url),
    'utf8'
  );
  const testimonialsSource = readFileSync(
    new URL('../src/components/features/landing/LandingTestimonials.tsx', import.meta.url),
    'utf8'
  );

  assert.match(landingSource, /<LandingTestimonials \/>/);
  assert.match(testimonialsSource, /usePublicFeedback/);
  assert.match(testimonialsSource, /ratingCount/);
  assert.match(testimonialsSource, /averageRating/);
  // Cleanly hides when 0 items or error
  assert.match(testimonialsSource, /if\s*\(isLoading\s*\|\|\s*isError\s*\|\|\s*!data\s*\|\|\s*data\.items\.length === 0\)\s*\{\s*return null;\s*\}/);
  // Respects reduced motion
  assert.match(testimonialsSource, /prefers-reduced-motion/);
  // No fake photo avatars: initials only
  assert.doesNotMatch(testimonialsSource, /<img.*avatar/);
  assert.doesNotMatch(testimonialsSource, /randomuser\.me/);
});
