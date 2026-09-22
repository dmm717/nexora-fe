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
    /isCurrentPlan\s*\?\s*['"]border-2 border-primary shadow-floating scale-\[1\.02\]/
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
  const billingPageSource = await readSource('../src/app/(dashboard)/billing/page.tsx');
  assert.match(billingPageSource, /case ['"]processing['"]:\s*return\s*\{\s*label:\s*['"]Đang xử lý['"]/);
  assert.match(billingPageSource, /case ['"]fulfilled['"]:/);
  assert.match(billingPageSource, /label:\s*['"]Thành công['"]/);
  assert.match(billingPageSource, /case ['"]pending['"]:/);
  assert.match(billingPageSource, /label:\s*['"]Đang chờ['"]/);
  assert.match(billingPageSource, /case ['"]failed['"]:/);
  assert.match(billingPageSource, /label:\s*['"]Thất bại['"]/);
  assert.match(billingPageSource, /case ['"]cancelled['"]:/);
  assert.match(billingPageSource, /label:\s*['"]Đã hủy['"]/);
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
  ] = await Promise.all([
    readSource('../src/app/(dashboard)/resume-analyses/page.tsx'),
    readSource('../src/app/(dashboard)/resume-analyses/[id]/page.tsx'),
    readSource('../src/app/(dashboard)/overview/page.tsx'),
    readSource('../src/app/(dashboard)/analytics/page.tsx'),
    readSource('../src/components/features/practice/PracticeHub.tsx'),
  ]);

  // "snapshot bất biến"
  assert.doesNotMatch(resumeAnalysesSource, /snapshot bất biến/);
  assert.doesNotMatch(resumeAnalysesDetailSource, /Bất biến/);

  // "lưu vết trực tiếp tại đây" and "lưu vết đầy đủ tại đây"
  assert.doesNotMatch(overviewSource, /lưu vết/);
  assert.doesNotMatch(practiceHubSource, /lưu vết/);

  // Leaked defensive disclaimers
  assert.doesNotMatch(overviewSource, /Nexora không suy luận rằng hồ sơ/);
  assert.doesNotMatch(overviewSource, /Không có điểm số nào được suy luận thay thế/);
  assert.doesNotMatch(overviewSource, /mà không tự suy luận trạng thái/);
  assert.doesNotMatch(overviewSource, /Progress Dashboard chưa có trong gói hiện tại\. Các đề xuất độc lập/);
  assert.doesNotMatch(analyticsSource, /Không suy luận điểm số hoặc tình trạng bằng chứng/);
});

test('Landing: cvDemoStage defaults to result so visitors see outcomes without clicking', async () => {
  const landingSource = await readSource('../src/components/features/landing/MarketingLanding.tsx');
  assert.match(landingSource, /const\s*\[cvDemoStage,\s*setCvDemoStage\]\s*=\s*useState<CvDemoStage>\('result'\)/);
  assert.doesNotMatch(landingSource, /const\s*\[cvDemoStage,\s*setCvDemoStage\]\s*=\s*useState<CvDemoStage>\('empty'\)/);
});
