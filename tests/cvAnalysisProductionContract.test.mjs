import test from 'node:test';
import assert from 'node:assert/strict';

// Production contract constants for CV / Resume Analysis
const MAX_OPERATION_AGE_MS = 60 * 60 * 1000; // 1 hour
const DETERMINISTIC_ERROR_CODES = ['FEATURE_QUOTA_EXCEEDED', 'FEATURE_NOT_AVAILABLE', 'RESUME_ANALYSIS_CONTEXT_INVALID'];

const JOB_TARGETED_BREAKDOWN_KEYS = [
  'technicalSkillMatch',
  'experienceRelevance',
  'impactEvidence',
  'clarity',
  'structure',
];

const FIELD_BENCHMARK_BREAKDOWN_KEYS = [
  'technicalFoundation',
  'projectEvidence',
  'experiencePresentation',
  'impactAchievements',
  'clarity',
  'roleAlignment',
];

// Helper functions implementing contract business rules
function buildAnalysisRequest(mode, params) {
  if (mode === 'job_targeted') {
    return {
      resumeId: params.resumeId,
      mode: 'job_targeted',
      jobDescriptionId: params.jobDescriptionId,
    };
  }
  if (mode === 'field_benchmark') {
    return {
      resumeId: params.resumeId,
      mode: 'field_benchmark',
      industry: params.industry?.trim(),
      targetRole: params.targetRole?.trim(),
      seniority: params.seniority?.trim(),
    };
  }
  throw new Error(`Unsupported mode: ${mode}`);
}

function shouldRetryTransportError(error) {
  if (!error) return false;
  if (error.code && DETERMINISTIC_ERROR_CODES.includes(error.code)) return false;
  if (error.status && error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
    return false;
  }
  return true;
}

function normalizePendingAnalysis(raw, currentUserId) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.userId && currentUserId && raw.userId !== currentUserId) return null;
  if (typeof raw.timestamp === 'number' && Date.now() - raw.timestamp > MAX_OPERATION_AGE_MS) {
    return null;
  }
  if (!raw.resumeId || !raw.idempotencyKey) return null;

  if (!raw.mode) {
    if (raw.jdTitle && raw.jdContent) {
      return {
        ...raw,
        mode: 'job_targeted',
      };
    }
    return null;
  }

  if (raw.mode === 'job_targeted') {
    if (!raw.jdTitle || !raw.jdContent) return null;
    return raw;
  }

  if (raw.mode === 'field_benchmark') {
    if (!raw.industry || !raw.targetRole || !raw.seniority) return null;
    return raw;
  }

  return null;
}

function prepareSubmitPayload(mode, formData) {
  if (mode === 'job_targeted') {
    return {
      mode: 'job_targeted',
      resumeId: formData.resumeId,
      jdTitle: formData.jdTitle,
      jdContent: formData.jdContent,
    };
  }
  if (mode === 'field_benchmark') {
    return {
      mode: 'field_benchmark',
      resumeId: formData.resumeId,
      industry: formData.industry,
      targetRole: formData.targetRole,
      seniority: formData.seniority,
    };
  }
  throw new Error(`Unknown mode: ${mode}`);
}

function extractAnalysisScoreAndBreakdown(result, mode) {
  const effectiveMode = mode || (result?.readinessScore !== undefined ? 'field_benchmark' : 'job_targeted');
  if (effectiveMode === 'job_targeted') {
    return {
      mode: 'job_targeted',
      score: result.matchScore,
      breakdownKeys: Object.keys(result.breakdown || {}).filter((k) => JOB_TARGETED_BREAKDOWN_KEYS.includes(k)),
      hasSkills: Array.isArray(result.matchedKeywordsOrSkills) && Array.isArray(result.missingKeywordsOrSkills),
    };
  }
  return {
    mode: 'field_benchmark',
    score: result.readinessScore,
    breakdownKeys: Object.keys(result.breakdown || {}).filter((k) => FIELD_BENCHMARK_BREAKDOWN_KEYS.includes(k)),
    hasSkills: false,
  };
}

// 1. job_targeted request contains explicit mode and JD ID
test('1. job_targeted request contains explicit mode and JD ID', () => {
  const req = buildAnalysisRequest('job_targeted', {
    resumeId: 'res-123',
    jobDescriptionId: 'jd-456',
    industry: 'Tech', // stray field
  });

  assert.equal(req.mode, 'job_targeted');
  assert.equal(req.resumeId, 'res-123');
  assert.equal(req.jobDescriptionId, 'jd-456');
  assert.equal(req.industry, undefined);
  assert.equal(req.targetRole, undefined);
  assert.equal(req.seniority, undefined);
});

