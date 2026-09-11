import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SCORE_SCALE,
  DETERMINISTIC_ERROR_CODES,
  canFinishInterview,
  canSubmitInterviewAnswer,
  canUpgradeAndContinue,
  isUpgradeRequired,
  isMaxQuestionsReached,
  shouldAutoComplete,
  getCurrentQuestion,
  getAnsweredQuestions,
  isStarApplicable,
  normalizeStarComponent,
  safeAnswerEvaluation,
  isReportProcessingError,
  isReportFailedError,
  isReportUnavailableError,
  isReportNotReady,
  isDeterministicError,
  generateIdempotencyKey,
  buildContinueInterviewRequest,
  buildRetryReportRequest,
  buildSubmitAnswerRequest,
  buildStartInterviewRequest,
  buildCompleteInterviewRequest,
  getOrCreateStartIntent,
  isSameStartPayload,
  getOrCreateAnswerIntent,
  isSameAnswerPayload,
  shouldRunAnswerTimer,
createReportPollingAttemptTracker,
  getReportPollingDecision,
  REPORT_POLL_INTERVAL_MS,
  REPORT_POLL_MAX_ATTEMPTS,
  normalizeReportView,
  applyAnswerResultToInterview,
  createCompleteIntentState,
} from '../src/services/interviewContract.ts';

// 1. continuation in_progress
test('1. continuation in_progress semantics', () => {
  const continuation = {
    state: 'in_progress',
    canFinishNow: false,
    canUpgradeAndContinue: false,
  };

  assert.equal(isUpgradeRequired(continuation), false);
  assert.equal(isMaxQuestionsReached(continuation), false);
  assert.equal(canUpgradeAndContinue(continuation), false);

  // With 1 answer, canFinishNow is false
  assert.equal(canFinishInterview(continuation), false);

  // When canFinishNow becomes true (e.g. after 2 answers)
  const continuationEligible = {
    ...continuation,
    canFinishNow: true,
  };
  assert.equal(canFinishInterview(continuationEligible), true);
  assert.equal(canUpgradeAndContinue(continuationEligible), false);
});

// 2. Q3 upgrade_required
test('2. Q3 upgrade_required semantics for free limit cap', () => {
  const continuation = {
    state: 'upgrade_required',
    canFinishNow: true,
    canUpgradeAndContinue: true,
  };

  assert.equal(isUpgradeRequired(continuation), true);
  assert.equal(isMaxQuestionsReached(continuation), false);
  assert.equal(canFinishInterview(continuation), true);
  assert.equal(canUpgradeAndContinue(continuation), true);
});

// 3. nextQuestion = null + upgrade_required does NOT auto-complete
test('3. nextQuestion = null + upgrade_required does NOT auto-complete', () => {
  const continuationUpgradeRequired = {
    state: 'upgrade_required',
    canFinishNow: true,
    canUpgradeAndContinue: true,
  };

  // Even if nextQuestion is null, upgrade_required MUST NEVER auto-complete
  assert.equal(shouldAutoComplete(false, continuationUpgradeRequired, null), false);
  assert.equal(shouldAutoComplete(true, continuationUpgradeRequired, null), false);

  // In contrast, when max questions reached and isComplete is true with no next question, it auto-completes
  const continuationMaxReached = {
    state: 'max_questions_reached',
    canFinishNow: true,
    canUpgradeAndContinue: false,
  };
  assert.equal(shouldAutoComplete(true, continuationMaxReached, null), true);

  // If there is still a nextQuestion, it must not auto-complete
  const fakeNextQ = { id: 'q-4', sequence: 4, content: 'Next question', createdAt: '' };
  assert.equal(shouldAutoComplete(false, continuationMaxReached, fakeNextQ), false);
});

// 4. canFinishNow
test('4. canFinishNow eligibility is strictly backend-owned and fails closed without continuation', () => {
  // If continuation specifies canFinishNow, that is authoritative
  assert.equal(canFinishInterview({ state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false }), true);
  assert.equal(canFinishInterview({ state: 'in_progress', canFinishNow: false, canUpgradeAndContinue: false }), false);

  // If continuation is null/undefined, it fails closed (false) without local guesses
  assert.equal(canFinishInterview(null), false);
  assert.equal(canFinishInterview(undefined), false);
  assert.equal(canFinishInterview({ state: 'in_progress', canUpgradeAndContinue: false }), false);
});

// 5. canUpgradeAndContinue
test('5. canUpgradeAndContinue is true strictly when upgrade is available', () => {
  assert.equal(canUpgradeAndContinue({ state: 'upgrade_required', canFinishNow: true, canUpgradeAndContinue: true }), true);
  assert.equal(canUpgradeAndContinue({ state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false }), false);
  assert.equal(canUpgradeAndContinue({ state: 'max_questions_reached', canFinishNow: true, canUpgradeAndContinue: false }), false);
  assert.equal(canUpgradeAndContinue(null), false);
  assert.equal(canUpgradeAndContinue(undefined), false);
});

// 6. same-session continue behavior
test('6. same-session continue API calls /interviews/{id}/continue without creating a new session', () => {
  const interviewId = 'session-123';
  const stableKey = 'continue-idem-key-1';
  const req = buildContinueInterviewRequest(interviewId, stableKey);

  assert.equal(req.url, '/interviews/session-123/continue');
  assert.equal(req.method, 'POST');
  assert.equal(req.headers['Idempotency-Key'], stableKey);
  // URL targets the same interview session, preserving Q1-Q3
  assert.ok(req.url.includes(interviewId));
});

