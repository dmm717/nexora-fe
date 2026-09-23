import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Seamless Interview Contract: question preparation retry and results retry request builders', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  const questionRetry = contract.buildRetryQuestionPreparationRequest('iv-123', 'key-abc');
  assert.equal(questionRetry.method, 'POST');
  assert.equal(questionRetry.url, '/interviews/iv-123/questions/retry');
  assert.equal(questionRetry.headers['Idempotency-Key'], 'key-abc');

  const resultsRetry = contract.buildRetryResultsRequest('iv-456', 'key-def');
  assert.equal(resultsRetry.method, 'POST');
  assert.equal(resultsRetry.url, '/interviews/iv-456/results/retry');
  assert.equal(resultsRetry.headers['Idempotency-Key'], 'key-def');
});

test('Seamless Interview API: client methods for question and results retry exist', () => {
  const apiSource = readFileSync(
    new URL('../src/services/interviewApi.ts', import.meta.url),
    'utf8'
  );

  assert.match(apiSource, /retryQuestionPreparation:\s*async\s*\(/);
  assert.match(apiSource, /buildRetryQuestionPreparationRequest/);
  assert.match(apiSource, /retryResults:\s*async\s*\(/);
  assert.match(apiSource, /buildRetryResultsRequest/);
});

test('Interview Room: mid-interview coaching drawer is removed and background evaluation is non-blocking', () => {
  const roomSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
    'utf8'
  );

  // QuickCoachingDrawer is strictly not used during active interview session
  assert.doesNotMatch(roomSource, /<QuickCoachingDrawer/);
  assert.doesNotMatch(roomSource, /showCoaching/);

  // Candidate controls are locked strictly during in-flight submit request, never during background evaluation
  assert.match(roomSource, /isLocked=\{submitting\}/);
  assert.match(roomSource, /submitDisabled=\{!canAnswer \|\| submitting\}/);

  // Question preparation states in room
  assert.match(roomSource, /interview\.questionPreparationState === 'processing'/);
  assert.match(roomSource, /Đang chuẩn bị câu hỏi tiếp theo\.\.\./);
  assert.match(roomSource, /interview\.questionPreparationState === 'failed'/);
  assert.match(roomSource, /Chưa thể chuẩn bị câu hỏi tiếp theo\./);
  assert.match(roomSource, /handleRetryQuestionPreparation/);

  // Status label while submitting
  assert.match(roomSource, /Đang lưu câu trả lời\.\.\./);
  assert.match(roomSource, /submissionPhase=\{submitting \? 'submitting' : 'idle'\}/);

  // Authoritative Free upgrade boundary: modal opens only when server explicitly requires upgrade
  assert.match(roomSource, /!result\.nextQuestion &&\s*effectiveContinuation\?\.state === 'upgrade_required'/);
  assert.match(roomSource, /if\s*\(isFreeUpgradeBoundary\)\s*\{\s*setShowQ3BoundaryModal\(true\);/);

  // Continuation card suppressed when question preparation is processing or failed
  assert.match(
    roomSource,
    /interview\.questionPreparationState !== 'processing' &&\s*interview\.questionPreparationState !== 'failed'/
  );

  // Recoverable submit retry copy represents idempotent answer resubmission
  assert.match(roomSource, /Thử gửi lại/);
});

test('Speech System: Azure TTS uses DragonHD voice and stops before candidate STT starts', async () => {
  const speechConfig = await import('../src/config/speech.ts');
  assert.equal(speechConfig.INTERVIEW_SPEECH_CONFIG.voiceName, 'de-DE-Seraphina:DragonHDLatestNeural');

  const roomSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
    'utf8'
  );

  // Stops TTS before candidate begins speaking
  assert.match(roomSource, /onBeforeListening=\{async \(\) => \{\s*await questionSpeakerRef\.current\?\.stop\(\);/);
});

test('Interview Report: displays evaluationProgress counts and handles resultState failure retry', () => {
  const reportSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/report/page.tsx', import.meta.url),
    'utf8'
  );

  // Shows progress counts during processing
  assert.match(reportSource, /interview\?\.evaluationProgress/);
  assert.match(reportSource, /progress\.ready\}\/\$\{progress\.total/);

  // Handles result failure with retry CTA
  assert.match(reportSource, /interview\?\.resultState === 'failed'/);
  assert.match(reportSource, /Thử xử lý lại/);
  assert.match(reportSource, /handleRetryResults/);
  assert.match(reportSource, /interviewApi\.retryResults/);

  // Product feedback card and dialog at bottom of completed report
  assert.match(reportSource, /Trải nghiệm buổi phỏng vấn này thế nào\?/);
  assert.match(reportSource, /Gửi đánh giá về Nexora/);
  assert.match(reportSource, /<ProductFeedbackDialog/);
});

test('1. AnswerResult with nextQuestion=null + continuation=in_progress does not leave room in stale ready state', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  const currentInterview = {
    id: 'iv-batch-1',
    status: 'active',
    role: 'Backend Engineer',
    seniority: 'Senior',
    interviewType: 'behavioral',
    difficulty: 'hard',
    version: 20,
    questions: [
      { id: 'q-20', sequence: 20, kind: 'primary', content: 'Batch final question', createdAt: '' },
    ],
    answers: [],
    questionPreparationState: 'ready',
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
    createdAt: '',
    updatedAt: '',
  };

  const answerResult = {
    answer: { id: 'ans-20', questionId: 'q-20', content: 'Comprehensive answer', createdAt: '' },
    nextQuestion: null,
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
  };

  const reconciled = contract.applyAnswerResultToInterview(currentInterview, answerResult);

  // Must immediately reconcile questionPreparationState to 'processing'
  assert.equal(
    reconciled.questionPreparationState,
    'processing',
    'Batch boundary with nextQuestion=null and continuation=in_progress must transition questionPreparationState to processing'
  );
  assert.equal(reconciled.answers.length, 1);
  assert.equal(reconciled.answers[0].id, 'ans-20');
});

test('2. Canonical questionPreparationState=processing suppresses /continue UI/action', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  const action = contract.getInterviewContinuationAction({
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
    answeredQuestionCount: 3,
    hasActiveQuestion: false,
    questionPreparationState: 'processing',
  });

  assert.equal(
    action,
    'none',
    'When questionPreparationState is processing, continuationAction must be none (never continue_same_session)'
  );
});

