import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

  const sections = parseLegalMarkdown(dangerousMarkdown);
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

  const sections = parseLegalMarkdown(markdown);
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