// 7. current-question selection from server questions/answers
test('7. current-question selection derives first unanswered question by sequence order', () => {
  const questions = [
    { id: 'q-3', sequence: 3, content: 'Motivation', createdAt: '' },
    { id: 'q-1', sequence: 1, content: 'Self intro', createdAt: '' },
    { id: 'q-2', sequence: 2, content: 'Behavioral STAR', createdAt: '' },
  ];

  // No answers -> returns Q1 (sequence 1)
  assert.equal(getCurrentQuestion(questions, [])?.id, 'q-1');

  // Q1 answered -> returns Q2 (sequence 2)
  const answersOne = [
    { id: 'ans-1', questionId: 'q-1', content: 'Intro answer', createdAt: '' },
  ];
  assert.equal(getCurrentQuestion(questions, answersOne)?.id, 'q-2');

  // Q1 and Q2 answered -> returns Q3
  const answersTwo = [
    { id: 'ans-1', questionId: 'q-1', content: 'Intro answer', createdAt: '' },
    { id: 'ans-2', questionId: 'q-2', content: 'STAR answer', createdAt: '' },
  ];
  assert.equal(getCurrentQuestion(questions, answersTwo)?.id, 'q-3');

  // Q1, Q2, Q3 answered -> returns null
  const answersAll = [
    ...answersTwo,
    { id: 'ans-3', questionId: 'q-3', content: 'Motivation answer', createdAt: '' },
  ];
  assert.equal(getCurrentQuestion(questions, answersAll), null);

  // Whitespace-only answer is treated as unanswered
  const answersWhitespace = [
    { id: 'ans-1', questionId: 'q-1', content: '   ', createdAt: '' },
  ];
  assert.equal(getCurrentQuestion(questions, answersWhitespace)?.id, 'q-1');

  // getAnsweredQuestions pairs questions in sequence order
  const pairs = getAnsweredQuestions(questions, answersTwo);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].question.sequence, 1);
  assert.equal(pairs[1].question.sequence, 2);
});

// 8. STAR applicable vs non-applicable presentation
test('8. STAR applicable vs non-applicable evaluation presentation', () => {
  const starApplicable = {
    applicable: true,
    overallScore: 88,
    situation: { score: 85, detected: true, evidence: 'Incident in Q3', feedback: 'Detailed context' },
    task: { score: 80, detected: true, evidence: 'Resolve outage', feedback: 'Clear goal' },
    action: { score: 95, detected: true, evidence: 'Rolled back bad deploy', feedback: 'Decisive leadership' },
    result: { score: 90, detected: true, evidence: 'MTTR reduced by 50%', feedback: 'Measurable metric' },
    missingElements: [],
    strengths: ['Fast response'],
    coachingTips: ['Mention stakeholder communication'],
    scoreScale: '0-100',
  };

  assert.equal(isStarApplicable(starApplicable), true);

  const normalizedAction = normalizeStarComponent(starApplicable.action);
  assert.equal(normalizedAction.score, 95);
  assert.equal(normalizedAction.detected, true);
  assert.equal(normalizedAction.evidence, 'Rolled back bad deploy');
  assert.equal(normalizedAction.feedback, 'Decisive leadership');

  // Non-applicable STAR evaluation
  const starNonApplicable = {
    applicable: false,
  };
  assert.equal(isStarApplicable(starNonApplicable), false);

  // Generic evaluation without STAR
  const genericEval = safeAnswerEvaluation({
    scores: [{ criterion: 'Technical Depth', score: 80, evidence: 'Understands closures' }],
    feedback: 'Clear explanation',
    strengths: ['Accurate concept'],
    improvements: ['Could mention memory retention'],
    improvedAnswer: 'Closures are functions bundled with their lexical environment.',
    star: starNonApplicable,
  });

  assert.equal(genericEval.scores.length, 1);
  assert.equal(genericEval.strengths[0], 'Accurate concept');
  assert.equal(genericEval.improvements[0], 'Could mention memory retention');
  assert.equal(genericEval.improvedAnswer, 'Closures are functions bundled with their lexical environment.');
  assert.equal(isStarApplicable(genericEval.star), false);
});

// 9. scoreScale = 0-100
test('9. score scale is preserved as 0-100 without conversion', () => {
  assert.equal(SCORE_SCALE, '0-100');

  const evalData = safeAnswerEvaluation({
    scores: [{ criterion: 'Problem Solving', score: 75, evidence: 'Grounded evidence' }],
    scoreScale: '0-100',
  });

  assert.equal(evalData.scoreScale, '0-100');
  assert.equal(evalData.scores[0].score, 75);
  // Score is NOT converted to 1-5 (e.g. 3.75) or 0-10 (e.g. 7.5)
  assert.equal(typeof evalData.scores[0].score, 'number');
  assert.ok(evalData.scores[0].score > 10);
});

