import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('reduced motion keeps scrolling calm without freezing functional spinners', async () => {
  const globalCss = await source('src/app/globals.css');
  const reducedMotion = globalCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1];

  assert.ok(reducedMotion, 'global reduced-motion rules remain explicit');
  assert.doesNotMatch(reducedMotion, /(?:^|\n)\s*\*,\s*\n\s*\*::before/);
  assert.doesNotMatch(globalCss, /0\.01ms\s*!important/);
  assert.match(reducedMotion, /html\s*\{\s*scroll-behavior:\s*auto;/);
  assert.match(globalCss, /\.functional-spinner\s*\{[^}]*animation:\s*functional-spinner-rotate\s+0\.8s\s+linear\s+infinite/s);
  assert.match(reducedMotion, /\.functional-spinner\s*\{\s*animation:\s*functional-spinner-reduced-pulse\s+1\.6s\s+ease-in-out\s+infinite;/);
  assert.match(reducedMotion, /\.animate-spin\s*\{\s*animation:\s*functional-spinner-reduced-pulse/);
  assert.match(reducedMotion, /\.skeleton-shimmer::after\s*\{\s*animation:\s*none;/);
});

test('interview speaking and thinking states retain low-motion activity feedback', async () => {
  const interviewCss = await source('src/styles/interview-stage.css');
  const reducedMotion = interviewCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)?.[1];

  assert.match(interviewCss, /\.ai-presence\[data-state="speaking"\] \.ai-presence-bars i\s*\{\s*animation:\s*ai-speaking-bar/);
  assert.match(interviewCss, /\.ai-presence\[data-state="speaking"\] \.ai-orb\s*\{\s*animation:\s*ai-speaking-orb/);
  assert.match(interviewCss, /\.ai-presence\[data-state="speaking"\] \.ai-orb-ring\s*\{\s*animation:\s*ai-speaking-ring/);
  assert.ok(reducedMotion, 'interview has an explicit reduced-motion treatment');
  assert.match(reducedMotion, /data-state="speaking"\] \.ai-presence-bars i\s*\{\s*animation:\s*ai-reduced-speaking-bar/);
  assert.match(reducedMotion, /data-state="speaking"\] \.ai-orb\s*\{\s*animation:\s*ai-reduced-speaking-orb/);
  assert.match(reducedMotion, /data-state="speaking"\] \.ai-orb-ring\s*\{\s*animation:\s*ai-reduced-speaking-ring/);
  assert.match(reducedMotion, /data-state="thinking"\] \.ai-orb-ring\s*\{[^}]*ai-reduced-thinking-feedback/s);
  assert.doesNotMatch(reducedMotion, /\.interview-call-room\s*\*\s*,|animation:\s*none\s*!important/);
});

test('shared and route loading indicators use the functional spinner contract', async () => {
  const button = await source('src/components/ui/Button/Button.tsx');
  const routeFallback = await source('src/app/loading.tsx');
  const interview = await source('src/app/(dashboard)/interviews/[id]/page.tsx');
  const report = await source('src/app/(dashboard)/interviews/[id]/report/page.tsx');

  for (const markup of [button, routeFallback, interview, report]) {
    assert.match(markup, /functional-spinner/);
    assert.doesNotMatch(markup, /animate-spin/);
  }
  assert.match(interview, /functional-spinner w-6 h-6/);
  assert.match(report, /functional-spinner w-10 h-10/);
});
