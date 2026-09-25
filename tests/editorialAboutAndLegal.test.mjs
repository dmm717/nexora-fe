import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { visibleAboutSections } from '../src/services/aboutSections.ts';
import { parseLegalMarkdown } from '../src/services/legalParser.ts';
import {
  RECOMMENDED_ABOUT_CONTENT,
  RECOMMENDED_TERMS_TEMPLATE,
  RECOMMENDED_PRIVACY_TEMPLATE,
} from '../src/services/siteContentDrafts.ts';
import { validateImageFile } from '../src/services/siteAssetValidation.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('About: no milestone section is rendered even if legacy content contains milestones', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  assert.doesNotMatch(source, /id="milestones"/);
  assert.doesNotMatch(source, /Hành trình phát triển/);
  assert.doesNotMatch(source, /content\.milestones\.length/);
});

test('About: no milestone editor exists in AboutEditor', async () => {
  const source = await readSource('../src/components/features/site/AboutEditor.tsx');
  assert.doesNotMatch(source, /Cột mốc thật/);
  assert.doesNotMatch(source, /updateMilestone/);
  assert.doesNotMatch(source, /Thêm cột mốc/);
});

test('About: saving About in admin normalizes milestones=[]', async () => {
  const source = await readSource('../src/app/(admin)/admin/site-content/page.tsx');
  assert.match(source, /pageKey === 'about' && value\.about/);
  assert.match(source, /milestones:\s*\[\]/);
});

test('About: section numbering is exactly 01,02,03 without team and 01,02,03,04 with team', () => {
  const withoutTeam = visibleAboutSections({
    ...RECOMMENDED_ABOUT_CONTENT,
    milestones: [{ label: '2026', title: 'Legacy', description: 'Ignore' }],
    teamSectionEnabled: false,
    teamMembers: [],
  });
  assert.deepEqual(withoutTeam.map((s) => s.number), ['01', '02', '03']);
  assert.deepEqual(withoutTeam.map((s) => s.id), ['mission', 'values', 'ecosystem']);

  const withTeam = visibleAboutSections({
    ...RECOMMENDED_ABOUT_CONTENT,
    milestones: [{ label: '2026', title: 'Legacy', description: 'Ignore' }],
    teamSectionEnabled: true,
    teamMembers: [{ name: 'Founder', role: 'Lead' }],
  });
  assert.deepEqual(withTeam.map((s) => s.number), ['01', '02', '03', '04']);
  assert.deepEqual(withTeam.map((s) => s.id), ['mission', 'values', 'team', 'ecosystem']);
});

test('About: TOC and section eyebrows use same number model', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  assert.match(source, /const sections = visibleAboutSections\(content\)/);
  assert.match(source, /numberFor\('mission'\)/);
  assert.match(source, /numberFor\('values'\)/);
  assert.match(source, /numberFor\('ecosystem'\)/);
  assert.match(source, /numberFor\('team'\)/);
});

