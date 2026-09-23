import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('Primitives: Card base variants have calibrated resting borders and focus affordances', async () => {
  const cardSource = await readSource('../src/components/ui/Card.tsx');

  // Resting borders should not use low-opacity washed out /30 or /60
  assert.match(cardSource, /elevated:\s*'bg-white border border-outline-variant\/80/);
  assert.match(cardSource, /flat:\s*'bg-white border border-outline-variant\/80/);
  assert.match(cardSource, /subtle:\s*'bg-surface-container-low border border-outline-variant\/60/);
  assert.match(cardSource, /interactive:\s*'bg-white border border-outline-variant\/80/);
  assert.match(cardSource, /focus-visible:ring-2 focus-visible:ring-primary/);
  assert.match(cardSource, /selected:\s*'[^']*border-2 border-primary/);
});

test('Primitives: Input.module.css removes legacy teal colors and provides calibrated borders & focus', async () => {
  const inputCss = await readSource('../src/components/ui/Input/Input.module.css');

  // Zero legacy teal rgba(0, 156, 166, ...)
  assert.doesNotMatch(inputCss, /rgba\(0,\s*156,\s*166/);

  // Uses design token outline-variant border and primary focus ring
  assert.match(inputCss, /border:\s*1px solid var\(--color-outline-variant/);
  assert.match(inputCss, /\.input:hover:not\(:disabled\):not\(:focus\)/);
  assert.match(inputCss, /border-color:\s*var\(--color-primary/);
});

test('Resume Analyses: Data source selector features persistent resting affordances and button toggle group semantics', async () => {
  const source = await readSource('../src/app/(dashboard)/resume-analyses/page.tsx');

  // Container has clear resting boundary
  assert.match(source, /bg-surface-container-low border border-outline-variant\/70/);

  // Group semantics with aria-pressed instead of fake tabs without tabpanels
  assert.match(source, /role="group"\s+aria-label="Nguồn dữ liệu phân tích"/);
  assert.match(source, /aria-pressed=\{useCurrentGoal\}/);
  assert.match(source, /aria-pressed=\{!useCurrentGoal\}/);

  // Both options have persistent visible neutral boundary at rest, no border-transparent
  assert.doesNotMatch(source, /border-transparent hover:border-outline-variant/);

  // Constant 1px border with ring accent for active state (zero layout shift)
  assert.match(source, /border-primary shadow-xs ring-1 ring-primary\/20/);
  assert.match(source, /border-outline-variant\/80 bg-white\/80 hover:border-outline hover:bg-white/);
});

test('Resume Analyses: Saved CV rows feature native radio group accessibility and constant 1px selection border', async () => {
  const source = await readSource('../src/app/(dashboard)/resume-analyses/page.tsx');

  // Native radio group semantics with fieldset, legend, and radio input
  assert.match(source, /<fieldset[^>]*className="pt-2 border-t border-outline-variant\/30 space-y-2">/);
  assert.match(source, /<legend[^>]*>Hoặc chọn từ CV đã lưu:<\/legend>/);
  assert.match(source, /type="radio"\s+name="existing_resume_selection"/);

  // Constant 1px border (no border-2 jump) with ring accent and focus-visible styling
  assert.match(source, /border-primary bg-primary-fixed\/20 text-primary font-bold shadow-xs ring-1 ring-primary\/30/);
  assert.match(source, /border-outline-variant\/80 hover:border-primary\/60 hover:bg-primary-fixed\/5/);
  assert.match(source, /has-\[:focus-visible\]:ring-2 has-\[:focus-visible\]:ring-primary/);
  assert.match(source, /check_circle/);
});

test('Resume Analyses: Comparison mode cards feature native radio group semantics and constant 1px selection border', async () => {
  const source = await readSource('../src/app/(dashboard)/resume-analyses/page.tsx');

  // Native radio semantics inside fieldset
  assert.match(source, /<fieldset className="space-y-2">/);
  assert.match(source, /<legend[^>]*>[\s\S]*?Chọn hình thức phân tích đối chiếu:[\s\S]*?<\/legend>/);
  assert.match(source, /type="radio"\s+name="analysis_mode"\s+value="field_benchmark"/);
  assert.match(source, /type="radio"\s+name="analysis_mode"\s+value="job_targeted"/);

  // Constant 1px border (no border-2 layout shift) with ring accent and keyboard focus
  assert.match(source, /bg-primary-fixed\/20 border-primary shadow-sm ring-1 ring-primary\/30/);
  assert.match(source, /bg-white border-outline-variant\/80 hover:border-primary\/50/);
  assert.match(source, /has-\[:focus-visible\]:ring-2 has-\[:focus-visible\]:ring-primary/);
});

test('Resume Analyses: Custom panels and JD inputs have visible borders and focus visible rings', async () => {
  const source = await readSource('../src/app/(dashboard)/resume-analyses/page.tsx');

  // Form inputs have border-outline-variant/80 and focus-visible rings
  assert.match(source, /id="jdTitle"[^>]*border-outline-variant\/80[^>]*focus-visible:ring-2/);
  assert.match(source, /id="jdContent"[^>]*border-outline-variant\/80[^>]*focus-visible:ring-2/);
  assert.match(source, /id="industry"[^>]*border-outline-variant\/80[^>]*focus-visible:ring-2/);
  assert.match(source, /id="targetRole"[^>]*border-outline-variant\/80[^>]*focus-visible:ring-2/);
  assert.match(source, /id="seniority"[^>]*border-outline-variant\/80[^>]*focus-visible:ring-2/);
});

test('Interviews New: Topic and difficulty selectors feature native radio group semantics and constant 1px borders', async () => {
  const source = await readSource('../src/app/(dashboard)/interviews/new/page.tsx');

  // Topic selector native radio group
  assert.match(source, /<legend[^>]*>[\s\S]*?Chủ đề phỏng vấn trọng tâm[\s\S]*?<\/legend>/);
  assert.match(source, /type="radio"\s+name="interview_type_selection"/);
  assert.match(source, /bg-primary-fixed\/20 border-primary text-on-surface shadow-sm ring-1 ring-primary\/20/);
  assert.match(source, /border-outline-variant\/80 hover:border-primary\/50/);

  // Difficulty selector native radio group
  assert.match(source, /<legend[^>]*>[\s\S]*?Độ khó của phiên[\s\S]*?<\/legend>/);
  assert.match(source, /type="radio"\s+name="interview_difficulty_selection"/);
  assert.match(source, /bg-primary text-white border-primary shadow-sm ring-1 ring-primary\/30/);
  assert.match(source, /border-outline-variant\/80 hover:border-primary\/50/);

  // Focus visible ring on parent label
  assert.match(source, /has-\[:focus-visible\]:ring-2 has-\[:focus-visible\]:ring-primary/);

  // Audio testing container has strengthened border
  assert.match(source, /bg-surface-container-low border border-outline-variant\/60 space-y-3\.5/);

  // Candidate context button has structured border styling
  assert.match(source, /border border-primary\/30 text-primary hover:border-primary\/60/);
});

test('Analytics: Competency cards preserve neutral backgrounds with crisp borders without false hover affordance', async () => {
  const source = await readSource('../src/app/(dashboard)/analytics/page.tsx');

  // Competency card has neutral border and no false hover affordance on static cards
  assert.match(source, /Card variant="elevated" padding="md" className="space-y-2 border border-outline-variant\/80"/);
  assert.doesNotMatch(source, /className="space-y-2 border border-outline-variant\/80 hover:border-outline\/50/);

  // Weakness items have strengthened borders
  assert.match(source, /border border-outline-variant\/70 space-y-1\.5 shadow-2xs/);

  // Recent improvement buttons have focus visible ring and strengthened border
  assert.match(source, /border border-outline-variant\/60 enabled:hover:border-primary\/60/);
  assert.match(source, /focus-visible:ring-2 focus-visible:ring-primary/);
});
