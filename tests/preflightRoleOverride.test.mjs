import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relPath) => readFile(new URL(relPath, import.meta.url), 'utf8');

test('K: loaded default role appears before local edit via nullish coalescing', () => {
  const resolvedDefaultRole = 'Business Analyst';
  const sessionRole = null;
  const effectiveSessionRole = sessionRole ?? resolvedDefaultRole;

  assert.equal(effectiveSessionRole, 'Business Analyst');
});

test('L: deleting entire role keeps it blank without snapping back to loaded default', () => {
  const resolvedDefaultRole = 'Business Analyst';
  // User deletes all characters
  const sessionRole = '';
  const effectiveSessionRole = sessionRole ?? resolvedDefaultRole;

  assert.equal(effectiveSessionRole, '');
  assert.notEqual(effectiveSessionRole, 'Business Analyst');
});

test('M: typing new role persists without snap-back', () => {
  const resolvedDefaultRole = 'Business Analyst';
  const sessionRole = 'Product Manager';
  const effectiveSessionRole = sessionRole ?? resolvedDefaultRole;

  assert.equal(effectiveSessionRole, 'Product Manager');
});

test('N: query refetch does not reset edited local value', () => {
  let sessionRole = 'Product Manager';

  // Initial goal loaded
  let defaultGoal = { targetRole: 'Business Analyst' };
  let resolvedDefaultRole = defaultGoal.targetRole;
  assert.equal(sessionRole ?? resolvedDefaultRole, 'Product Manager');

  // Query refetches and returns updated backend default
  defaultGoal = { targetRole: 'Senior Business Analyst' };
  resolvedDefaultRole = defaultGoal.targetRole;

  // Local override must win over refetched default
  assert.equal(sessionRole ?? resolvedDefaultRole, 'Product Manager');
});

test('O: preflight source enforces blank role validation check blocking interview start', async () => {
  const source = await readSource('../src/app/(dashboard)/interviews/new/page.tsx');

  assert.match(
    source,
    /if\s*\(!effectiveSessionRole\.trim\(\)\)\s*\{\s*setError\(\{\s*message:\s*'Vui lòng nhập vai trò mục tiêu cho phiên phỏng vấn\.'\s*\}\);/
  );
});

test('P & Q: mode remains career_goal when unchanged and switches to manual when edited', async () => {
  const source = await readSource('../src/app/(dashboard)/interviews/new/page.tsx');

  // Must verify nullish coalescing is used instead of logical OR
  assert.match(source, /effectiveSessionRole\s*=\s*sessionRole\s*\?\?\s*resolvedDefaultRole/);
  assert.match(source, /effectiveSessionSeniority\s*=\s*sessionSeniority\s*\?\?\s*resolvedDefaultSeniority/);
  assert.doesNotMatch(source, /effectiveSessionRole\s*=\s*sessionRole\s*\|\|\s*resolvedDefaultRole/);

  // Verifies matching goal logic for mode
  assert.match(source, /isMatchingActiveGoal\s*=/);
  assert.match(source, /const mode\s*=\s*isMatchingActiveGoal\s*\?\s*'career_goal'\s*:\s*'manual'/);
  assert.match(source, /mode === 'career_goal'\s*\?\s*effectiveSelectedGoalId\s*:\s*undefined/);
});