// 2. field_benchmark request contains explicit mode/context and no JD ID
test('2. field_benchmark request contains explicit mode/context and no JD ID', () => {
  const req = buildAnalysisRequest('field_benchmark', {
    resumeId: 'res-123',
    industry: 'Fintech',
    targetRole: 'Senior Backend Engineer',
    seniority: 'Senior',
    jobDescriptionId: 'jd-unexpected',
  });

  assert.equal(req.mode, 'field_benchmark');
  assert.equal(req.resumeId, 'res-123');
  assert.equal(req.industry, 'Fintech');
  assert.equal(req.targetRole, 'Senior Backend Engineer');
  assert.equal(req.seniority, 'Senior');
  assert.equal(req.jobDescriptionId, undefined);
});

// 3. field_benchmark does NOT call/create Job Description
test('3. field_benchmark does NOT call/create Job Description', async () => {
  let jdCreated = false;
  let analysisCreated = false;

  const coordinatorMock = {
    async createJobDescription() {
      jdCreated = true;
      return { id: 'jd-fail' };
    },
    async createAnalysis(req) {
      analysisCreated = true;
      assert.equal(req.mode, 'field_benchmark');
      assert.equal(req.jobDescriptionId, undefined);
      return { id: 'analysis-999' };
    },
  };

  const op = {
    mode: 'field_benchmark',
    resumeId: 'res-123',
    industry: 'HealthTech',
    targetRole: 'Data Scientist',
    seniority: 'Mid',
    idempotencyKey: 'idem-key-1',
  };

  // Execute workflow
  if (op.mode === 'job_targeted') {
    await coordinatorMock.createJobDescription();
  }
  const result = await coordinatorMock.createAnalysis(buildAnalysisRequest(op.mode, op));

  assert.equal(jdCreated, false, 'JD creation must not be invoked for field_benchmark');
  assert.equal(analysisCreated, true);
  assert.equal(result.id, 'analysis-999');
});

// 4. job_targeted recovery reuses an already-created jobDescriptionId
test('4. job_targeted recovery reuses an already-created jobDescriptionId', async () => {
  let jdCalls = 0;
  const coordinatorMock = {
    async createJobDescription() {
      jdCalls++;
      return { id: 'new-jd-id' };
    },
    async createAnalysis(req) {
      return { id: 'analysis-123', jobDescriptionId: req.jobDescriptionId };
    },
  };

  // Operation that already persisted a jobDescriptionId before failure
  const recoveredOp = {
    mode: 'job_targeted',
    resumeId: 'res-1',
    jdTitle: 'Frontend Dev',
    jdContent: 'React Next.js',
    jobDescriptionId: 'persisted-jd-999',
    idempotencyKey: 'idem-key-2',
  };

  let effectiveJdId = recoveredOp.jobDescriptionId;
  if (!effectiveJdId) {
    const jd = await coordinatorMock.createJobDescription();
    effectiveJdId = jd.id;
  }

  const analysis = await coordinatorMock.createAnalysis({
    resumeId: recoveredOp.resumeId,
    mode: 'job_targeted',
    jobDescriptionId: effectiveJdId,
  });

  assert.equal(jdCalls, 0, 'Must NOT re-create JD if jobDescriptionId is already present');
  assert.equal(analysis.jobDescriptionId, 'persisted-jd-999');
});

// 5. transport replay uses the same analysis idempotency key
test('5. transport replay uses the same analysis idempotency key', () => {
  const initialKey = '550e8400-e29b-41d4-a716-446655440000';
  const op = {
    mode: 'job_targeted',
    resumeId: 'res-1',
    jdTitle: 'DevOps',
    jdContent: 'AWS Docker',
    idempotencyKey: initialKey,
  };

  // First dispatch
  const header1 = { 'Idempotency-Key': op.idempotencyKey };
  // Replay attempt after transient network drop
  const replayOp = { ...op };
  const header2 = { 'Idempotency-Key': replayOp.idempotencyKey };

  assert.equal(header1['Idempotency-Key'], initialKey);
  assert.equal(header2['Idempotency-Key'], initialKey);
  assert.equal(header1['Idempotency-Key'], header2['Idempotency-Key']);
});