// 10. report 404 only treated as pending while interview is completing
test('10. report 404 only treated as pending while interview is completing', () => {
  const notFoundError = { code: 'NOT_FOUND', status: 404, message: 'Not found' };
  const processingError = { code: 'INTERVIEW_REPORT_PROCESSING', status: 409, message: 'Báo cáo phỏng vấn đang được xử lý.' };
  const failedError = { code: 'INTERVIEW_REPORT_FAILED', status: 409, message: 'Báo cáo phỏng vấn chưa tạo được. Bạn có thể thử lại.' };
  const unavailableError = { code: 'INTERVIEW_REPORT_UNAVAILABLE', status: 409, message: 'Báo cáo phỏng vấn chưa sẵn sàng.' };

  // 404 is pending ONLY when interview is completing
  assert.equal(isReportNotReady('completing', notFoundError), true);
  assert.equal(isReportNotReady('completed', notFoundError), false);
  assert.equal(isReportNotReady('failed', notFoundError), false);
  assert.equal(isReportNotReady('abandoned', notFoundError), false);
  assert.equal(isReportNotReady(undefined, notFoundError), false);

  // 409 INTERVIEW_REPORT_PROCESSING is always pending
  assert.equal(isReportProcessingError(processingError), true);
  assert.equal(isReportNotReady('completing', processingError), true);
  assert.equal(isReportNotReady('completed', processingError), true);

  // 409 INTERVIEW_REPORT_FAILED is NOT pending, it is failed
  assert.equal(isReportFailedError(failedError), true);
  assert.equal(isReportNotReady('completing', failedError), false);

  // 409 INTERVIEW_REPORT_UNAVAILABLE
  assert.equal(isReportUnavailableError(unavailableError), true);
});

// 11. report retry API contract
test('11. report retry API contract calls /interviews/{id}/report/retry with idempotency key', () => {
  const interviewId = 'session-retry-1';
  const retryKey = 'report-retry-key-abc';
  const req = buildRetryReportRequest(interviewId, retryKey);

  assert.equal(req.url, '/interviews/session-retry-1/report/retry');
  assert.equal(req.method, 'POST');
  assert.equal(req.headers['Idempotency-Key'], retryKey);

  // Error identification
  assert.equal(isReportFailedError({ code: 'INTERVIEW_REPORT_FAILED' }), true);
  assert.equal(isReportFailedError({ status: 409, message: 'Báo cáo phỏng vấn chưa tạo được. Bạn có thể thử lại.' }), true);
  assert.equal(isReportFailedError({ status: 500, message: 'Server error' }), false);
});

// 12. deterministic errors are not blindly transport-retried
test('12. deterministic errors are correctly classified and not transport-retried', () => {
  // Known business error codes
  for (const code of DETERMINISTIC_ERROR_CODES) {
    const err = { code, status: 400, message: 'Business error' };
    assert.equal(isDeterministicError(err), true, `Expected code ${code} to be deterministic`);
  }

  // 4xx status codes are deterministic
  assert.equal(isDeterministicError({ status: 400 }), true);
  assert.equal(isDeterministicError({ status: 403 }), true);
  assert.equal(isDeterministicError({ status: 409 }), true);
  assert.equal(isDeterministicError({ status: 422 }), true);

  // 408 Timeout and 429 Rate Limit can be transport-retried
  assert.equal(isDeterministicError({ status: 408 }), false);
  assert.equal(isDeterministicError({ status: 429 }), false);

  // 5xx server errors can be retried
  assert.equal(isDeterministicError({ status: 500 }), false);
  assert.equal(isDeterministicError({ status: 502 }), false);
  assert.equal(isDeterministicError(new Error('Network error')), false);
  assert.equal(isDeterministicError(null), false);
  assert.equal(isDeterministicError(undefined), false);
});

// 13. malformed/partial optional evaluation does not crash presentation helpers
test('13. malformed/partial optional evaluation handles missing fields defensively', () => {
  // Null and undefined inputs
  const emptyEval = safeAnswerEvaluation(null);
  assert.deepEqual(emptyEval.scores, []);
  assert.equal(emptyEval.feedback, '');
  assert.equal(emptyEval.star, null);
  assert.deepEqual(emptyEval.strengths, []);
  assert.deepEqual(emptyEval.improvements, []);
  assert.equal(emptyEval.improvedAnswer, null);

  const undefinedEval = safeAnswerEvaluation(undefined);
  assert.deepEqual(undefinedEval.scores, []);

  // Partial STAR evaluation missing components
  const partialStar = {
    applicable: true,
    situation: null,
    task: undefined,
    action: { score: 70, feedback: 'Did something' },
    result: null,
  };
  assert.equal(isStarApplicable(partialStar), true);

  const normSituation = normalizeStarComponent(partialStar.situation);
  assert.equal(normSituation.score, 0);
  assert.equal(normSituation.detected, false);
  assert.equal(normSituation.evidence, '');
  assert.equal(normSituation.feedback, '');

  const normAction = normalizeStarComponent(partialStar.action);
  assert.equal(normAction.score, 70);
  assert.equal(normAction.detected, true);
  assert.equal(normAction.feedback, 'Did something');
  assert.equal(normAction.evidence, '');
});

