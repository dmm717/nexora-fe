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

test('Landing social proof consumes authoritative public aggregates without fake fallback metrics', () => {
  const landingSource = readFileSync(
    new URL('../src/components/features/landing/MarketingLanding.tsx', import.meta.url),
    'utf8'
  );
  const testimonialsSource = readFileSync(
    new URL('../src/components/features/landing/LandingTestimonials.tsx', import.meta.url),
    'utf8'
  );
  const statsApiSource = readFileSync(
    new URL('../src/services/platformStatsApi.ts', import.meta.url),
    'utf8'
  );
  const statsHookSource = readFileSync(
    new URL('../src/hooks/queries/usePlatformStats.ts', import.meta.url),
    'utf8'
  );
  const testimonialsStyles = readFileSync(
    new URL('../src/components/features/landing/LandingTestimonials.module.css', import.meta.url),
    'utf8'
  );

  assert.match(landingSource, /<LandingTestimonials \/>/);
  assert.match(testimonialsSource, /usePublicFeedback/);
  assert.match(testimonialsSource, /usePlatformStats/);
  assert.match(statsApiSource, /apiClient\.get\('\/public\/platform-stats'\)/);
  assert.match(statsHookSource, /queryFn: platformStatsApi\.get/);
  for (const field of ['userCount', 'completedInterviewCount', 'completedCvAnalysisCount', 'averageRating', 'ratingCount']) {
    assert.match(testimonialsSource, new RegExp(`platformStats\\.${field}`));
  }
  assert.doesNotMatch(testimonialsSource, /Người dùng đang hoạt động/);
  assert.match(testimonialsSource, /label: 'Người dùng Nexora', value: formatCount\(platformStats\.userCount\)/);
  assert.match(testimonialsSource, /label: 'Lượt phân tích CV', value: formatCount\(platformStats\.completedCvAnalysisCount\)/);
  assert.match(testimonialsSource, /Mức độ hài lòng/);
  assert.match(testimonialsSource, /platformStats\.averageRating\.toFixed\(1\)\} \/ 5/);
  assert.doesNotMatch(testimonialsSource, /1\.2K|3\.4K|2\.1K|170\+/);
  assert.doesNotMatch(testimonialsSource, /Theo API|Không dùng số mẫu|dữ liệu dựng sẵn/);
  assert.match(testimonialsSource, /platformStats\s*\?\s*\[/);
  assert.match(testimonialsSource, /productProof/);
  // Either source can keep the section truthful; it hides only when neither has data.
  assert.match(testimonialsSource, /items\.length === 0 && !platformStats/);
  assert.match(testimonialsSource, /styles\.statsOnly/);
  // Respects reduced motion
  assert.match(testimonialsSource, /prefers-reduced-motion/);
  // Filled stars must win the summary cascade and remain visibly amber.
  assert.match(testimonialsStyles, /\.ratingSummary\s*>\s*div:first-child\s*>\s*span/);
  assert.match(testimonialsStyles, /\.stars\s*>\s*\.starFilled\s*\{[^}]*color:\s*#f1a81d/s);
  assert.match(testimonialsStyles, /\.stars\s*>\s*\.starEmpty\s*\{[^}]*color:\s*#d8d9e3/s);
  // One testimonial is content-sized instead of stretching into a tall card.
  assert.match(testimonialsSource, /data-count=\{items\.length\}/);
  assert.match(testimonialsStyles, /\.testimonialList\[data-count='1'\][\s\S]*?min-height:\s*0/);
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
  assert.match(brandAssetsSource, /mascot-testimonials\.png/);
  assert.ok(existsSync(new URL('../public/assets/brand/nexora-horizontal.png', import.meta.url)));
  assert.ok(existsSync(new URL('../public/assets/mascot/mascot-testimonials.png', import.meta.url)));
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

  for (const pose of ['cvAnalysis', 'aiCoach', 'celebrate']) {
    assert.match(
      landingSource,
      new RegExp(`src=\\{NEXORA_MASCOT_ASSETS\\.${pose}\\}[\\s\\S]{0,180}alt=""[\\s\\S]{0,80}aria-hidden="true"`)
    );
  }
  assert.match(
    testimonialsSource,
    /src=\{NEXORA_MASCOT_ASSETS\.testimonials\}[\s\S]{0,180}alt=""[\s\S]{0,80}aria-hidden="true"/
  );
  assert.match(testimonialsSource, /prefers-reduced-motion/);
  assert.doesNotMatch(
    `${landingSource}\n${testimonialsSource}`,
    /total users|interview count|mentor count|satisfaction count/i
  );
});

test('Landing copy keeps preview disclosure restrained and removes engineering meta-copy', () => {
  const landingSource = readFileSync(
    new URL('../src/components/features/landing/MarketingLanding.tsx', import.meta.url),
    'utf8'
  );
  const testimonialsSource = readFileSync(
    new URL('../src/components/features/landing/LandingTestimonials.tsx', import.meta.url),
    'utf8'
  );
  const productionCopy = `${landingSource}\n${testimonialsSource}`;

  assert.doesNotMatch(productionCopy, /Theo API|Không dùng số mẫu|dữ liệu dựng sẵn|Demo minh họa|Dữ liệu minh họa|giao diện mẫu/);
  assert.equal((productionCopy.match(/Xem trước trải nghiệm/g) ?? []).length, 1);
  assert.ok((productionCopy.match(/Ví dụ kết quả/g) ?? []).length <= 3);
});