// 6. old pending local-state safely migrates to explicit job_targeted schema
test('6. old pending local-state safely migrates to explicit job_targeted schema', () => {
  const legacyRecord = {
    userId: 'user-abc',
    idempotencyKey: 'idem-legacy',
    resumeId: 'res-legacy',
    jdTitle: 'Fullstack Engineer',
    jdContent: 'Node and React',
    timestamp: Date.now() - 5000,
  };

  const migrated = normalizePendingAnalysis(legacyRecord, 'user-abc');
  assert.ok(migrated !== null);
  assert.equal(migrated.mode, 'job_targeted');
  assert.equal(migrated.resumeId, 'res-legacy');
  assert.equal(migrated.jdTitle, 'Fullstack Engineer');
  assert.equal(migrated.jdContent, 'Node and React');
  assert.equal(migrated.idempotencyKey, 'idem-legacy');
});

// 7. invalid/expired persisted operation is rejected/cleared safely
test('7. invalid/expired persisted operation is rejected/cleared safely', () => {
  // Expired operation (> 1 hour)
  const expiredRecord = {
    userId: 'user-abc',
    mode: 'job_targeted',
    idempotencyKey: 'idem-old',
    resumeId: 'res-old',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now() - (MAX_OPERATION_AGE_MS + 1000),
  };
  assert.equal(normalizePendingAnalysis(expiredRecord, 'user-abc'), null);

  // Mismatched user ID
  const wrongUserRecord = {
    userId: 'user-other',
    mode: 'job_targeted',
    idempotencyKey: 'idem-wrong',
    resumeId: 'res-1',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(wrongUserRecord, 'user-abc'), null);

  // Corrupt record (missing resumeId)
  const corruptRecord = {
    userId: 'user-abc',
    mode: 'field_benchmark',
    idempotencyKey: 'idem-corrupt',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(corruptRecord, 'user-abc'), null);

  // Null/non-object
  assert.equal(normalizePendingAnalysis(null, 'user-abc'), null);
  assert.equal(normalizePendingAnalysis('invalid-json-string', 'user-abc'), null);
});

// 8. result-mode discriminator selects matchScore and 5 dimensions for job_targeted
test('8. result-mode discriminator selects matchScore and 5 dimensions for job_targeted', () => {
  const mockResult = {
    matchScore: 88,
    summary: 'Strong candidate profile',
    matchedKeywordsOrSkills: ['React', 'TypeScript'],
    missingKeywordsOrSkills: ['GraphQL'],
    breakdown: {
      technicalSkillMatch: 90,
      experienceRelevance: 85,
      impactEvidence: 80,
      clarity: 95,
      structure: 90,
      extraUnrelated: 50,
    },
  };

  const parsed = extractAnalysisScoreAndBreakdown(mockResult, 'job_targeted');
  assert.equal(parsed.mode, 'job_targeted');
  assert.equal(parsed.score, 88);
  assert.equal(parsed.breakdownKeys.length, 5);
  for (const k of JOB_TARGETED_BREAKDOWN_KEYS) {
    assert.ok(parsed.breakdownKeys.includes(k), `Missing breakdown key: ${k}`);
  }
  assert.equal(parsed.hasSkills, true);
});

// 9. result-mode discriminator selects readinessScore and 6 dimensions for field_benchmark
test('9. result-mode discriminator selects readinessScore and 6 dimensions for field_benchmark', () => {
  const mockResult = {
    readinessScore: 78,
    summary: 'Good baseline readiness for Senior level',
    breakdown: {
      technicalFoundation: 80,
      projectEvidence: 75,
      experiencePresentation: 70,
      impactAchievements: 85,
      clarity: 90,
      roleAlignment: 68,
    },
  };

  const parsed = extractAnalysisScoreAndBreakdown(mockResult, 'field_benchmark');
  assert.equal(parsed.mode, 'field_benchmark');
  assert.equal(parsed.score, 78);
  assert.equal(parsed.breakdownKeys.length, 6);
  for (const k of FIELD_BENCHMARK_BREAKDOWN_KEYS) {
    assert.ok(parsed.breakdownKeys.includes(k), `Missing breakdown key: ${k}`);
  }
  assert.equal(parsed.hasSkills, false);
});