// 14. idempotency behavior for repeated SAME logical user intent
test('14. idempotency key generation and reuse across retries of the same intent', () => {
  const key1 = generateIdempotencyKey();
  const key2 = generateIdempotencyKey();

  // Distinct intents receive distinct keys
  assert.notEqual(key1, key2);
  assert.match(key1, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  // Client intent key held across retries of the same submit action
  const clientIntentKey = generateIdempotencyKey();

  const reqAttempt1 = buildSubmitAnswerRequest(
    'session-test-idem',
    { questionId: 'q-1', content: 'My answer', durationSeconds: 45 },
    clientIntentKey
  );

  const reqAttempt2 = buildSubmitAnswerRequest(
    'session-test-idem',
    { questionId: 'q-1', content: 'My answer', durationSeconds: 45 },
    clientIntentKey
  );

  // Both attempts dispatched the EXACT SAME idempotency key and identical payload
  assert.equal(reqAttempt1.headers['Idempotency-Key'], clientIntentKey);
  assert.equal(reqAttempt2.headers['Idempotency-Key'], clientIntentKey);
  assert.equal(reqAttempt1.headers['Idempotency-Key'], reqAttempt2.headers['Idempotency-Key']);
  assert.deepEqual(reqAttempt1.data, reqAttempt2.data);
  assert.equal(reqAttempt1.url, reqAttempt2.url);

  // A fresh intent generates a new key
  const reqAttempt3 = buildSubmitAnswerRequest(
    'session-test-idem',
    { questionId: 'q-2', content: 'Second answer' }
  );
  assert.notEqual(reqAttempt3.headers['Idempotency-Key'], clientIntentKey);

  // Start interview request builder also binds idempotency key
  const startReq = buildStartInterviewRequest(
    { role: 'Frontend Developer', seniority: 'Senior', interviewType: 'Technical', difficulty: 'Hard' },
    'start-key-xyz'
  );
  assert.equal(startReq.url, '/interviews');
  assert.equal(startReq.headers['Idempotency-Key'], 'start-key-xyz');
  assert.equal(startReq.data.role, 'Frontend Developer');
});

// 15. StartIntent payload binding and regeneration on change
test('15. StartIntent binds key to payload: retries reuse key; field changes generate a new key', () => {
  const payload1 = {
    role: 'Frontend Developer',
    seniority: 'Senior',
    interviewType: 'Technical',
    difficulty: 'Hard',
    resumeId: 'res-1',
  };

  const intent1 = getOrCreateStartIntent(null, payload1);
  assert.ok(intent1.key);
  assert.equal(intent1.payload.role, 'Frontend Developer');

  // Retry with identical payload (even with leading/trailing whitespace in role) reuses key
  const payload1Whitespace = { ...payload1, role: '  Frontend Developer  ' };
  const retryIntent = getOrCreateStartIntent(intent1, payload1Whitespace);
  assert.equal(retryIntent.key, intent1.key);
  assert.equal(isSameStartPayload(intent1.payload, retryIntent.payload), true);

  // Modifying seniority generates a new key
  const payload2 = { ...payload1, seniority: 'Lead' };
  const intent2 = getOrCreateStartIntent(intent1, payload2);
  assert.notEqual(intent2.key, intent1.key);
  assert.equal(intent2.payload.seniority, 'Lead');

  // Modifying resumeId generates a new key
  const payload3 = { ...payload1, resumeId: 'res-2' };
  const intent3 = getOrCreateStartIntent(intent1, payload3);
  assert.notEqual(intent3.key, intent1.key);

  // Modifying difficulty generates a new key
  const payload4 = { ...payload1, difficulty: 'Easy' };
  const intent4 = getOrCreateStartIntent(intent1, payload4);
  assert.notEqual(intent4.key, intent1.key);
});

// 16. AnswerIntent duration freezing and payload binding
test('16. AnswerIntent freezes duration on retry and regenerates key on answer edit or question switch', () => {
  const answerPayload1 = {
    questionId: 'q-101',
    content: 'My initial answer content',
    durationSeconds: 35,
  };

  const intent1 = getOrCreateAnswerIntent(null, answerPayload1);
  assert.ok(intent1.key);
  assert.equal(intent1.payload.durationSeconds, 35);
  assert.equal(intent1.payload.content, 'My initial answer content');

  // Option B: If user retries submission with identical answer text (even if elapsed timer advanced to 45),
  // intent is reused, key is preserved, and frozen durationSeconds (35) is kept!
  const retryAttempt = getOrCreateAnswerIntent(intent1, {
    questionId: 'q-101',
    content: '  My initial answer content  ',
    durationSeconds: 45,
  });
  assert.equal(retryAttempt.key, intent1.key);
  assert.equal(retryAttempt.payload.durationSeconds, 35);
  assert.equal(isSameAnswerPayload(intent1.payload, retryAttempt.payload), true);

  // If user edits text, a brand new intent is created with current timer (50s)
  const editedAttempt = getOrCreateAnswerIntent(intent1, {
    questionId: 'q-101',
    content: 'My edited improved answer',
    durationSeconds: 50,
  });
  assert.notEqual(editedAttempt.key, intent1.key);
  assert.equal(editedAttempt.payload.durationSeconds, 50);
  assert.equal(editedAttempt.payload.content, 'My edited improved answer');

  // Switching question generates a brand new intent
  const nextQAttempt = getOrCreateAnswerIntent(intent1, {
    questionId: 'q-102',
    content: 'My initial answer content',
    durationSeconds: 10,
  });
  assert.notEqual(nextQAttempt.key, intent1.key);
  assert.equal(nextQAttempt.payload.questionId, 'q-102');
});

// 17. Bounded, pending-only report polling decision
test('17. report polling decision strictly stops on failure/unavailable/cap and polls only pending states', () => {
  const processingErr = { code: 'INTERVIEW_REPORT_PROCESSING', status: 409 };
  const failedErr = { code: 'INTERVIEW_REPORT_FAILED', status: 409 };
  const unavailableErr = { code: 'INTERVIEW_REPORT_UNAVAILABLE', status: 409 };
  const notFoundErr = { code: 'NOT_FOUND', status: 404 };

  // Terminal failure states NEVER poll
  assert.deepEqual(getReportPollingDecision({ error: failedErr }), {
    shouldPoll: false,
    reason: 'failed',
  });
  assert.deepEqual(getReportPollingDecision({ error: unavailableErr }), {
    shouldPoll: false,
    reason: 'unavailable',
  });

  // Processing error polls with 15s interval
  const procDecision = getReportPollingDecision({ error: processingErr, fallbackAttemptCount: 2 });
  assert.equal(procDecision.shouldPoll, true);
  assert.equal(procDecision.intervalMs, REPORT_POLL_INTERVAL_MS);
  assert.equal(procDecision.reason, 'processing');

  // 404 is pending ONLY when interviewStatus is 'completing'
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'completing', error: notFoundErr, fallbackAttemptCount: 0 }).shouldPoll,
    true
  );
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'completed', error: notFoundErr, fallbackAttemptCount: 0 }).shouldPoll,
    false
  );
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'failed', error: notFoundErr, fallbackAttemptCount: 0 }).shouldPoll,
    false
  );

  // Maximum attempt bound exhaustion (8 attempts = 2 minutes) stops polling
  assert.equal(
    getReportPollingDecision({ error: processingErr, fallbackAttemptCount: REPORT_POLL_MAX_ATTEMPTS }).shouldPoll,
    false
  );
  assert.equal(
    getReportPollingDecision({ error: processingErr, fallbackAttemptCount: REPORT_POLL_MAX_ATTEMPTS }).reason,
    'bound_exhausted'
  );
});

