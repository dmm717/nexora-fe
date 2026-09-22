import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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

test('Landing Testimonials: consumes public feedback envelope without computing fake data', () => {
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
  assert.match(testimonialsSource, /items\.length/);
  assert.match(testimonialsSource, /publishedAt/);
  assert.match(testimonialsSource, /Mới nhất trong danh sách/);
  assert.match(testimonialsSource, /Trong \$\{items\.length\} phản hồi đang hiển thị/);
  assert.doesNotMatch(testimonialsSource, /Cập nhật gần nhất/);
  assert.match(testimonialsSource, /Số liệu phản hồi/);
  assert.doesNotMatch(testimonialsSource, /Số liệu nền tảng/);
  // Cleanly hides when 0 items or error
  assert.match(testimonialsSource, /if\s*\(isLoading\s*\|\|\s*isError\s*\|\|\s*!data\s*\|\|\s*data\.items\.length === 0\)\s*\{\s*return null;\s*\}/);
  // Respects reduced motion
  assert.match(testimonialsSource, /prefers-reduced-motion/);
  // Future avatar URLs are optional and retain a safe initials fallback.
  assert.match(testimonialsSource, /item\.avatarUrl/);
  assert.match(testimonialsSource, /getInitials/);
  assert.doesNotMatch(testimonialsSource, /randomuser\.me/);
});

test('Public Feedback Contract: supports optional user avatars without requiring backend changes', () => {
  const contractSource = readFileSync(
    new URL('../src/services/feedbackContract.ts', import.meta.url),
    'utf8'
  );

  assert.match(contractSource, /interface PublicFeedbackItem/);
  assert.match(contractSource, /avatarUrl\?: string \| null/);
  assert.match(contractSource, /items: PublicFeedbackItem\[\]/);
});

test('Landing brand system: uses the supplied Nexora logo and canonical mascot assets', () => {
  const headerSource = readFileSync(
    new URL('../src/components/layouts/Header.tsx', import.meta.url),
    'utf8'
  );
  const footerSource = readFileSync(
    new URL('../src/components/layouts/Footer.tsx', import.meta.url),
    'utf8'
  );
  const brandAssetsSource = readFileSync(
    new URL('../src/config/brandAssets.ts', import.meta.url),
    'utf8'
  );

  assert.match(headerSource, /<NexoraLogo/);
  assert.match(footerSource, /<NexoraLogo/);
  assert.doesNotMatch(headerSource, />\s*N\s*<\/div>/);
  assert.doesNotMatch(footerSource, />\s*N\s*<\/div>/);
  assert.match(brandAssetsSource, /nexora-horizontal\.png/);
  assert.match(brandAssetsSource, /mascot-pointing-stats\.png/);
  assert.ok(existsSync(new URL('../public/assets/brand/nexora-horizontal.png', import.meta.url)));
  assert.ok(existsSync(new URL('../public/assets/mascot/mascot-pointing-stats.png', import.meta.url)));
});

test('Landing mascot system: wires several decorative poses into feature storytelling', () => {
  const landingSource = readFileSync(
    new URL('../src/components/features/landing/MarketingLanding.tsx', import.meta.url),
    'utf8'
  );
  const testimonialsSource = readFileSync(
    new URL('../src/components/features/landing/LandingTestimonials.tsx', import.meta.url),
    'utf8'
  );

  for (const pose of ['cvAnalysis', 'aiCoach', 'emptyHelper']) {
    assert.match(
      landingSource,
      new RegExp(`src=\\{NEXORA_MASCOT_ASSETS\\.${pose}\\}[\\s\\S]{0,180}alt=""[\\s\\S]{0,80}aria-hidden="true"`)
    );
  }
  assert.match(
    testimonialsSource,
    /src=\{NEXORA_MASCOT_ASSETS\.pointingStats\}[\s\S]{0,180}alt=""[\s\S]{0,80}aria-hidden="true"/
  );
  assert.match(testimonialsSource, /prefers-reduced-motion/);
  assert.doesNotMatch(
    `${landingSource}\n${testimonialsSource}`,
    /total users|interview count|mentor count|satisfaction count/i
  );
});
