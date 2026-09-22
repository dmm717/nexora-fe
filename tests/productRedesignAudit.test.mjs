import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Brand: AuthenticatedHeader uses official NexoraLogo and removes synthetic blue N square', async () => {
  const headerSource = await readSource('../src/components/header/AuthenticatedHeader.tsx');
  assert.match(headerSource, /import\s*\{\s*NexoraLogo\s*\}\s*from\s*['"]@\/components\/brand\/NexoraLogo['"]/);
  assert.match(headerSource, /<NexoraLogo\s+variant="horizontal"/);
  assert.doesNotMatch(headerSource, /<div[^>]*bg-primary[^>]*>\s*N\s*<\/div>/);
});

test('Primitives: Card supports selected variant with active primary border and subtle ring', async () => {
  const cardSource = await readSource('../src/components/ui/Card.tsx');
  assert.match(cardSource, /'elevated'\s*\|\s*'flat'\s*\|\s*'subtle'\s*\|\s*'interactive'\s*\|\s*'selected'/);
  assert.match(cardSource, /selected:\s*'[^']*border-2 border-primary/);
});

test('Pricing: isCurrentPlan owns selection border while isHighlight receives prominent badge', async () => {
  const pricingCardsSource = await readSource('../src/components/features/pricing/PricingCards.tsx');
  assert.match(
    pricingCardsSource,
    /isCurrentPlan\s*\?\s*['"]border-2 border-primary shadow-floating bg-primary-fixed\/5 ring-4 ring-primary-fixed\/20/
  );
  assert.doesNotMatch(
    pricingCardsSource,
    /isHighlight\s*\?\s*['"]border-2 border-primary shadow-floating/
  );
  assert.doesNotMatch(
    pricingCardsSource,
    /Thông tin quyền lợi được cung cấp trực tiếp từ cấu hình gói/
  );
  assert.match(
    pricingCardsSource,
    /Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn/
  );
});

test('Billing: Order transaction status mapping localizes processing and other statuses', async () => {
  const billingPresentationSource = await readSource('../src/services/billingPresentation.ts');
  assert.match(billingPresentationSource, /case ['"]processing['"]:\s*return\s*\{\s*label:\s*['"]Đang xử lý['"]/);
  assert.match(billingPresentationSource, /case ['"]fulfilled['"]:/);
  assert.match(billingPresentationSource, /label:\s*['"]Thành công['"]/);
  assert.match(billingPresentationSource, /case ['"]pending['"]:/);
  assert.match(billingPresentationSource, /label:\s*['"]Đang chờ['"]/);
  assert.match(billingPresentationSource, /case ['"]failed['"]:/);
  assert.match(billingPresentationSource, /label:\s*['"]Thất bại['"]/);
  assert.match(billingPresentationSource, /case ['"]cancelled['"]:/);
  assert.match(billingPresentationSource, /label:\s*['"]Đã hủy['"]/);
});

test('CV Analysis: Inline validation message concatenation bug is fixed with structured list', async () => {
  const resumeAnalysesSource = await readSource('../src/app/(dashboard)/resume-analyses/page.tsx');
  assert.doesNotMatch(
    resumeAnalysesSource,
    /\{useCurrentGoal && !hasPrimaryResume && '• Vui lòng bổ sung CV chính trước khi phân tích'\}\s*\{/
  );
  assert.match(resumeAnalysesSource, /validationItems\.push\('Vui lòng bổ sung CV chính trước khi phân tích'\)/);
  assert.match(resumeAnalysesSource, /validationItems\.map\(/);
  assert.match(resumeAnalysesSource, /Sẵn sàng phân tích với dữ liệu hiện tại/);
});

test('Copywriting Anti-Slop: Technical testing and machine jargon phrases are removed', async () => {
  const [
    resumeAnalysesSource,
    resumeAnalysesDetailSource,
    overviewSource,
    analyticsSource,
    practiceHubSource,
    starPracticeSource,
    scenarioPracticeSource,
    scenarioEvaluationSource,
    interviewReportSource,
    paymentResultSource,
    requireAuthSource,
  ] = await Promise.all([
    readSource('../src/app/(dashboard)/resume-analyses/page.tsx'),
    readSource('../src/app/(dashboard)/resume-analyses/[id]/page.tsx'),
    readSource('../src/app/(dashboard)/overview/page.tsx'),
    readSource('../src/app/(dashboard)/analytics/page.tsx'),
    readSource('../src/components/features/practice/PracticeHub.tsx'),
    readSource('../src/components/features/practice/StarPractice.tsx'),
    readSource('../src/components/features/scenarios/ScenarioPractice.tsx'),
    readSource('../src/components/features/scenarios/ScenarioEvaluationView.tsx'),
    readSource('../src/app/(dashboard)/interviews/[id]/report/page.tsx'),
    readSource('../src/components/features/payment/PaymentResultPage.tsx'),
    readSource('../src/components/providers/RequireAuth.tsx'),
  ]);

  // "snapshot bất biến" & "Immutable Snapshot"
  assert.doesNotMatch(resumeAnalysesSource, /snapshot bất biến/);
  assert.doesNotMatch(resumeAnalysesDetailSource, /Bất biến/);
  assert.doesNotMatch(interviewReportSource, /Immutable Snapshot/);
  assert.doesNotMatch(interviewReportSource, /Bản chụp bối cảnh lịch sử/);
  assert.match(interviewReportSource, /Bối cảnh của báo cáo/);
  assert.match(interviewReportSource, /Bản lưu trữ/);

  // "lưu vết trực tiếp tại đây" and "lưu vết đầy đủ tại đây"
  assert.doesNotMatch(overviewSource, /lưu vết/);
  assert.doesNotMatch(practiceHubSource, /lưu vết/);

  // Leaked defensive disclaimers & "máy chủ" in candidate UI
  assert.doesNotMatch(overviewSource, /Nexora không suy luận rằng hồ sơ/);
  assert.doesNotMatch(overviewSource, /Không có điểm số nào được suy luận thay thế/);
  assert.doesNotMatch(overviewSource, /mà không tự suy luận trạng thái/);
  assert.doesNotMatch(overviewSource, /Progress Dashboard/);
  assert.doesNotMatch(overviewSource, /máy chủ/);
  assert.doesNotMatch(analyticsSource, /Không suy luận điểm số hoặc tình trạng bằng chứng/);
  assert.doesNotMatch(analyticsSource, /Progress Dashboard/);
  assert.doesNotMatch(analyticsSource, /máy chủ/);
  assert.doesNotMatch(starPracticeSource, /máy chủ/);
  assert.doesNotMatch(starPracticeSource, /SignalR/);
  assert.doesNotMatch(starPracticeSource, /REST/);
  assert.doesNotMatch(scenarioPracticeSource, /máy chủ/);
  assert.doesNotMatch(scenarioPracticeSource, /suy đoán/);
  assert.doesNotMatch(scenarioEvaluationSource, /máy chủ/);
  assert.doesNotMatch(paymentResultSource, /máy chủ/);
  assert.doesNotMatch(requireAuthSource, /máy chủ/);
});

test('Landing: cvDemoStage defaults to result so visitors see outcomes without clicking', async () => {
  const landingSource = await readSource('../src/components/features/landing/MarketingLanding.tsx');
  assert.match(landingSource, /const\s*\[cvDemoStage,\s*setCvDemoStage\]\s*=\s*useState<CvDemoStage>\('result'\)/);
  assert.doesNotMatch(landingSource, /const\s*\[cvDemoStage,\s*setCvDemoStage\]\s*=\s*useState<CvDemoStage>\('empty'\)/);
});

test('Billing & Account: Order status safely falls back to localized label and avoids raw enum strings', async () => {
  const [billingPageSource, planUsageCardSource, adminDashboardSource] = await Promise.all([
    readSource('../src/app/(dashboard)/billing/page.tsx'),
    readSource('../src/components/features/account/PlanUsageCard.tsx'),
    readSource('../src/components/features/admin/dashboard/AdminDashboardScreen.tsx'),
  ]);

  // Billing page uses shared getOrderStatusPresentation and removes local duplicate
  assert.match(billingPageSource, /import\s*\{[^}]*getOrderStatusPresentation[^}]*\}\s*from\s*['"]@\/services\/billingPresentation['"]/);
  assert.doesNotMatch(billingPageSource, /function getOrderStatusPresentation\s*\(/);

  // PlanUsageCard uses getOrderStatusPresentation
  assert.match(planUsageCardSource, /import\s*\{\s*getOrderStatusPresentation\s*\}\s*from\s*['"]@\/services\/billingPresentation['"]/);
  assert.match(planUsageCardSource, /const statusPresentation = getOrderStatusPresentation\(order\.status\)/);
  assert.doesNotMatch(planUsageCardSource, /<Badge[^>]*>\s*\{order\.status\}\s*<\/Badge>/);
  assert.doesNotMatch(planUsageCardSource, /text-\[11px\]/);

  // AdminDashboard StatusBadge safe fallback
  assert.match(adminDashboardSource, /statusLabels\[status\]\s*\?\?\s*['"]Đang cập nhật['"]/);
});

test('Popular Plan Marker: Uses prominent detached badge and avoids micro-labels', async () => {
  const [pricingCardsSource, billingPageSource] = await Promise.all([
    readSource('../src/components/features/pricing/PricingCards.tsx'),
    readSource('../src/app/(dashboard)/billing/page.tsx'),
  ]);

  // PricingCards prominent detached badge with Sparkles
  assert.match(pricingCardsSource, /isHighlight\s*&&\s*\(/);
  assert.match(pricingCardsSource, /absolute -top-3\.5 left-1\/2 -translate-x-1\/2/);
  assert.match(pricingCardsSource, /Sparkles/);
  assert.match(pricingCardsSource, /text-xs font-bold/);

  // BillingPage prominent detached badge with sparkles icon
  assert.match(billingPageSource, /isHighlighted\s*&&\s*\(/);
  assert.match(billingPageSource, /absolute -top-3\.5 left-1\/2 -translate-x-1\/2/);
  assert.match(billingPageSource, /text-xs font-bold/);
  assert.doesNotMatch(billingPageSource, /text-\[10px\] font-extrabold/);
});

test('LandingPlanCard: Does not have raw unconfigured database descriptions', async () => {
  const landingPlanSource = await readSource('../src/components/features/landing/LandingPlanCard.tsx');
  assert.doesNotMatch(landingPlanSource, /Thông tin mô tả gói chưa được cung cấp/);
  assert.doesNotMatch(landingPlanSource, /Chưa có thông tin tính năng cho mức giá này/);
  assert.match(landingPlanSource, /Gói dịch vụ được thiết kế tối ưu cho nhu cầu rèn luyện phỏng vấn của bạn/);
});

test('Landing Pricing Redesign: Base cards have visible boundary, prominent recommendation marker, and readable typography', async () => {
  const [landingCss, landingCardSource] = await Promise.all([
    readSource('../src/components/features/landing/landing.module.css'),
    readSource('../src/components/features/landing/LandingPlanCard.tsx'),
  ]);

  // Base card has visible border and white surface
  assert.match(landingCss, /\.planCard\s*\{[^}]*border:\s*1px solid/);
  assert.match(landingCss, /\.planCard\s*\{[^}]*background:\s*#ffffff/);

  // Popular plan has detached recommendation badge with Sparkles
  assert.match(landingCardSource, /isHighlighted\s*&&\s*\(/);
  assert.match(landingCardSource, /Sparkles/);
  assert.match(landingCardSource, /styles\.popularBadge/);
  assert.match(landingCss, /\.popularBadge\s*\{[^}]*position:\s*absolute/);
  assert.match(landingCss, /\.popularBadge\s*\{[^}]*top:\s*-\d+px/);
  assert.match(landingCss, /\.popularBadge\s*\{[^}]*font-size:\s*12px/);

  // Micro-typography has been eliminated (no 9px, 10px, or 11px decision text)
  assert.doesNotMatch(landingCss, /\.planBadge\s*\{[^}]*font-size:\s*9px/);
  assert.doesNotMatch(landingCss, /\.planDescription\s*\{[^}]*font-size:\s*11px/);
  assert.doesNotMatch(landingCss, /\.planCard\s+li\s*\{[^}]*font-size:\s*10px/);
  assert.doesNotMatch(landingCss, /\.planCard\s+\.primaryAction\s*\{[^}]*font-size:\s*11px/);

  // Plan typography is readable (12-14px)
  assert.match(landingCss, /\.planDescription\s*\{[^}]*font-size:\s*13px/);
  assert.match(landingCss, /\.planCard\s+li\s*\{[^}]*font-size:\s*13px/);
  assert.match(landingCss, /\.planCard\s+\.primaryAction\s*\{[^}]*font-size:\s*13px/);
});

test('Audit Document: Contains only actual file paths and accurate statuses', async () => {
  const auditDocSource = await readSource('../docs/PRODUCT_UI_AUDIT.md');

  // No invented / nonexistent paths
  assert.doesNotMatch(auditDocSource, /src\/app\/auth\/login\/page\.tsx/);
  assert.doesNotMatch(auditDocSource, /src\/app\/auth\/register\/page\.tsx/);
  assert.doesNotMatch(auditDocSource, /src\/components\/features\/interviews\/AudioSpeechDock\.tsx/);
  assert.doesNotMatch(auditDocSource, /TargetRolesSection\.tsx/);

  // Correct actual paths exist
  assert.match(auditDocSource, /src\/app\/auth\/page\.tsx/);
  assert.match(auditDocSource, /src\/components\/features\/interview\/AudioSpeechDock\.tsx/);

  // Unmodified files are not falsely marked as MODIFIED
  assert.doesNotMatch(auditDocSource, /src\/app\/globals\.css[^|]*\|\s*\*\*MODIFIED\*\*/);
  assert.doesNotMatch(auditDocSource, /src\/components\/ui\/Badge\.tsx[^|]*\|\s*\*\*MODIFIED\*\*/);
  assert.match(auditDocSource, /src\/app\/globals\.css[^|]*\|\s*\*\*INSPECTED \/ NO CHANGE NEEDED\*\*/);
  assert.match(auditDocSource, /src\/components\/ui\/Badge\.tsx[^|]*\|\s*\*\*INSPECTED \/ NO CHANGE NEEDED\*\*/);
});