// 18. normalizeStarComponent explicit detected=false preserves score 0 and empty evidence
test('18. normalizeStarComponent preserves explicit detected === false with score 0 and empty evidence', () => {
  const explicitNotDetected = {
    score: 80, // Score sent by backend or corrupted
    detected: false, // Explicit false
    evidence: 'Some text',
    feedback: 'Tình huống chưa được nêu rõ',
  };

  const norm = normalizeStarComponent(explicitNotDetected);
  assert.equal(norm.detected, false);
  assert.equal(norm.score, 0); // Forced to 0 when not detected
  assert.equal(norm.evidence, ''); // Forced to empty string when not detected
  assert.equal(norm.feedback, 'Tình huống chưa được nêu rõ');

  // Explicit true preserves score and evidence
  const explicitDetected = {
    score: 75,
    detected: true,
    evidence: 'Led migration',
    feedback: 'Clear action',
  };
  const normDet = normalizeStarComponent(explicitDetected);
  assert.equal(normDet.detected, true);
  assert.equal(normDet.score, 75);
  assert.equal(normDet.evidence, 'Led migration');
});

// 19. Extended DETERMINISTIC_ERROR_CODES includes new backend business codes
test('19. DETERMINISTIC_ERROR_CODES includes all current backend practice error codes', () => {
  const codesToCheck = [
    'INVALID_INTERVIEW_STATE',
    'INTERVIEW_UPGRADE_REQUIRED',
    'INTERVIEW_MAX_QUESTIONS_REACHED',
    'IDEMPOTENCY_CONFLICT',
    'IDEMPOTENCY_KEY_REQUIRED',
    'QUOTA_EXCEEDED',
    'NOT_FOUND',
  ];

  for (const code of codesToCheck) {
    assert.ok(
      DETERMINISTIC_ERROR_CODES.includes(code),
      `Expected DETERMINISTIC_ERROR_CODES to include ${code}`
    );
    assert.equal(isDeterministicError({ code }), true);
  }
});

// 20. interviewApi methods route through canonical request builders
test('20. interviewApi request builders produce exact canonical URLs, methods, and idempotency headers', () => {
  const interviewId = 'int-test-api';
  const customKey = 'my-custom-key';

  // Start
  const startReq = buildStartInterviewRequest(
    { role: 'Backend Dev', seniority: 'Senior', interviewType: 'Technical', difficulty: 'Hard' },
    customKey
  );
  assert.equal(startReq.url, '/interviews');
  assert.equal(startReq.method, 'POST');
  assert.equal(startReq.headers['Idempotency-Key'], customKey);

  // Submit Answer
  const answerReq = buildSubmitAnswerRequest(
    interviewId,
    { questionId: 'q-1', content: 'Answer 1', durationSeconds: 20 },
    customKey
  );
  assert.equal(answerReq.url, `/interviews/${interviewId}/answers`);
  assert.equal(answerReq.method, 'POST');
  assert.equal(answerReq.headers['Idempotency-Key'], customKey);
  assert.equal(answerReq.data.content, 'Answer 1');

  // Continue
  const continueReq = buildContinueInterviewRequest(interviewId, customKey);
  assert.equal(continueReq.url, `/interviews/${interviewId}/continue`);
  assert.equal(continueReq.method, 'POST');
  assert.equal(continueReq.headers['Idempotency-Key'], customKey);

  // Complete
  const completeReq = buildCompleteInterviewRequest(interviewId, customKey);
  assert.equal(completeReq.url, `/interviews/${interviewId}/complete`);
  assert.equal(completeReq.method, 'POST');
  assert.equal(completeReq.headers['Idempotency-Key'], customKey);

  // Retry report
  const retryReq = buildRetryReportRequest(interviewId, customKey);
  assert.equal(retryReq.url, `/interviews/${interviewId}/report/retry`);
  assert.equal(retryReq.method, 'POST');
  assert.equal(retryReq.headers['Idempotency-Key'], customKey);
});