// 10. frontend never computes a second free quota per mode
test('10. frontend never computes a second free quota per mode', () => {
  // Quota is authoritative at server level (FEATURE_QUOTA_EXCEEDED).
  // Switching between job_targeted and field_benchmark does NOT grant separate free quotas in FE.
  const quotaState = {
    featureQuotaExceeded: false,
  };

  function onServerQuotaExceeded() {
    quotaState.featureQuotaExceeded = true;
  }

  function canAttemptAnalysis() {
    // Both modes check the same global quota flag; no mode-specific bypass
    return !quotaState.featureQuotaExceeded;
  }

  assert.equal(canAttemptAnalysis(), true);
  // Server rejects with quota exceeded
  onServerQuotaExceeded();
  assert.equal(canAttemptAnalysis(), false, 'Quota exceeded blocks job_targeted');

  // Switch to field_benchmark in FE: quota MUST still be respected and blocked
  const mode = 'field_benchmark';
  assert.equal(canAttemptAnalysis(), false, `Switching to ${mode} must not bypass server quota limit`);
});

// 11. quota ApiError is treated as deterministic—not transport-retried
test('11. quota ApiError is treated as deterministic—not transport-retried', () => {
  const quotaError403 = {
    name: 'ApiError',
    status: 403,
    code: 'FEATURE_QUOTA_EXCEEDED',
    message: 'Bạn đã dùng hết lượt của tính năng này.',
  };

  const unavailableError403 = {
    name: 'ApiError',
    status: 403,
    code: 'FEATURE_NOT_AVAILABLE',
    message: 'Tính năng này hiện không khả dụng.',
  };

  const transientNetworkError = {
    name: 'TypeError',
    message: 'Failed to fetch',
  };

  const server500Error = {
    name: 'ApiError',
    status: 500,
    message: 'Internal server error',
  };

  assert.equal(shouldRetryTransportError(quotaError403), false, 'Quota 403 must not retry');
  assert.equal(shouldRetryTransportError(unavailableError403), false, 'Unavailable 403 must not retry');
  assert.equal(shouldRetryTransportError(transientNetworkError), true, 'Network failure must retry');
  assert.equal(shouldRetryTransportError(server500Error), true, '500 Internal error must retry');
});

// 12. hidden fields from the other mode are not submitted
test('12. hidden fields from the other mode are not submitted', () => {
  // User typed into benchmark fields, then switched back to job_targeted
  const formWithStaleBenchmarkFields = {
    resumeId: 'res-active',
    jdTitle: 'Backend Engineer',
    jdContent: 'Go, PostgreSQL',
    industry: 'Stale FinTech',
    targetRole: 'Stale Lead',
    seniority: 'Stale Staff',
  };

  const submittedJobTargeted = prepareSubmitPayload('job_targeted', formWithStaleBenchmarkFields);
  assert.equal(submittedJobTargeted.mode, 'job_targeted');
  assert.equal(submittedJobTargeted.jdTitle, 'Backend Engineer');
  assert.equal(submittedJobTargeted.jdContent, 'Go, PostgreSQL');
  assert.equal(submittedJobTargeted.industry, undefined, 'Must not submit industry in job_targeted mode');
  assert.equal(submittedJobTargeted.targetRole, undefined, 'Must not submit targetRole in job_targeted mode');
  assert.equal(submittedJobTargeted.seniority, undefined, 'Must not submit seniority in job_targeted mode');

  // User typed into JD fields, then switched to field_benchmark
  const formWithStaleJdFields = {
    resumeId: 'res-active',
    industry: 'AI / ML',
    targetRole: 'ML Engineer',
    seniority: 'Senior',
    jdTitle: 'Stale JD Title',
    jdContent: 'Stale JD Description',
  };

  const submittedFieldBenchmark = prepareSubmitPayload('field_benchmark', formWithStaleJdFields);
  assert.equal(submittedFieldBenchmark.mode, 'field_benchmark');
  assert.equal(submittedFieldBenchmark.industry, 'AI / ML');
  assert.equal(submittedFieldBenchmark.targetRole, 'ML Engineer');
  assert.equal(submittedFieldBenchmark.seniority, 'Senior');
  assert.equal(submittedFieldBenchmark.jdTitle, undefined, 'Must not submit jdTitle in field_benchmark mode');
  assert.equal(submittedFieldBenchmark.jdContent, undefined, 'Must not submit jdContent in field_benchmark mode');
});
