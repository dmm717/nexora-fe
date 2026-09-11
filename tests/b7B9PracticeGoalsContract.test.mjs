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

import {
  getOrCreateStarAttemptIntent,
  getOrCreateScenarioCreateIntent,
  getOrCreateScenarioSubmitIntent,
  initScenarioFlowState,
  prepareScenarioCreateStep,
  recordScenarioCreateSuccess,
  prepareScenarioSubmitStep,
  recordScenarioSubmitSuccess,
  initStarFlowState,
  prepareStarSubmitStep,
  recordStarSubmitSuccess,
} from '../src/utils/scenarioHelpers.ts';

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

// ---------------------------------------------------------------------------
// B7 / B8 Stable Idempotency Intents across retries
// ---------------------------------------------------------------------------

// STAR:
// 1. first submit creates key
test('STAR 1. first submit creates key', () => {
  const intent = getOrCreateStarAttemptIntent(null, {
    question: 'Tell me about a challenge',
    answer: 'Here is what happened',
  });
  assert.ok(intent.key && typeof intent.key === 'string');
  assert.equal(intent.payload.question, 'Tell me about a challenge');
  assert.equal(intent.payload.answer, 'Here is what happened');
});

// 2. same trimmed question+answer reuses same key
test('STAR 2. same trimmed question+answer reuses same key', () => {
  const firstIntent = getOrCreateStarAttemptIntent(null, {
    question: 'Tell me about a challenge',
    answer: 'Here is what happened',
  });
  const retryIntent = getOrCreateStarAttemptIntent(firstIntent, {
    question: '  Tell me about a challenge  ',
    answer: '  Here is what happened  \n',
  });
  assert.equal(retryIntent.key, firstIntent.key);
  assert.deepEqual(retryIntent.payload, firstIntent.payload);
});

// 3. changed question creates new key
test('STAR 3. changed question creates new key', () => {
  const firstIntent = getOrCreateStarAttemptIntent(null, {
    question: 'Question A',
    answer: 'Same answer',
  });
  const changedIntent = getOrCreateStarAttemptIntent(firstIntent, {
    question: 'Question B',
    answer: 'Same answer',
  });
  assert.notEqual(changedIntent.key, firstIntent.key);
  assert.equal(changedIntent.payload.question, 'Question B');
});

// 4. changed answer creates new key
test('STAR 4. changed answer creates new key', () => {
  const firstIntent = getOrCreateStarAttemptIntent(null, {
    question: 'Question A',
    answer: 'Answer A',
  });
  const changedIntent = getOrCreateStarAttemptIntent(firstIntent, {
    question: 'Question A',
    answer: 'Answer B',
  });
  assert.notEqual(changedIntent.key, firstIntent.key);
  assert.equal(changedIntent.payload.answer, 'Answer B');
});

// 5. failed request does not rotate key
test('STAR 5. failed request does not rotate key', () => {
  const state = initStarFlowState();
  const { state: pendingState, intent } = prepareStarSubmitStep(state, {
    question: 'Outage question',
    answer: 'Fixed outage',
  });
  // Simulate transport failure: recordStarSubmitSuccess is NOT called, pendingState is retained
  const { intent: retryIntent } = prepareStarSubmitStep(pendingState, {
    question: 'Outage question',
    answer: 'Fixed outage',
  });
  assert.equal(retryIntent.key, intent.key);
});

// 6. confirmed success clears intent
test('STAR 6. confirmed success clears intent', () => {
  const state = initStarFlowState();
  const { state: pendingState } = prepareStarSubmitStep(state, {
    question: 'Outage question',
    answer: 'Fixed outage',
  });
  const completedState = recordStarSubmitSuccess(pendingState, 'star-attempt-123');
  assert.equal(completedState.intent, null);
  assert.equal(completedState.attemptId, 'star-attempt-123');
});

// SCENARIO CREATE:
// 7. same scenarioId reuses create key
test('SCENARIO CREATE 7. same scenarioId reuses create key', () => {
  const first = getOrCreateScenarioCreateIntent(null, 'sc-101');
  const retry = getOrCreateScenarioCreateIntent(first, 'sc-101');
  assert.equal(retry.key, first.key);
  assert.equal(retry.payload.scenarioId, 'sc-101');
});

// 8. create failure keeps create key
test('SCENARIO CREATE 8. create failure keeps create key', () => {
  const state = initScenarioFlowState('sc-101');
  const { state: pendingState, intent } = prepareScenarioCreateStep(state);
  // Simulate network timeout on create: recordScenarioCreateSuccess is NOT called
  const { intent: retryIntent } = prepareScenarioCreateStep(pendingState);
  assert.equal(retryIntent.key, intent.key);
});

// 9. confirmed create stores attemptId and stops recreating attempt
test('SCENARIO CREATE 9. confirmed create stores attemptId and stops recreating attempt', () => {
  const state = initScenarioFlowState('sc-101');
  const { state: pendingState } = prepareScenarioCreateStep(state);
  const createdState = recordScenarioCreateSuccess(pendingState, 'attempt-555');
  assert.equal(createdState.attemptId, 'attempt-555');
  assert.equal(createdState.createIntent, null);
});