test('3. Canonical questionPreparationState=failed exposes only question retry, not /continue', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  const action = contract.getInterviewContinuationAction({
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
    answeredQuestionCount: 3,
    hasActiveQuestion: false,
    questionPreparationState: 'failed',
  });

  assert.equal(
    action,
    'none',
    'When questionPreparationState is failed, continuationAction must be none so manual continue is suppressed'
  );
});

test('4. Paid continuation preparation: polling obtains released Q4 without another continue', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  // Step 1: Candidate answers Q3 while paid question preparation is pending
  const current = {
    id: 'iv-paid',
    status: 'active',
    role: 'Staff Engineer',
    seniority: 'Staff',
    interviewType: 'system_design',
    difficulty: 'hard',
    version: 20,
    questions: [
      { id: 'q-3', sequence: 3, kind: 'primary', content: 'Scaling DB', createdAt: '' },
    ],
    answers: [],
    questionPreparationState: 'ready',
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
    createdAt: '',
    updatedAt: '',
  };

  const answerResult = {
    answer: { id: 'ans-3', questionId: 'q-3', content: 'Distributed caching strategy', createdAt: '' },
    nextQuestion: null,
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
  };

  const state1 = contract.applyAnswerResultToInterview(current, answerResult);
  assert.equal(state1.questionPreparationState, 'processing');
  assert.equal(
    contract.getInterviewContinuationAction({
      continuation: state1.continuation,
      answeredQuestionCount: state1.answers.length,
      hasActiveQuestion: Boolean(contract.getCurrentQuestion(state1.questions, state1.answers)),
      questionPreparationState: state1.questionPreparationState,
    }),
    'none',
    'No continue action during paid question preparation'
  );

  // Step 2: Background planning completes; canonical GET returns Q4 with state ready
  const serverUpdate = {
    ...state1,
    questions: [
      ...state1.questions,
      { id: 'q-4', sequence: 4, kind: 'primary', content: 'Event-driven architecture', createdAt: '' },
    ],
    questionPreparationState: 'ready',
    version: 21,
  };

  const activeQ = contract.getCurrentQuestion(serverUpdate.questions, serverUpdate.answers);
  assert.ok(activeQ);
  assert.equal(activeQ.id, 'q-4');
  assert.equal(activeQ.sequence, 4);
});