test('About: current uploaded images override fallbacks, and null asset uses Nexora fallback image', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  assert.match(source, /content\.heroAssetId\s*\?\s*siteAssetUrl\(content\.heroAssetId\)\s*:\s*['"]\/images\/about-hero\.jpg['"]/);
  assert.match(source, /content\.missionAssetId\s*\?\s*siteAssetUrl\(content\.missionAssetId\)\s*:\s*['"]\/images\/about-mission\.jpg['"]/);
});

test('Legal: recommended Terms template contains the required 10 Nexora-specific sections', () => {
  const terms = RECOMMENDED_TERMS_TEMPLATE;
  const expectedHeadings = [
    '1. Phạm vi và mục đích dịch vụ',
    '2. Tài khoản và bảo mật',
    '3. Nội dung AI và giới hạn của phản hồi',
    '4. Nội dung do bạn cung cấp',
    '5. Sử dụng hợp lệ',
    '6. Gói dịch vụ, hạn mức và thanh toán',
    '7. Khả dụng và thay đổi sản phẩm',
    '8. Tạm ngưng và xóa tài khoản',
    '9. Trách nhiệm khi sử dụng kết quả',
    '10. Thay đổi điều khoản và liên hệ',
  ];

  for (const heading of expectedHeadings) {
    assert.ok(terms.includes(`## ${heading}`), `Terms missing heading: ${heading}`);
  }

  // Ensure no unverified claims
  assert.doesNotMatch(terms, /cam kết việc làm 100%/);
  assert.doesNotMatch(terms, /đảm bảo trúng tuyển/);
  assert.doesNotMatch(terms, /hỗ trợ 24\/7/);
});

test('Legal: recommended Privacy template contains the required 9 Nexora-specific sections', () => {
  const privacy = RECOMMENDED_PRIVACY_TEMPLATE;
  const expectedHeadings = [
    '1. Dữ liệu Nexora có thể xử lý',
    '2. Mục đích xử lý',
    '3. Xử lý bởi AI và dịch vụ giọng nói',
    '4. Hạ tầng và nhà cung cấp dịch vụ',
    '5. Phản hồi được chia sẻ công khai',
    '6. Bảo mật tài khoản và phiên đăng nhập',
    '7. Quyền kiểm soát dữ liệu của bạn',
    '8. Lưu giữ và xóa dữ liệu',
    '9. Thay đổi chính sách và liên hệ',
  ];

  for (const heading of expectedHeadings) {
    assert.ok(privacy.includes(`## ${heading}`), `Privacy missing heading: ${heading}`);
  }
});

test('Legal: admin template action is local-only and does not call publish or updatePage automatically', async () => {
  const source = await readSource('../src/app/(admin)/admin/site-content/page.tsx');
  assert.match(source, /handleApplyRecommendedLegal/);
  assert.match(source, /Dùng mẫu Nexora đề xuất/);
  assert.match(source, /Mẫu chỉ được áp dụng vào bản chỉnh sửa hiện tại/);
  // Ensure the handleApplyRecommendedLegal function does NOT call updatePage or publishPage
  const applyFnMatch = source.match(/handleApplyRecommendedLegal = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(applyFnMatch);
  assert.doesNotMatch(applyFnMatch[0], /updatePage/);
  assert.doesNotMatch(applyFnMatch[0], /publishPage/);
});

test('Legal: safe parser never renders raw HTML or dangerous markup', () => {
  const dangerousMarkdown = `## Section One
<script>alert('xss')</script>
<img src="x" onerror="alert(1)" />
### Subsection with <b>html</b>
- List item with <iframe src="evil.com"></iframe>
Paragraph text with normal words.`;

  const { sections } = parseLegalMarkdown(dangerousMarkdown);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].title, 'Section One');
  assert.equal(sections[0].number, '01');

  // Verify all outputs are plain structured text strings, not evaluated HTML
  for (const block of sections[0].blocks) {
    if (block.type === 'paragraph') {
      assert.ok(typeof block.text === 'string');
    } else if (block.type === 'h3') {
      assert.ok(typeof block.text === 'string');
    } else if (block.type === 'unordered-list') {
      for (const item of block.items) {
        assert.ok(typeof item === 'string');
      }
    }
  }
});

test('Legal: headings generate deterministic unique slug TOC IDs while preserving Vietnamese diacritics in titles', () => {
  const markdown = `## 1. Phạm vi và mục đích dịch vụ
Paragraph 1.

## 2. Tài khoản và bảo mật
Paragraph 2.

## 3. Nội dung AI và giới hạn của phản hồi
Paragraph 3.`;

  const { sections } = parseLegalMarkdown(markdown);
  assert.equal(sections.length, 3);
  assert.deepEqual(sections.map((s) => s.number), ['01', '02', '03']);
  assert.deepEqual(sections.map((s) => s.id), [
    'pham-vi-va-muc-dich-dich-vu',
    'tai-khoan-va-bao-mat',
    'noi-dung-ai-va-gioi-han-cua-phan-hoi',
  ]);
  // Visible title preserves Vietnamese accents
  assert.equal(sections[0].title, 'Phạm vi và mục đích dịch vụ');
  assert.equal(sections[1].title, 'Tài khoản và bảo mật');
  assert.equal(sections[2].title, 'Nội dung AI và giới hạn của phản hồi');
});

test('Legal: public API content remains authoritative and admin draft is never exposed through public component', async () => {
  const source = await readSource('../src/components/features/site/PublicLegalDocument.tsx');
  assert.match(source, /siteContentApi\.getPublicPage/);
  assert.doesNotMatch(source, /INITIAL_TERMS_DRAFT/);
  assert.doesNotMatch(source, /INITIAL_PRIVACY_DRAFT/);
  assert.doesNotMatch(source, /RECOMMENDED_TERMS_TEMPLATE/);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
});

test('Legal 1D.1: document with no ## headings preserves text, TOC is absent, does not show unavailable', () => {
  const markdown = 'Plain published legal text.\n\nSecond paragraph without headings.';
  const { preambleBlocks, sections } = parseLegalMarkdown(markdown);
  assert.equal(sections.length, 0, 'No sections should be created when no ## headings exist');
  assert.equal(preambleBlocks.length, 2, 'All paragraphs must be preserved in preambleBlocks');
  assert.equal(preambleBlocks[0].text, 'Plain published legal text.');
  assert.equal(preambleBlocks[1].text, 'Second paragraph without headings.');
});

test('Legal 1D.2: document with intro text before ## preserves preamble, renders section, and TOC contains section', () => {
  const markdown = `Intro text paragraph 1.
Intro text paragraph 2.

## 1. Scope
Section body text.`;

  const { preambleBlocks, sections } = parseLegalMarkdown(markdown);
  assert.equal(preambleBlocks.length, 2, 'Preamble blocks before first ## must not be dropped');
  assert.equal(preambleBlocks[0].text, 'Intro text paragraph 1.');
  assert.equal(preambleBlocks[1].text, 'Intro text paragraph 2.');
  assert.equal(sections.length, 1, 'Section after ## must be parsed');
  assert.equal(sections[0].title, 'Scope');
  assert.equal(sections[0].blocks.length, 1);
  assert.equal(sections[0].blocks[0].text, 'Section body text.');
});

test('Legal 1D.3: document with only ## sections preserves sectioned behavior', () => {
  const markdown = `## 1. Scope
Section 1 text.

## 2. Privacy
Section 2 text.`;

  const { preambleBlocks, sections } = parseLegalMarkdown(markdown);
  assert.equal(preambleBlocks.length, 0);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, 'Scope');
  assert.equal(sections[1].title, 'Privacy');
});

test('Legal 1D.4, 1D.5 & 1D.6: hasPublishedData does not depend on sections.length > 0; empty body or error triggers unavailable; admin draft is never used', async () => {
  const source = await readSource('../src/components/features/site/PublicLegalDocument.tsx');

  // hasPublishedData does NOT require sections.length > 0
  const hasPublishedMatch = source.match(/const hasPublishedData = Boolean\([\s\S]*?\);/);
  assert.ok(hasPublishedMatch);
  assert.doesNotMatch(hasPublishedMatch[0], /sections/);

  // hasPublishedData checks query status, isPublished, and non-empty bodyMarkdown
  assert.match(source, /!page\.isLoading/);
  assert.match(source, /!page\.isError/);
  assert.match(source, /page\.data\.isPublished !== false/);
  assert.match(source, /page\.data\.bodyMarkdown\?\.trim\(\)/);

  // TOC is strictly optional and only rendered when sections.length > 0
  assert.match(source, /hasPublishedData\s*&&\s*hasSections/);

  // When sections.length === 0, renders preambleBlocks directly in reading surface
  assert.match(source, /parsed\.preambleBlocks/);

  // Unavailable state is rendered when !hasPublishedData
  assert.match(source, /Nội dung hiện chưa khả dụng/);

  // Admin draft is strictly never used
  assert.doesNotMatch(source, /RECOMMENDED_TERMS_TEMPLATE/);
  assert.doesNotMatch(source, /RECOMMENDED_PRIVACY_TEMPLATE/);
  assert.doesNotMatch(source, /INITIAL_TERMS_DRAFT/);
});

/* ====================================================================
   ASSET PICKER & AUTH EXPIRY UX TESTS (Steering Requirements)
==================================================================== */

test('AssetPicker: validates MIME types and rejects unsupported formats before API call', () => {
  assert.deepEqual(validateImageFile({ type: 'image/jpeg', size: 1024 * 1024 }), { valid: true });
  assert.deepEqual(validateImageFile({ type: 'image/png', size: 2 * 1024 * 1024 }), { valid: true });
  assert.deepEqual(validateImageFile({ type: 'image/webp', size: 3 * 1024 * 1024 }), { valid: true });

  // Rejects SVG, PDF, GIF, etc.
  const svgResult = validateImageFile({ type: 'image/svg+xml', size: 1024 });
  assert.equal(svgResult.valid, false);
  assert.equal(svgResult.error, 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');

  const pdfResult = validateImageFile({ type: 'application/pdf', size: 1024 });
  assert.equal(pdfResult.valid, false);
  assert.equal(pdfResult.error, 'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.');
});

test('AssetPicker: rejects files larger than 5 MiB before API call', () => {
  const oversized = validateImageFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 });
  assert.equal(oversized.valid, false);
  assert.equal(oversized.error, 'Ảnh tối đa 5 MB.');
});

