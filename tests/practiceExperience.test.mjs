import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeStarPracticeEvaluation,
} from '../src/services/interviewContract.ts';
import {
  buildStarAttemptRequest,
} from '../src/utils/scenarioHelpers.ts';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('STAR natural-answer request sends one question and one answer only', () => {
  const request = buildStarAttemptRequest(
    {
      question: '  Tell me about an incident  ',
      answer: '  I restored the service and reduced MTTR by 40%.  ',
    },
    'same-logical-intent-key'
  );

  assert.deepEqual(request, {
    url: '/star-attempts',
    data: {
      question: 'Tell me about an incident',
      answer: 'I restored the service and reduced MTTR by 40%.',
    },
    headers: { 'Idempotency-Key': 'same-logical-intent-key' },
  });
  assert.equal('situation' in request.data, false);
  assert.equal('task' in request.data, false);
  assert.equal('action' in request.data, false);
  assert.equal('result' in request.data, false);
});

test('STAR detected=false strips stale score and evidence while retaining feedback', () => {
  const normalized = normalizeStarPracticeEvaluation({
    applicable: true,
    overallScore: 0,
    task: {
      detected: false,
      score: 91,
      evidence: 'stale evidence must not render',
      feedback: 'Nêu rõ trách nhiệm của riêng bạn.',
    },
    missingElements: ['Task'],
  });

  assert.equal(normalized?.overallScore, 0);
  assert.deepEqual(normalized?.task, {
    detected: false,
    score: 0,
    evidence: '',
    feedback: 'Nêu rõ trách nhiệm của riêng bạn.',
  });
  assert.deepEqual(normalized?.missingElements, ['Task']);
});

test('STAR preserves null versus genuine zero overall score', () => {
  const unavailable = normalizeStarPracticeEvaluation({ applicable: true, overallScore: null });
  const zero = normalizeStarPracticeEvaluation({ applicable: true, overallScore: 0 });

  assert.equal(unavailable?.overallScore, null);
  assert.equal(zero?.overallScore, 0);
});

test('Practice routes point to real production modes and contain no prototype mocks', async () => {
  const [hub, star, scenarioRoute, scenarioDetailRoute] = await Promise.all([
    readSource('../src/components/features/practice/PracticeHub.tsx'),
    readSource('../src/components/features/practice/StarPractice.tsx'),
    readSource('../src/app/(dashboard)/practice/scenarios/page.tsx'),
    readSource('../src/app/(dashboard)/practice/scenarios/[slug]/page.tsx'),
  ]);
  const migratedSource = [hub, star, scenarioRoute, scenarioDetailRoute].join('\n');

  assert.match(hub, /['"]\/interviews\/new['"]/);
  assert.match(hub, /['"]\/practice\/scenarios['"]/);
  assert.match(hub, /['"]\/practice\/star['"]/);
  assert.doesNotMatch(migratedSource, /PrototypeContext|MOCK_SCENARIOS|MOCK_STAR|evaluatePrototype/);
  assert.doesNotMatch(migratedSource, /localStorage/);
});

test('Scenario completed retry selects a fresh server attempt without copying the source answer', async () => {
  const source = await readSource('../src/components/features/scenarios/ScenarioPractice.tsx');
  const retryStart = source.indexOf('const handleRetry');
  const retryEnd = source.indexOf('return (', retryStart);
  const retryBlock = source.slice(retryStart, retryEnd);

  assert.match(retryBlock, /retryMutation\.mutateAsync/);
  assert.match(retryBlock, /setSelectedAttemptId\(attempt\.id\)/);
  assert.match(retryBlock, /setUserAnswerText\(attempt\.answer \|\| ''\)/);
  assert.doesNotMatch(retryBlock, /currentAttempt\?\.answer|draftContent/);
});

test('Scenario access recovery covers start, submit, and retry with an exact return route', async () => {
  const source = await readSource('../src/components/features/scenarios/ScenarioPractice.tsx');

  assert.equal(
    source.match(/setUpgradeRequired\(isScenarioAccessError\(err\)\)/g)?.length,
    3
  );
  assert.match(
    source,
    /encodeURIComponent\(`\/practice\/scenarios\/\$\{scenario\.slug\}`\)/
  );
});

test('Scenario completed-without-evaluation recovery stays inside the result workbench', async () => {
  const source = await readSource('../src/components/features/scenarios/ScenarioPractice.tsx');
  const missingEvaluation = source.indexOf(
    "attemptStatus === 'completed' && !currentAttempt?.evaluation"
  );
  const workbenchEnd = source.indexOf('{/* History view */}');

  assert.ok(missingEvaluation > 0);
  assert.ok(missingEvaluation < workbenchEnd);
});

test('Practice UI never renders a fake processing percentage or sample completed history', async () => {
  const source = await readSource('../src/components/features/practice/StarPractice.tsx');
  assert.doesNotMatch(source, /33%|65%|95%|setTimeout\(/);
  assert.doesNotMatch(source, /fullSample|missingResultSample|sample completed/i);
});