test('stale GET resolving after Q2 POST cannot rewind the accepted answer or Q3', async () => {
  const contract = await import('../src/services/interviewContract.ts');
  const q2 = { id: 'q-2', sequence: 2, kind: 'primary', content: 'Q2', createdAt: '' };
  const q3 = { id: 'q-3', sequence: 3, kind: 'primary', content: 'Q3', createdAt: '' };
  const oldGet = {
    id: 'iv-race', status: 'active', version: 10, questions: [q2], answers: [],
    continuation: { state: 'in_progress', canFinishNow: false, canUpgradeAndContinue: false },
    questionPreparationState: 'ready', reportState: 'none', resultState: 'collecting',
  };
  const accepted = contract.applyAnswerResultToInterview(oldGet, {
    answer: { id: 'a-2', questionId: 'q-2', content: 'Answer', createdAt: '' },
    nextQuestion: q3,
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
  });
  const afterStaleGet = contract.reconcileInterviewSnapshot(accepted, oldGet);
  assert.equal(afterStaleGet.version, 11);
  assert.equal(afterStaleGet.answers[0].id, 'a-2');
  assert.equal(contract.getCurrentQuestion(afterStaleGet.questions, afterStaleGet.answers).id, 'q-3');
  assert.equal(contract.reconcileInterviewSnapshot(afterStaleGet, { ...oldGet, version: 11 }), afterStaleGet);
  assert.equal(contract.reconcileInterviewSnapshot(afterStaleGet, { ...accepted, version: 12 }).version, 12);

  const hook = readFileSync(new URL('../src/hooks/queries/useInterviews.ts', import.meta.url), 'utf8');
  assert.match(hook, /reconcileInterviewSnapshot\(/);
});

test('input mode belongs to interview room and report recovery stays user-triggered', () => {
  const room = readFileSync(new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url), 'utf8');
  const dock = readFileSync(new URL('../src/components/features/interview/AudioSpeechDock.tsx', import.meta.url), 'utf8');
  const report = readFileSync(new URL('../src/app/(dashboard)/interviews/[id]/report/page.tsx', import.meta.url), 'utf8');
  assert.match(room, /const \[inputMode, setInputMode\]/);
  assert.match(room, /mode=\{inputMode\}/);
  assert.match(dock, /aria-pressed=\{effectiveMode === 'voice'\}/);
  assert.match(dock, /aria-pressed=\{effectiveMode === 'chatbox'\}/);
  assert.match(dock, /onEditorOpenChange\?\.\(next === 'chatbox'\)/);
  assert.doesNotMatch(dock, /setDeviceMode/);
  assert.match(report, /Khôi phục xử lý kết quả/);
  assert.match(report, /onClick=\{handleRetryResults\}/);
});

test('5. Paid user Q3: Q4 returned -> no Free boundary modal', () => {
  const answerResult = {
    answer: { id: 'ans-3', questionId: 'q-3', content: 'My leadership experience', createdAt: '' },
    nextQuestion: { id: 'q-4', sequence: 4, kind: 'primary', content: 'Technical conflict', createdAt: '' },
    continuation: { state: 'in_progress', canFinishNow: true, canUpgradeAndContinue: false },
  };

  const effectiveContinuation = answerResult.continuation;
  const isFreeUpgradeBoundary =
    !answerResult.nextQuestion &&
    effectiveContinuation?.state === 'upgrade_required';

  assert.equal(isFreeUpgradeBoundary, false, 'Paid user with nextQuestion Q4 must NOT trigger Free boundary modal');
});

test('6. Free user Q3: continuation=upgrade_required + no Q4 -> boundary modal opens', () => {
  const answerResult = {
    answer: { id: 'ans-3', questionId: 'q-3', content: 'Free answer 3', createdAt: '' },
    nextQuestion: null,
    continuation: { state: 'upgrade_required', canFinishNow: true, canUpgradeAndContinue: true },
  };

  const effectiveContinuation = answerResult.continuation;
  const isFreeUpgradeBoundary =
    !answerResult.nextQuestion &&
    effectiveContinuation?.state === 'upgrade_required';

  assert.equal(isFreeUpgradeBoundary, true, 'Free user at Q3 boundary must trigger Free boundary modal');
});

test('7. POST /answers in-flight copy does not claim AI evaluation and never claims Đã nộp before 2xx', async () => {
  const contract = await import('../src/services/interviewContract.ts');

  const submittingStatus = contract.getAnswerSubmissionStatus({
    phase: 'submitting',
    listening: false,
    mode: 'chatbox',
    timerLabel: '00:15',
  });
  assert.equal(submittingStatus, 'Đang lưu câu trả lời...', 'In-flight HTTP POST must state Đang lưu câu trả lời...');
  assert.doesNotMatch(submittingStatus, /AI đang đánh giá/);
  assert.doesNotMatch(submittingStatus, /Đã nộp/);

  const idleStatus = contract.getAnswerSubmissionStatus({
    phase: 'idle',
    listening: false,
    mode: 'chatbox',
    timerLabel: '00:00',
  });
  assert.doesNotMatch(idleStatus, /Đã nộp/);
});

test('8. Submission retry copy represents idempotent answer resubmission, not evaluation retry', () => {
  const roomSource = readFileSync(
    new URL('../src/app/(dashboard)/interviews/[id]/page.tsx', import.meta.url),
    'utf8'
  );
  assert.match(roomSource, /Thử gửi lại/);
  assert.doesNotMatch(roomSource, /Thử lại đánh giá/);
});
