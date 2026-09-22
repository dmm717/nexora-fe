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

  // Immediate Q3 boundary check without intermediate evaluation gate
  assert.match(roomSource, /if\s*\(activeQuestion\.sequence === 3 \|\| answeredCount === 3\)\s*\{\s*setShowQ3BoundaryModal\(true\);/);
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