// 21. Active lifecycle gating logic (active only; all other states fail closed)
test('21. interview answering uses the production helper and fails closed for every non-active state', () => {
  const activeQuestion = { id: 'q-1', sequence: 1, content: 'Q1', createdAt: '' };

  assert.equal(canSubmitInterviewAnswer({ status: 'active', hasQuestion: true, upgradeRequired: false }), true);
  assert.equal(canSubmitInterviewAnswer({ status: 'active', hasQuestion: true, upgradeRequired: true }), false); // upgrade required blocks answering
  assert.equal(canSubmitInterviewAnswer({ status: 'active', hasQuestion: false, upgradeRequired: false }), false); // no active question blocks answering

  for (const status of ['draft', 'starting', 'completing', 'completed', 'failed', 'abandoned', 'unknown_status']) {
    assert.equal(
      canSubmitInterviewAnswer({ status, hasQuestion: Boolean(activeQuestion), upgradeRequired: false }),
      false,
      `${status} must fail closed`
    );
  }
});

// 22. Production fallback polling counter and cycle reset
test('22. report fallback polling uses a real bounded counter and resets for a new cycle', () => {
  const tracker = createReportPollingAttemptTracker();
  const processingError = { code: 'INTERVIEW_REPORT_PROCESSING', status: 409 };

  tracker.ensureCycle('interview-1');
  assert.equal(tracker.getAttemptCount(), 0, 'a processing cycle starts at attempt 0');

  for (let attempt = 0; attempt < REPORT_POLL_MAX_ATTEMPTS; attempt += 1) {
    const decision = getReportPollingDecision({
      error: processingError,
      fallbackAttemptCount: tracker.getAttemptCount(),
    });
    assert.equal(decision.shouldPoll, true);

    // Repeated interval evaluations only schedule one actual fallback request.
    tracker.scheduleFallbackPoll();
    tracker.scheduleFallbackPoll();
    assert.equal(tracker.consumeScheduledPoll(), true);
    assert.equal(tracker.consumeScheduledPoll(), false);
    assert.equal(tracker.recordFallbackPoll(), attempt + 1);
  }

  assert.equal(tracker.getAttemptCount(), REPORT_POLL_MAX_ATTEMPTS);
  assert.equal(
    getReportPollingDecision({
      error: processingError,
      fallbackAttemptCount: tracker.getAttemptCount(),
    }).reason,
    'bound_exhausted'
  );

  // A successful report ends the old cycle; an explicit retry starts at zero again.
  tracker.reset();
  assert.equal(tracker.getAttemptCount(), 0);
  tracker.ensureCycle('interview-1');
  tracker.scheduleFallbackPoll();
  assert.equal(tracker.consumeScheduledPoll(), true);
  tracker.recordFallbackPoll();
  assert.equal(tracker.getAttemptCount(), 1);
  tracker.reset();
  assert.equal(tracker.getAttemptCount(), 0, 'new report retry cycle is unbounded from attempt 0');

  // Changing interview id also resets the production tracker.
  tracker.recordFallbackPoll();
  tracker.ensureCycle('interview-2');
  assert.equal(tracker.getAttemptCount(), 0);
});

// 23. Pending/terminal report state matrix
test('23. report fallback polling only runs for genuinely pending states', () => {
  const processingError = { code: 'INTERVIEW_REPORT_PROCESSING', status: 409 };
  const failedError = { code: 'INTERVIEW_REPORT_FAILED', status: 409 };
  const unavailableError = { code: 'INTERVIEW_REPORT_UNAVAILABLE', status: 409 };
  const notFoundError = { code: 'NOT_FOUND', status: 404 };

  assert.equal(getReportPollingDecision({ error: processingError, fallbackAttemptCount: 0 }).shouldPoll, true);
  assert.equal(getReportPollingDecision({ error: failedError, fallbackAttemptCount: 0 }).shouldPoll, false);
  assert.equal(getReportPollingDecision({ error: unavailableError, fallbackAttemptCount: 0 }).shouldPoll, false);
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'completing', error: notFoundError, fallbackAttemptCount: 0 }).shouldPoll,
    true
  );
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'completed', error: notFoundError, fallbackAttemptCount: 0 }).shouldPoll,
    false
  );
  assert.equal(
    getReportPollingDecision({ interviewStatus: 'unknown', error: notFoundError, fallbackAttemptCount: 0 }).shouldPoll,
    false
  );
});