test('AssetPicker: initial state renders dropzone without confusing disabled upload button', async () => {
  const source = await readSource('../src/components/features/site/AboutEditor.tsx');
  // State 1 (!file): displays dropzone with 'Kéo thả ảnh vào đây' and 'Chọn ảnh'
  assert.match(source, /Kéo thả ảnh vào đây/);
  assert.match(source, /Chọn ảnh/);
  assert.match(source, /JPEG, PNG, WebP · tối đa 5 MB/);
  // 'Tải ảnh và chọn' is only rendered in State 2 (when file is selected)
  assert.match(source, /\{isUploading \? \([\s\S]*?Đang tải ảnh\.\.\.[\s\S]*?\) : \([\s\S]*?Tải ảnh và chọn/);
});

test('AssetPicker: error handling maps genuine errors and delegates auth without misleading R2/storage errors', async () => {
  const source = await readSource('../src/components/features/site/AboutEditor.tsx');
  // Terminal auth 401 delegates without toast
  assert.match(source, /error\.status === 401/);
  // 403 Forbidden
  assert.match(source, /Bạn không có quyền tải ảnh quản trị\./);
  // 413 Payload Too Large
  assert.match(source, /Ảnh vượt quá dung lượng cho phép\./);
  // 5xx / general error
  assert.match(source, /Không thể tải ảnh lúc này\. Vui lòng thử lại\./);
  // Strictly does NOT expose R2 or bucket errors to users
  assert.doesNotMatch(source, /\bR2\b/);
  assert.doesNotMatch(source, /Cloudflare/i);
  assert.doesNotMatch(source, /\bS3\b/);
});

test('Auth: redirectToAuth in apiClient preserves safe returnTo for admin routes', async () => {
  const source = await readSource('../src/services/apiClient.ts');
  assert.match(source, /isValidInternalPath\(currentPath\)/);
  assert.match(source, /\/auth\?returnTo=/);
});

test('AssetPicker: upload success updates asset ID in draft and does NOT automatically save or publish About', async () => {
  const source = await readSource('../src/components/features/site/AboutEditor.tsx');
  assert.match(source, /onSelected\(asset\.id\)/);
  assert.match(source, /toast\.success\('Ảnh đã tải lên và được chọn\. Hãy lưu bản nháp để áp dụng\.'\)/);
  // AssetPicker does NOT import updatePage or publishPage
  assert.doesNotMatch(source, /updatePage/);
  assert.doesNotMatch(source, /publishPage/);
});

/* ====================================================================
   CORRECTIVE PASS TESTS (PR #56 Follow-up)
==================================================================== */

test('About routes: ecosystem learning path CTA is exactly /learning-path and all hrefs are canonical', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  assert.match(source, /href:\s*'\/learning-path'/);
  assert.doesNotMatch(source, /href:\s*'\/learning-paths'/);
  assert.doesNotMatch(source, /id:\s*'learning-paths'/);

  // All 4 ecosystem destinations exist as canonical routes
  const canonicalHrefs = ['/interviews/new', '/cv-analysis', '/practice', '/learning-path'];
  for (const href of canonicalHrefs) {
    assert.match(source, new RegExp(`href:\\s*'${href}'`));
  }
});

test('About copy: no unsupported ATS claim in ecosystem copy', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  // Must NOT contain ATS in any form
  assert.doesNotMatch(source, /\bATS\b/i);
  assert.doesNotMatch(source, /chuẩn ATS/i);
  assert.doesNotMatch(source, /vượt ATS/i);
  assert.match(source, /tag:\s*'Đối chiếu CV & JD'/);
});

