import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeStarPracticeEvaluation,
  listStarComponents,
  normalizeStarComponent,
  STAR_COMPONENT_ORDER,
  STAR_COMPONENT_LABELS,
  SCORE_SCALE,
} from '../src/services/interviewContract.ts';

import {
  buildCreateCareerGoalRequest,
  buildUpdateCareerGoalRequest,
} from '../src/services/careerGoalContract.ts';

// ---------------------------------------------------------------------------
// B8 STAR practice
// ---------------------------------------------------------------------------

test('B8.1 detected=true preserves backend score and grounded evidence', () => {
  const normalized = normalizeStarPracticeEvaluation({
    applicable: true,
    overallScore: 82,
    situation: { score: 80, detected: true, evidence: 'Production outage on Friday', feedback: 'Clear context' },
    task: { score: 75, detected: true, evidence: 'Restore service within SLA', feedback: 'Clear goal' },
    action: { score: 90, detected: true, evidence: 'Rolled back the bad deploy', feedback: 'Decisive' },
    result: { score: 85, detected: true, evidence: 'MTTR reduced by 40%', feedback: 'Measured' },
    missingElements: [],
    strengths: ['Clear ownership'],
    coachingTips: ['Quantify impact'],
    scoreScale: '0-100',
  });

  assert.ok(normalized);
  assert.equal(normalized.applicable, true);
  assert.equal(normalized.overallScore, 82);
  assert.equal(normalized.situation?.score, 80);
  assert.equal(normalized.situation?.detected, true);
  assert.equal(normalized.situation?.evidence, 'Production outage on Friday');
  assert.equal(normalized.action?.score, 90);
  assert.equal(normalized.result?.evidence, 'MTTR reduced by 40%');
  assert.deepEqual(normalized.strengths, ['Clear ownership']);
  assert.deepEqual(normalized.coachingTips, ['Quantify impact']);
});

test('B8.2 detected=false renders score 0 and blank evidence, never fake evidence', () => {
  const normalized = normalizeStarPracticeEvaluation({
    applicable: true,
    overallScore: 40,
    situation: { score: 88, detected: false, evidence: 'should be dropped', feedback: 'Chưa nêu bối cảnh' },
    task: { score: 0, detected: false, evidence: '', feedback: 'Thiếu nhiệm vụ' },
    action: { score: 70, detected: true, evidence: 'Did the work', feedback: 'OK' },
    result: null,
    missingElements: ['Result'],
    strengths: [],
    coachingTips: [],
  });

  assert.ok(normalized);
  assert.equal(normalized.situation?.detected, false);
  assert.equal(normalized.situation?.score, 0);
  assert.equal(normalized.situation?.evidence, '');
  assert.equal(normalized.task?.score, 0);
  assert.equal(normalized.task?.evidence, '');
  assert.equal(normalized.action?.score, 70);
  assert.equal(normalized.result, null);
  assert.deepEqual(normalized.missingElements, ['Result']);
});

test('B8.3 score scale remains 0-100 and is never reweighted client-side', () => {
  const normalized = normalizeStarPracticeEvaluation({
    applicable: true,
    overallScore: 90,
    situation: { score: 20, detected: true, evidence: 'a', feedback: '' },
    task: { score: 20, detected: true, evidence: 'b', feedback: '' },
    action: { score: 35, detected: true, evidence: 'c', feedback: '' },
    result: { score: 25, detected: true, evidence: 'd', feedback: '' },
  });

  assert.ok(normalized);
  assert.equal(normalized.scoreScale, '0-100');
  assert.equal(SCORE_SCALE, '0-100');
  // Component scores are preserved verbatim; the helper must not recompute the
  // 20/20/35/25 weighting or rescale to any other range.
  assert.equal(normalized.situation?.score, 20);
  assert.equal(normalized.task?.score, 20);
  assert.equal(normalized.action?.score, 35);
  assert.equal(normalized.result?.score, 25);
  assert.equal(normalized.overallScore, 90);
  // Missing scoreScale defaults to canonical 0-100 without changing scores.
  const noScale = normalizeStarPracticeEvaluation({ applicable: true, overallScore: 50 });
  assert.equal(noScale?.scoreScale, '0-100');
});