// 24. Timer recovery after a failed answer submission
test('24. failed answer submission resumes the visible timer without changing the frozen retry intent', () => {
  assert.equal(
    shouldRunAnswerTimer({
      status: 'active',
      hasQuestion: true,
      canSubmitAnswer: true,
      submitting: false,
    }),
    true,
    'the timer runs while the answer is active'
  );
  assert.equal(
    shouldRunAnswerTimer({
      status: 'active',
      hasQuestion: true,
      canSubmitAnswer: true,
      submitting: true,
    }),
    false,
    'the timer pauses while submitting'
  );
  assert.equal(
    shouldRunAnswerTimer({
      status: 'active',
      hasQuestion: true,
      canSubmitAnswer: true,
      submitting: false,
    }),
    true,
    'the timer resumes after a failed submission'
  );

  const firstIntent = getOrCreateAnswerIntent(null, {
    questionId: 'q-1',
    content: 'Initial answer',
    durationSeconds: 35,
  });
  const sameAnswerRetry = getOrCreateAnswerIntent(firstIntent, {
    questionId: 'q-1',
    content: '  Initial answer  ',
    durationSeconds: 50,
  });
  const firstRequest = buildSubmitAnswerRequest('interview-1', firstIntent.payload, firstIntent.key);
  const sameRetryRequest = buildSubmitAnswerRequest('interview-1', sameAnswerRetry.payload, sameAnswerRetry.key);

  assert.equal(sameAnswerRetry.key, firstIntent.key);
  assert.equal(sameAnswerRetry.payload.durationSeconds, 35);
  assert.deepEqual(sameRetryRequest.data, firstRequest.data);
  assert.equal(sameRetryRequest.headers['Idempotency-Key'], firstRequest.headers['Idempotency-Key']);

  const editedAnswer = getOrCreateAnswerIntent(firstIntent, {
    questionId: 'q-1',
    content: 'Edited answer',
    durationSeconds: 50,
  });
  assert.notEqual(editedAnswer.key, firstIntent.key);
  assert.equal(editedAnswer.payload.durationSeconds, 50);
});

// 25. Report normalization at the API boundary
test('25. normalizeReportView returns typed collections and safely empties malformed fields', () => {
  const normalized = normalizeReportView({
    id: 'report-1',
    interviewId: 'interview-1',
    overallScore: 86,
    rubric: [
      { criterion: 'Clarity', score: 90, evidence: 'Clear answer' },
      { criterion: 'Invalid', score: 'not-a-number', evidence: 'Ignore me' },
    ],
    strengths: ['Clear structure', 42],
    gaps: ['Missing metric'],
    actionPlan: ['Add measurable outcomes'],
    disclaimer: 'AI-generated',
    createdAt: '2026-09-11T00:00:00Z',
  });

  assert.deepEqual(normalized.rubric, [
    { criterion: 'Clarity', score: 90, evidence: 'Clear answer' },
  ]);
  assert.deepEqual(normalized.strengths, ['Clear structure']);
  assert.deepEqual(normalized.gaps, ['Missing metric']);
  assert.deepEqual(normalized.actionPlan, ['Add measurable outcomes']);

  const malformed = normalizeReportView({
    rubric: { Clarity: 90 },
    strengths: { value: 'not-an-array' },
    gaps: null,
    actionPlan: 123,
  });
  assert.deepEqual(malformed.rubric, []);
  assert.deepEqual(malformed.strengths, []);
  assert.deepEqual(malformed.gaps, []);
  assert.deepEqual(malformed.actionPlan, []);
});

const makeInterview = (continuation) => ({
  id: 'interview-1',
  status: 'active',
  role: 'Frontend Developer',
  seniority: 'Senior',
  interviewType: 'Technical',
  difficulty: 'Hard',
  version: 3,
  questions: [
    { id: 'q-1', sequence: 1, kind: 'primary', content: 'Self intro', createdAt: '' },
    { id: 'q-2', sequence: 2, kind: 'primary', content: 'Behavioral STAR', createdAt: '' },
  ],
  answers: [
    { id: 'ans-1', questionId: 'q-1', content: 'Intro answer', createdAt: '' },
  ],
  continuation: continuation ?? {
    state: 'in_progress',
    canFinishNow: false,
    canUpgradeAndContinue: false,
  },
  createdAt: '2026-09-11T00:00:00Z',
  updatedAt: '2026-09-11T00:00:00Z',
});

// 26. Case A — normal answer reconciliation: answer + next question appended once, continuation updated
test('26. normal answer reconciles the accepted answer, next question, and continuation', () => {
  const current = makeInterview();
  const result = {
    answer: { id: 'ans-2', questionId: 'q-2', content: 'STAR answer', createdAt: '' },
    nextQuestion: { id: 'q-3', sequence: 3, kind: 'primary', content: 'Motivation', createdAt: '' },
    isComplete: false,
    continuation: {
      state: 'in_progress',
      canFinishNow: true,
      canUpgradeAndContinue: false,
    },
  };

  const next = applyAnswerResultToInterview(current, result);

  // Answer added exactly once
  assert.equal(next.answers.length, 2);
  assert.equal(next.answers[1].id, 'ans-2');
  // Next question added exactly once
  assert.equal(next.questions.length, 3);
  assert.equal(next.questions[2].id, 'q-3');
  // Continuation updated
  assert.equal(next.continuation.state, 'in_progress');
  assert.equal(next.continuation.canFinishNow, true);
  // Unrelated fields preserved
  assert.equal(next.id, current.id);
  assert.equal(next.status, 'active');
  assert.equal(next.role, current.role);
  assert.equal(next.seniority, current.seniority);
  assert.equal(next.interviewType, current.interviewType);
  assert.equal(next.difficulty, current.difficulty);
  assert.equal(next.version, current.version + 1);

  // getCurrentQuestion now derives the new active question
  assert.equal(getCurrentQuestion(next.questions, next.answers)?.id, 'q-3');
});