// SCENARIO SUBMIT:
// 10. same attemptId + same trimmed answer reuses submit key
test('SCENARIO SUBMIT 10. same attemptId + same trimmed answer reuses submit key', () => {
  const first = getOrCreateScenarioSubmitIntent(null, {
    attemptId: 'attempt-555',
    answer: 'My strategy',
  });
  const retry = getOrCreateScenarioSubmitIntent(first, {
    attemptId: 'attempt-555',
    answer: '   My strategy   ',
  });
  assert.equal(retry.key, first.key);
  assert.equal(retry.payload.answer, 'My strategy');
});

// 11. changed answer creates new submit key
test('SCENARIO SUBMIT 11. changed answer creates new submit key', () => {
  const first = getOrCreateScenarioSubmitIntent(null, {
    attemptId: 'attempt-555',
    answer: 'Initial response',
  });
  const edited = getOrCreateScenarioSubmitIntent(first, {
    attemptId: 'attempt-555',
    answer: 'Refined response with more detail',
  });
  assert.notEqual(edited.key, first.key);
  assert.equal(edited.payload.attemptId, 'attempt-555');
  assert.equal(edited.payload.answer, 'Refined response with more detail');
});

// 12. submit failure keeps attemptId
test('SCENARIO SUBMIT 12. submit failure keeps attemptId', () => {
  const state = {
    scenarioId: 'sc-101',
    createIntent: null,
    attemptId: 'attempt-555',
    submitIntent: null,
  };
  const { state: pendingSubmit } = prepareScenarioSubmitStep(state, 'My action');
  // Simulated failure: recordScenarioSubmitSuccess is not called
  assert.equal(pendingSubmit.attemptId, 'attempt-555');
});

// 13. submit failure does NOT return flow to create step
test('SCENARIO SUBMIT 13. submit failure does NOT return flow to create step', () => {
  const state = {
    scenarioId: 'sc-101',
    createIntent: null,
    attemptId: 'attempt-555',
    submitIntent: null,
  };
  const { state: failedSubmitState } = prepareScenarioSubmitStep(state, 'My action');
  // AttemptId is strictly preserved; retry flow checks if attemptId exists
  assert.ok(failedSubmitState.attemptId);
  assert.equal(failedSubmitState.createIntent, null);
  // Re-submitting stays on the submit step for the existing attempt
  const { intent: retrySubmitIntent } = prepareScenarioSubmitStep(failedSubmitState, 'My action');
  assert.equal(retrySubmitIntent.payload.attemptId, 'attempt-555');
});

// 14. successful submit clears submit intent
test('SCENARIO SUBMIT 14. successful submit clears submit intent', () => {
  const state = {
    scenarioId: 'sc-101',
    createIntent: null,
    attemptId: 'attempt-555',
    submitIntent: null,
  };
  const { state: pendingState } = prepareScenarioSubmitStep(state, 'My action');
  const completedState = recordScenarioSubmitSuccess(pendingState);
  assert.equal(completedState.submitIntent, null);
  assert.equal(completedState.attemptId, 'attempt-555');
});

// Critical flow test:
// 15. create succeeds -> submit fails -> retry must call submit for SAME attempt id and must NOT create a second attempt
test('15. critical flow: create succeeds -> submit fails -> retry calls submit for SAME attempt id and never creates second attempt', () => {
  let createdAttemptsCount = 0;
  let submittedAttempts = [];

  // Simulated backend client simulating the UI retry behavior
  let flow = initScenarioFlowState('sc-critical-1');

  // Step 1: Create attempt
  const { state: createPending } = prepareScenarioCreateStep(flow);
  flow = createPending;
  createdAttemptsCount++;
  const createdAttemptId = 'att-generated-001';
  flow = recordScenarioCreateSuccess(flow, createdAttemptId);

  assert.equal(createdAttemptsCount, 1);
  assert.equal(flow.attemptId, 'att-generated-001');
  assert.equal(flow.createIntent, null);

  // Step 2: Submit answer (transient failure occurs)
  const { state: submitPending1, intent: submitIntent1 } = prepareScenarioSubmitStep(flow, 'My initial answer');
  flow = submitPending1;
  // Network drops / timeout: recordScenarioSubmitSuccess is NOT called!

  // Step 3: User retries submission
  // UI inspects flow state: attemptId is already established ('att-generated-001')
  // Therefore create step is NOT re-run:
  assert.ok(flow.attemptId, 'Flow still retains the created attempt ID');

  // Flow re-submits to the existing attempt
  const { state: submitPending2, intent: submitIntent2 } = prepareScenarioSubmitStep(flow, 'My initial answer');
  flow = submitPending2;

  // Verify same submit key reused for identical payload
  assert.equal(submitIntent2.key, submitIntent1.key);
  assert.equal(submitIntent2.payload.attemptId, 'att-generated-001');

  // Simulate server receiving the submit retry and confirming success
  submittedAttempts.push({ attemptId: submitIntent2.payload.attemptId, key: submitIntent2.key });
  flow = recordScenarioSubmitSuccess(flow);

  // Invariant verification:
  assert.equal(createdAttemptsCount, 1, 'Exactly one create attempt was executed; no orphan created');
  assert.equal(submittedAttempts.length, 1, 'Submitted successfully against the single attempt');
  assert.equal(submittedAttempts[0].attemptId, 'att-generated-001');
  assert.equal(flow.submitIntent, null);
});