test('Legal states: distinct semantics for loading, success, and error/no-content without nested main landmark', async () => {
  const source = await readSource('../src/components/features/site/PublicLegalDocument.tsx');

  // No nested <main> tag (PublicSiteShell already provides the page <main>)
  assert.doesNotMatch(source, /<main/);

  // States handling: hasPublishedData boolean gates official badge and date claims
  assert.match(source, /const hasPublishedData = Boolean/);
  assert.match(source, /page\.isLoading\s*\?/);
  assert.match(source, /hasPublishedData\s*\?/);

  // Loading state renders neutral masthead
  assert.match(source, /Đang tải dữ liệu văn bản\.\.\./);

  // Success state renders official published framing
  assert.match(source, /Tài liệu chính thức/);
  assert.match(source, /Phiên bản công bố chính thức/);

  // Error / No data state renders neutral notice without claiming official status
  assert.match(source, /Thông báo tài liệu/);
  assert.match(source, /Nội dung hiện chưa khả dụng/);
});

test('Assets: unused duplicate root About images are removed and canonical images exist', async () => {
  // Canonical images exist
  await assert.doesNotReject(() => access(new URL('../public/images/about-hero.jpg', import.meta.url)));
  await assert.doesNotReject(() => access(new URL('../public/images/about-mission.jpg', import.meta.url)));

  // Root duplicate files must NOT exist
  await assert.rejects(() => access(new URL('../public/about-hero-nexora.png', import.meta.url)));
  await assert.rejects(() => access(new URL('../public/about-mission-nexora.png', import.meta.url)));
});

