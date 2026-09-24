import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { visibleAboutSections } from '../src/services/aboutSections.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const base = { milestones: [], teamSectionEnabled: false, teamMembers: [] };

test('About numbering follows the visible sections (milestones removed)', () => {
  for (const [content, ids] of [
    [base, ['mission', 'values', 'ecosystem']],
    // Even if legacy content contains milestones, they must NOT be in visibleAboutSections
    [{ ...base, milestones: [{ label: '2026', title: 'Launch', description: '' }] }, ['mission', 'values', 'ecosystem']],
    [{ ...base, teamSectionEnabled: true, teamMembers: [{ name: 'A', role: 'B' }] }, ['mission', 'values', 'team', 'ecosystem']],
    [{ ...base, milestones: [{ label: '2026' }], teamSectionEnabled: true, teamMembers: [{ name: 'A' }] }, ['mission', 'values', 'team', 'ecosystem']],
  ]) {
    const sections = visibleAboutSections(content);
    assert.deepEqual(sections.map(({ id }) => id), ids);
    assert.deepEqual(sections.map(({ number }) => number), ids.map((_, index) => String(index + 1).padStart(2, '0')));
  }
});

test('About table of contents and section eyebrows consume the same number model without milestones', async () => {
  const source = await readSource('../src/app/about/page.tsx');
  assert.match(source, /const sections = visibleAboutSections\(content\)/);
  assert.match(source, /sections\.map\(\(\{ number, title, id \}\)/);
  for (const id of ['mission', 'values', 'team', 'ecosystem']) {
    assert.match(source, new RegExp(`numberFor\\('${id}'\\)`));
  }
  assert.doesNotMatch(source, /numberFor\('milestones'\)/);
  assert.doesNotMatch(source, /id="milestones"/);
  assert.doesNotMatch(source, /Hành trình phát triển/);
  assert.doesNotMatch(source, />05 \/ Nexora hỗ trợ/);
});

test('normal shells share one ambient ground while focused practice stays separate', async () => {
  const [publicShell, dashboard, css] = await Promise.all([
    readSource('../src/components/layouts/PublicSiteShell.tsx'),
    readSource('../src/components/layouts/DashboardLayout.tsx'),
    readSource('../src/styles/product-visual.css'),
  ]);
  assert.match(publicShell, /nexora-ambient-shell/);
  assert.match(publicShell, /nexora-editorial-shell/);
  assert.match(dashboard, /focused \? 'min-h-screen' : 'nexora-ambient-shell product-app-shell/);
  assert.match(css, /\.nexora-ambient-shell\s*\{[\s\S]*?radial-gradient/);
  assert.match(css, /\.nexora-editorial-shell\s*\{[\s\S]*?radial-gradient/);
  assert.match(css, /\.product-main-surface\s*\{[\s\S]*?background: transparent;/);
  assert.match(css, /\.site-footer\s*\{[\s\S]*?rgb\(239 244 255 \/ 78%\)/);
});

test('social marks are SVG, with distinct enabled and disabled states and reduced motion', async () => {
  const [footer, css] = await Promise.all([
    readSource('../src/components/layouts/Footer.tsx'),
    readSource('../src/styles/product-visual.css'),
  ]);
  assert.match(footer, /const FacebookMark[\s\S]*?<svg/);
  assert.match(footer, /const TikTokMark[\s\S]*?<svg/);
  assert.doesNotMatch(footer, /className="block text-center font-black">f/);
  assert.match(footer, /url \? \([\s\S]*?<a[\s\S]*?rel="noopener noreferrer"/);
  assert.match(footer, /footer-social--disabled/);
  assert.doesNotMatch(footer, /href="#"/);
  assert.match(css, /translateY\(-2px\) scale\(1\.06\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