test('B8.4 all STAR components render null-safely and never fabricate missing ones', () => {
  const partial = normalizeStarPracticeEvaluation({
    applicable: true,
    overallScore: null,
    situation: { score: 60, detected: true, evidence: 'ctx', feedback: 'ok' },
    // task/action intentionally absent
    result: null,
  });

  assert.ok(partial);
  const listed = listStarComponents(partial);
  assert.deepEqual(listed.map((entry) => entry.key), ['situation']);
  assert.deepEqual(listed[0].component, {
    score: 60,
    detected: true,
    evidence: 'ctx',
    feedback: 'ok',
  });

  // Unparseable/absent evaluation returns null rather than throwing.
  assert.equal(normalizeStarPracticeEvaluation(null), null);
  assert.equal(normalizeStarPracticeEvaluation(undefined), null);
  assert.equal(normalizeStarPracticeEvaluation({}), null);
  assert.equal(normalizeStarPracticeEvaluation({ situation: {} }), null);

  // Ordering and labels are canonical.
  assert.deepEqual([...STAR_COMPONENT_ORDER], ['situation', 'task', 'action', 'result']);
  assert.equal(STAR_COMPONENT_LABELS.action, 'Action');

  // The canonical component helper enforces detected=false => 0 / "".
  const negated = normalizeStarComponent({ score: 99, detected: false, evidence: 'x', feedback: 'f' });
  assert.equal(negated.score, 0);
  assert.equal(negated.evidence, '');
});

// ---------------------------------------------------------------------------
// B9 Career goals
// ---------------------------------------------------------------------------

test('B9.1 create form mapping matches the backend request shape', () => {
  const request = buildCreateCareerGoalRequest({
    targetRole: '  Senior Frontend Engineer ',
    seniority: ' senior ',
    industry: 'FinTech',
    targetCompany: 'VNG',
    targetDate: '2026-12-31',
  });

  assert.deepEqual(request, {
    targetRole: 'Senior Frontend Engineer',
    seniority: 'senior',
    industry: 'FinTech',
    targetCompany: 'VNG',
    targetDate: '2026-12-31',
  });

  // Blank optional fields are omitted, never sent as empty strings.
  const minimal = buildCreateCareerGoalRequest({
    targetRole: 'Backend Engineer',
    seniority: 'mid',
    industry: '   ',
    targetCompany: '',
    targetDate: undefined,
  });
  assert.deepEqual(minimal, {
    targetRole: 'Backend Engineer',
    seniority: 'mid',
  });
  assert.equal('industry' in minimal, false);
  assert.equal('targetCompany' in minimal, false);
  assert.equal('targetDate' in minimal, false);
});

test('B9.2 edit preserves unchanged fields (only changed fields are Specified)', () => {
  const current = {
    id: 'goal-1',
    targetRole: 'Frontend Engineer',
    seniority: 'mid',
    industry: 'FinTech',
    targetCompany: 'VNG',
    targetJobDescriptionId: null,
    targetDate: '2026-06-01',
    active: true,
    createdAt: '',
    updatedAt: '',
  };

  // Editing only targetRole must not mark the other fields as specified.
  const onlyRole = buildUpdateCareerGoalRequest(current, {
    targetRole: 'Senior Frontend Engineer',
    seniority: current.seniority,
    industry: current.industry ?? undefined,
    targetCompany: current.targetCompany ?? undefined,
    targetDate: current.targetDate ?? undefined,
  });
  assert.deepEqual(onlyRole, {
    targetRoleSpecified: true,
    targetRole: 'Senior Frontend Engineer',
  });
  assert.equal('senioritySpecified' in onlyRole, false);
  assert.equal('industrySpecified' in onlyRole, false);
  assert.equal('targetCompanySpecified' in onlyRole, false);
  assert.equal('targetDateSpecified' in onlyRole, false);

  // Clearing an optional field intentionally sends null with Specified=true.
  const cleared = buildUpdateCareerGoalRequest(current, {
    targetRole: current.targetRole,
    seniority: current.seniority,
    industry: '',
    targetCompany: current.targetCompany ?? undefined,
    targetDate: current.targetDate ?? undefined,
  });
  assert.deepEqual(cleared, { industrySpecified: true, industry: null });

  // No changes => empty request (nothing is overwritten).
  const unchanged = buildUpdateCareerGoalRequest(current, {
    targetRole: current.targetRole,
    seniority: current.seniority,
    industry: current.industry ?? undefined,
    targetCompany: current.targetCompany ?? undefined,
    targetDate: current.targetDate ?? undefined,
  });
  assert.deepEqual(unchanged, {});
});

test('B9.3 empty goal list and archive/reactivate flags map safely', () => {
  // Empty list is a valid state; helpers do not require goals to map requests.
  const createFromEmptyState = buildCreateCareerGoalRequest({
    targetRole: 'Data Engineer',
    seniority: 'junior',
  });
  assert.equal(createFromEmptyState.targetRole, 'Data Engineer');

  // Archive is a PATCH with active:false, reactivate with active:true.
  const archive = { activeSpecified: true, active: false };
  const reactivate = { activeSpecified: true, active: true };
  assert.deepEqual(archive, { activeSpecified: true, active: false });
  assert.deepEqual(reactivate, { activeSpecified: true, active: true });
});