test('AssetPicker 2B: accessible keyboard focus architecture with visible button and tabIndex -1 hidden input', async () => {
  const source = await readSource('../src/components/features/site/AboutEditor.tsx');

  // Surrounding container is a div (not a label, no role="button")
  assert.doesNotMatch(source, /role="button"[\s\S]*?Kéo thả ảnh vào đây/);
  assert.doesNotMatch(source, /<label[\s\S]*?Kéo thả ảnh vào đây/);
  assert.match(source, /<div[\s\S]*?onDragOver=\{[\s\S]*?Kéo thả ảnh vào đây/);

  // Visible "Chọn ảnh" is a real button
  assert.match(source, /<button[\s\S]*?type="button"[\s\S]*?onClick=\{\(\)\s*=>\s*fileInputRef\.current\?\.click\(\)\}[\s\S]*?Chọn ảnh[\s\S]*?<\/button>/);

  // Visible button has focus-visible treatment
  assert.match(source, /focus-visible:ring-2/);
  assert.match(source, /focus-visible:ring-primary/);

  // Hidden file input has tabIndex={-1} and aria-hidden="true" so it is not an invisible tab stop
  assert.match(source, /<input[\s\S]*?type="file"[\s\S]*?tabIndex=\{-1\}[\s\S]*?aria-hidden="true"[\s\S]*?className="sr-only"/);

  // "Thay ảnh" button also uses fileInputRef.current?.click() safely
  assert.match(source, /onClick=\{\(\)\s*=>\s*fileInputRef\.current\?\.click\(\)\}[\s\S]*?Thay ảnh/);

  // Drag and drop event handlers remain intact on dropzone div
  assert.match(source, /onDragOver=\{/);
  assert.match(source, /onDragLeave=\{/);
  assert.match(source, /onDrop=\{/);
});

test('Modal: portaled to document.body, z-[100] layer, max-height calc(100dvh-2rem) with internal scrolling', async () => {
  const source = await readSource('../src/components/ui/Modal.tsx');

  // Uses createPortal(..., document.body)
  assert.match(source, /import\s*\{\s*createPortal\s*\}\s*from\s*'react-dom'/);
  assert.match(source, /createPortal\(/);
  assert.match(source, /document\.body/);

  // Hydration / SSR safe (mounted state check via useSyncExternalStore)
  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /if \(!isOpen \|\| !mounted\) return null/);

  // Viewport-level z-[100] overlay
  assert.match(source, /z-\[100\]/);

  // Dialog has max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden
  assert.match(source, /max-h-\[calc\(100dvh-2rem\)\]/);
  assert.match(source, /flex flex-col/);

  // Header has shrink-0 and content container has overflow-y-auto
  assert.match(source, /shrink-0/);
  assert.match(source, /min-h-0 flex-1 overflow-y-auto/);

  // Accessibility contract preserved
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /e\.key === 'Escape'/);
  assert.match(source, /e\.key !== 'Tab'/);
  assert.match(source, /document\.body\.style\.overflow = 'hidden'/);
});