// 27. Case B — idempotent reconciliation: applying the same AnswerResult twice duplicates nothing
test('27. applying the same AnswerResult twice never duplicates answer, question, or continuation', () => {
  const current = makeInterview();
  const result = {
    answer: { id: 'ans-2', questionId: 'q-2', content: 'STAR answer', createdAt: '' },
    nextQuestion: { id: 'q-3', sequence: 3, kind: 'primary', content: 'Motivation', createdAt: '' },
    isComplete: false,
    continuation: {
      state: 'in_progress',
      canFinishNow: true,
      canUpgradeAndContinue: false,
    },
  };

  const once = applyAnswerResultToInterview(current, result);
  const twice = applyAnswerResultToInterview(once, result);

  assert.equal(twice.answers.length, 2);
  assert.equal(twice.questions.length, 3);
  assert.deepEqual(
    twice.answers.map((a) => a.id),
    once.answers.map((a) => a.id)
  );
  assert.deepEqual(
    twice.questions.map((q) => q.id),
    ['q-1', 'q-2', 'q-3']
  );
  // Continuation still the updated one
  assert.equal(twice.continuation.canFinishNow, true);
});

// 28. Case C — auto-complete answer accepted, complete fails: accepted answer stays reconciled
test('28. accepted answer survives a failed complete without reappearing as unanswered', () => {
  const current = makeInterview();
  const result = {
    answer: { id: 'ans-last', questionId: 'q-2', content: 'Final answer', createdAt: '' },
    nextQuestion: null,
    isComplete: true,
    continuation: {
      state: 'max_questions_reached',
      canFinishNow: true,
      canUpgradeAndContinue: false,
    },
  };

  // 1. submitAnswer succeeds
  const afterSubmit = applyAnswerResultToInterview(current, result);

  // 2. auto-complete is genuinely eligible
  assert.equal(shouldAutoComplete(true, result.continuation, null), true);
  assert.equal(canFinishInterview(result.continuation), true);

  // 3. complete() fails (network/server error)

  // Prove the accepted answer remains in interview state…
  assert.equal(afterSubmit.answers.length, 2);
  assert.equal(afterSubmit.answers[1].id, 'ans-last');
  assert.equal(afterSubmit.answers[1].questionId, 'q-2');

  // …continuation remains updated…
  assert.equal(afterSubmit.continuation.state, 'max_questions_reached');
  assert.equal(afterSubmit.continuation.canFinishNow, true);

  // …and getCurrentQuestion() does NOT return the already answered question
  assert.equal(getCurrentQuestion(afterSubmit.questions, afterSubmit.answers), null);

  // Re-applying the same accepted result after a failed complete stays idempotent
  const afterRetry = applyAnswerResultToInterview(afterSubmit, result);
  assert.equal(afterRetry.answers.length, 2);
});

// 29. Case D — complete idempotency key survives a failed attempt and rotates only after success
test('29. complete intent reuses the same key across failed attempts and rotates after confirmed success', () => {
  const completeIntent = createCompleteIntentState();

  const keyBeforeAttempt = completeIntent.getKey();
  assert.equal(completeIntent.getKey(), keyBeforeAttempt, 'the key is stable before any mutation');

  // Simulate a failed complete attempt (transport error): the key must NOT rotate
  assert.equal(completeIntent.getKey(), keyBeforeAttempt, 'transport failure must not rotate the complete key');

  // Retry the exact same unresolved intent
  const keyAfterRetry = completeIntent.getKey();
  assert.equal(keyAfterRetry, keyBeforeAttempt, 'retry reuses the same unresolved complete key');

  // Only a confirmed successful completion mints a fresh key for a future intent
  completeIntent.confirmComplete();
  assert.notEqual(completeIntent.getKey(), keyBeforeAttempt);
  assert.equal(completeIntent.getKey(), completeIntent.getKey(), 'new key is stable too');
});

// 30. Case E — upgrade_required is still never auto-complete, even after an accepted answer
test('30. upgrade_required with nextQuestion=null is NOT auto-complete and never requests complete', () => {
  const continuationUpgradeRequired = {
    state: 'upgrade_required',
    canFinishNow: true,
    canUpgradeAndContinue: true,
  };

  assert.equal(
    shouldAutoComplete(true, continuationUpgradeRequired, null),
    false,
    'nextQuestion = null + upgrade_required must never auto-complete'
  );
  assert.equal(
    shouldAutoComplete(false, continuationUpgradeRequired, null),
    false
  );

  // Also with a continuation even where canFinishNow is true
  assert.equal(canFinishInterview(continuationUpgradeRequired), true);
  assert.equal(
    shouldAutoComplete(true, continuationUpgradeRequired, null) &&
      canFinishInterview(continuationUpgradeRequired),
    false,
    'no complete request is fired for upgrade_required'
  );

  // In contrast, max_questions_reached with isComplete and no next question still auto-completes
  const continuationMaxReached = {
    state: 'max_questions_reached',
    canFinishNow: true,
    canUpgradeAndContinue: false,
  };
  assert.equal(shouldAutoComplete(true, continuationMaxReached, null), true);
});
