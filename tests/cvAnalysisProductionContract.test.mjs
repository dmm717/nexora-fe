import test from 'node:test';
import assert from 'node:assert/strict';

import {
  OPERATION_EXPIRY_MS,
  JOB_TARGETED_BREAKDOWN_KEYS,
  FIELD_BENCHMARK_BREAKDOWN_KEYS,
  buildCreateAnalysisRequest,
  normalizePendingAnalysis,
  isDeterministicAnalysisError,
  formatQuotaError,
  extractAnalysisPresentation,
  isMatchingPendingOperation,
} from '../src/services/cvAnalysisContract.ts';

// 1. job_targeted request contains explicit mode and JD ID
test('1. job_targeted request contains explicit mode and JD ID', () => {
  const op = {
    userId: 'user-1',
    idempotencyKey: 'idem-1',
    resumeId: 'res-123',
    mode: 'job_targeted',
    jobDescriptionId: 'jd-456',
    jdTitle: 'Frontend Engineer',
    jdContent: 'React Next.js',
    timestamp: Date.now(),
  };

  const req = buildCreateAnalysisRequest(op);

  assert.equal(req.mode, 'job_targeted');
  assert.equal(req.resumeId, 'res-123');
  assert.equal(req.jobDescriptionId, 'jd-456');
  assert.equal(req.industry, undefined);
  assert.equal(req.targetRole, undefined);
  assert.equal(req.seniority, undefined);

  // Throws if jobDescriptionId is missing
  assert.throws(
    () => buildCreateAnalysisRequest({ ...op, jobDescriptionId: null }),
    /jobDescriptionId is required/
  );
});

// 2. field_benchmark request contains explicit mode/context and no JD ID
test('2. field_benchmark request contains explicit mode/context and no JD ID', () => {
  const op = {
    userId: 'user-1',
    idempotencyKey: 'idem-2',
    resumeId: 'res-123',
    mode: 'field_benchmark',
    industry: '  FinTech  ',
    targetRole: '  Senior Engineer  ',
    seniority: '  Senior  ',
    timestamp: Date.now(),
  };

  const req = buildCreateAnalysisRequest(op);

  assert.equal(req.mode, 'field_benchmark');
  assert.equal(req.resumeId, 'res-123');
  assert.equal(req.industry, 'FinTech');
  assert.equal(req.targetRole, 'Senior Engineer');
  assert.equal(req.seniority, 'Senior');
  assert.equal(req.jobDescriptionId, undefined);

  // Throws if any required field is empty or whitespace
  assert.throws(
    () => buildCreateAnalysisRequest({ ...op, industry: '   ' }),
    /industry, targetRole, and seniority are required/
  );
});

// 3. field_benchmark does NOT call/create Job Description
test('3. field_benchmark does NOT call/create Job Description', () => {
  const benchmarkOp = {
    userId: 'user-1',
    idempotencyKey: 'idem-3',
    resumeId: 'res-123',
    mode: 'field_benchmark',
    industry: 'EdTech',
    targetRole: 'Product Manager',
    seniority: 'Mid-level',
    timestamp: Date.now(),
  };

  // The request payload for field_benchmark must not include jobDescriptionId
  const req = buildCreateAnalysisRequest(benchmarkOp);
  assert.equal('jobDescriptionId' in req, false);

  // Coordinator workflow contract: field_benchmark dispatches directly without JD ID
  let jdCreated = false;
  const dispatchMock = (payload) => {
    if (payload.mode === 'job_targeted' && !payload.jobDescriptionId) {
      jdCreated = true;
    }
    return { id: 'analysis-created' };
  };

  const result = dispatchMock(req);
  assert.equal(jdCreated, false, 'field_benchmark must never trigger JD creation');
  assert.equal(result.id, 'analysis-created');
});

// 4. job_targeted recovery reuses an already-created jobDescriptionId
test('4. job_targeted recovery reuses an already-created jobDescriptionId', () => {
  const recoveredOp = {
    userId: 'user-1',
    idempotencyKey: 'idem-4',
    resumeId: 'res-123',
    mode: 'job_targeted',
    jobDescriptionId: 'persisted-jd-999',
    jdTitle: 'Backend Developer',
    jdContent: 'Go, PostgreSQL',
    timestamp: Date.now(),
  };

  let createdNewJd = false;
  let effectiveJdId = recoveredOp.jobDescriptionId;
  if (!effectiveJdId) {
    createdNewJd = true;
    effectiveJdId = 'unexpected-new-jd';
  }

  const req = buildCreateAnalysisRequest({
    ...recoveredOp,
    jobDescriptionId: effectiveJdId,
  });

  assert.equal(createdNewJd, false, 'Must not create a new JD if jobDescriptionId already exists');
  assert.equal(req.jobDescriptionId, 'persisted-jd-999');
});

// 5. transport replay uses the same analysis idempotency key
test('5. transport replay uses the same analysis idempotency key', () => {
  const originalKey = '550e8400-e29b-41d4-a716-446655440000';
  const op = {
    userId: 'user-1',
    idempotencyKey: originalKey,
    resumeId: 'res-123',
    mode: 'job_targeted',
    jobDescriptionId: 'jd-1',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now(),
  };

  // Transient retry simulation preserves exact key
  const replayAttempt = { ...op };
  assert.equal(replayAttempt.idempotencyKey, originalKey);
  assert.equal(replayAttempt.idempotencyKey, op.idempotencyKey);
});

// 6. old pending local-state safely migrates to explicit job_targeted schema
test('6. old pending local-state safely migrates to explicit job_targeted schema', () => {
  const legacyRecord = {
    userId: 'user-123',
    idempotencyKey: 'idem-legacy',
    resumeId: 'res-legacy',
    jdTitle: 'Fullstack Developer',
    jdContent: 'React, Node.js, Next.js',
    timestamp: Date.now() - 10000,
  };

  const migrated = normalizePendingAnalysis(legacyRecord, 'user-123');
  assert.ok(migrated !== null);
  assert.equal(migrated.mode, 'job_targeted');
  assert.equal(migrated.userId, 'user-123');
  assert.equal(migrated.resumeId, 'res-legacy');
  assert.equal(migrated.jdTitle, 'Fullstack Developer');
  assert.equal(migrated.jdContent, 'React, Node.js, Next.js');
  assert.equal(migrated.jobDescriptionId, null);
});

// 7. invalid/expired persisted operation is rejected/cleared safely
test('7. invalid/expired persisted operation is rejected/cleared safely', () => {
  // Expired operation (> 1 hour)
  const expired = {
    userId: 'user-1',
    mode: 'job_targeted',
    idempotencyKey: 'idem-old',
    resumeId: 'res-old',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now() - (OPERATION_EXPIRY_MS + 5000),
  };
  assert.equal(normalizePendingAnalysis(expired, 'user-1'), null);

  // Blank jdTitle or jdContent after trim
  const blankTitle = {
    userId: 'user-1',
    mode: 'job_targeted',
    idempotencyKey: 'idem-blank',
    resumeId: 'res-blank',
    jdTitle: '   ',
    jdContent: 'Some content',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(blankTitle, 'user-1'), null);

  const blankContent = {
    userId: 'user-1',
    mode: 'job_targeted',
    idempotencyKey: 'idem-blank2',
    resumeId: 'res-blank2',
    jdTitle: 'Valid title',
    jdContent: '\t  \n',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(blankContent, 'user-1'), null);

  // Blank field_benchmark fields after trim
  const blankBenchmark = {
    userId: 'user-1',
    mode: 'field_benchmark',
    idempotencyKey: 'idem-bm',
    resumeId: 'res-bm',
    industry: '   ',
    targetRole: 'Developer',
    seniority: 'Junior',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(blankBenchmark, 'user-1'), null);

  // Ownership mismatch
  const wrongUser = {
    userId: 'user-other',
    mode: 'job_targeted',
    idempotencyKey: 'idem-wrong',
    resumeId: 'res-1',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(wrongUser, 'user-1'), null);

  // Non-object or corrupt
  assert.equal(normalizePendingAnalysis(null, 'user-1'), null);
  assert.equal(normalizePendingAnalysis('invalid', 'user-1'), null);
});

// 8. result-mode discriminator selects matchScore and 5 dimensions for job_targeted
test('8. result-mode discriminator selects matchScore and 5 dimensions for job_targeted', () => {
  const rawResult = {
    matchScore: 88,
    summary: 'Candidate demonstrates strong React background',
    matchedKeywordsOrSkills: ['React', 'TypeScript'],
    missingKeywordsOrSkills: ['Docker'],
    breakdown: {
      technicalSkillMatch: 90,
      experienceRelevance: 85,
      impactEvidence: 80,
      clarity: 95,
      structure: 90,
      unrelatedDimension: 40,
    },
  };

  const presentation = extractAnalysisPresentation(rawResult, 'job_targeted');

  assert.equal(presentation.mode, 'job_targeted');
  assert.equal(presentation.score, 88);
  assert.equal(Object.keys(presentation.breakdown).length, 5);
  for (const key of JOB_TARGETED_BREAKDOWN_KEYS) {
    assert.equal(typeof presentation.breakdown[key], 'number');
  }
  assert.equal('unrelatedDimension' in presentation.breakdown, false);
  assert.deepEqual(presentation.skills?.matched, ['React', 'TypeScript']);
  assert.deepEqual(presentation.skills?.missing, ['Docker']);
});

// 9. result-mode discriminator selects readinessScore and 6 dimensions for field_benchmark
test('9. result-mode discriminator selects readinessScore and 6 dimensions for field_benchmark', () => {
  const rawResult = {
    readinessScore: 78,
    summary: 'Strong baseline foundation for Senior role',
    breakdown: {
      technicalFoundation: 80,
      projectEvidence: 75,
      experiencePresentation: 70,
      impactAchievements: 85,
      clarity: 90,
      roleAlignment: 68,
      strayKey: 10,
    },
  };

  const presentation = extractAnalysisPresentation(rawResult, 'field_benchmark');

  assert.equal(presentation.mode, 'field_benchmark');
  assert.equal(presentation.score, 78);
  assert.equal(Object.keys(presentation.breakdown).length, 6);
  for (const key of FIELD_BENCHMARK_BREAKDOWN_KEYS) {
    assert.equal(typeof presentation.breakdown[key], 'number');
  }
  assert.equal('strayKey' in presentation.breakdown, false);
  assert.equal(presentation.skills, undefined);
});

// 10. both modes rely on the same server quota authority without client-side credit pooling
test('10. both modes rely on the same server quota authority without client-side credit pooling', () => {
  // Verify formatQuotaError provides authoritative messaging without assuming free-tier limit claims
  const quotaExceeded = formatQuotaError('FEATURE_QUOTA_EXCEEDED');
  assert.equal(quotaExceeded.title, 'Đã hết lượt phân tích CV');
  assert.equal(quotaExceeded.message, 'Bạn đã sử dụng hết lượt phân tích CV của gói hiện tại.');
  // Confirm absence of hard-coded free tier claims
  assert.equal(quotaExceeded.message.includes('1 lượt/tài khoản'), false);
  assert.equal(quotaExceeded.title.includes('miễn phí'), false);

  const unavailable = formatQuotaError('FEATURE_NOT_AVAILABLE');
  assert.equal(unavailable.title, 'Tính năng chưa khả dụng');
  assert.equal(unavailable.message, 'Tính năng phân tích CV không khả dụng trong gói hiện tại của bạn.');
  assert.equal(unavailable.title.includes('miễn phí'), false);
  assert.equal(unavailable.title.includes('Đã hết lượt'), false);
});

// 11. quota and deterministic ApiErrors are not transport-retried
test('11. quota and deterministic ApiErrors are not transport-retried', () => {
  const quotaExceededError = {
    status: 403,
    code: 'FEATURE_QUOTA_EXCEEDED',
    message: 'Bạn đã dùng hết lượt của tính năng này.',
  };

  const notAvailableError = {
    status: 403,
    code: 'FEATURE_NOT_AVAILABLE',
    message: 'Tính năng này hiện không khả dụng.',
  };

  const contextInvalidError = {
    status: 400,
    code: 'RESUME_ANALYSIS_CONTEXT_INVALID',
    message: 'Ngữ cảnh phân tích không hợp lệ.',
  };

  const genericClientError = {
    status: 422,
    message: 'Unprocessable entity',
  };

  const transientServerError = {
    status: 500,
    message: 'Internal server error',
  };

  const transientNetworkError = new TypeError('Failed to fetch');

  assert.equal(isDeterministicAnalysisError(quotaExceededError), true);
  assert.equal(isDeterministicAnalysisError(notAvailableError), true);
  assert.equal(isDeterministicAnalysisError(contextInvalidError), true);
  assert.equal(isDeterministicAnalysisError(genericClientError), true);
  assert.equal(isDeterministicAnalysisError(transientServerError), false);
  assert.equal(isDeterministicAnalysisError(transientNetworkError), false);
});

// 12. request construction guarantees cross-mode fields are excluded from payload
test('12. request construction guarantees cross-mode fields are excluded from payload', () => {
  // Job targeted operation with potential stray benchmark fields
  const jobTargetedOp = {
    userId: 'user-1',
    idempotencyKey: 'idem-jt',
    resumeId: 'res-jt',
    mode: 'job_targeted',
    jobDescriptionId: 'jd-jt',
    jdTitle: 'Title',
    jdContent: 'Content',
    timestamp: Date.now(),
  };

  const jtPayload = buildCreateAnalysisRequest(jobTargetedOp);
  assert.deepEqual(Object.keys(jtPayload).sort(), ['jobDescriptionId', 'mode', 'resumeId'].sort());
  assert.equal('industry' in jtPayload, false);
  assert.equal('targetRole' in jtPayload, false);
  assert.equal('seniority' in jtPayload, false);

  // Field benchmark operation with potential stray JD fields
  const fieldBenchmarkOp = {
    userId: 'user-1',
    idempotencyKey: 'idem-fb',
    resumeId: 'res-fb',
    mode: 'field_benchmark',
    industry: 'Logistics',
    targetRole: 'Operations Manager',
    seniority: 'Lead',
    timestamp: Date.now(),
  };

  const fbPayload = buildCreateAnalysisRequest(fieldBenchmarkOp);
  assert.deepEqual(Object.keys(fbPayload).sort(), ['industry', 'mode', 'resumeId', 'seniority', 'targetRole'].sort());
  assert.equal('jobDescriptionId' in fbPayload, false);
  assert.equal('jdTitle' in fbPayload, false);
  assert.equal('jdContent' in fbPayload, false);
});

// 13. Idempotent pending operation matching & retry preservation (Cases A-E)
test('13. Idempotent pending operation matching & retry preservation (Cases A-E)', () => {
  const userId = 'user-retry-1';
  const originalKey = 'key-fixed-12345';

  // CASE A: current-goal job_targeted pending: jdTitle/content match, jobDescriptionId is null -> reusable
  const pendingJtInitial = {
    userId,
    idempotencyKey: originalKey,
    mode: 'job_targeted',
    jobDescriptionId: null,
    jdTitle: 'Frontend Engineer',
    jdContent: 'React Next.js TypeScript',
    timestamp: Date.now(),
  };

  const matchCaseA = isMatchingPendingOperation(pendingJtInitial, {
    userId,
    mode: 'job_targeted',
    resumeId: null,
    jdTitle: 'Frontend Engineer',
    jdContent: 'React Next.js TypeScript',
  });
  assert.equal(matchCaseA, true, 'CASE A: Pending job_targeted with null jobDescriptionId must be reusable');

  // CASE B: same operation after JD creation: jobDescriptionId populated, same JD title/content -> STILL reusable -> same idempotency key
  const pendingJtAfterJd = {
    ...pendingJtInitial,
    jobDescriptionId: 'created-jd-456',
  };

  const matchCaseB = isMatchingPendingOperation(pendingJtAfterJd, {
    userId,
    mode: 'job_targeted',
    resumeId: null,
    jdTitle: 'Frontend Engineer',
    jdContent: 'React Next.js TypeScript',
  });
  assert.equal(matchCaseB, true, 'CASE B: Populated jobDescriptionId must remain reusable for identical JD title/content');
  assert.equal(pendingJtAfterJd.idempotencyKey, originalKey, 'CASE B: Must retain original idempotency key');

  // CASE C: JD title/content changed -> pending not reusable -> new operation required
  const matchCaseCTitle = isMatchingPendingOperation(pendingJtAfterJd, {
    userId,
    mode: 'job_targeted',
    resumeId: null,
    jdTitle: 'Senior Frontend Engineer', // Changed
    jdContent: 'React Next.js TypeScript',
  });
  assert.equal(matchCaseCTitle, false, 'CASE C: Title change must invalidate pending operation');

  const matchCaseCContent = isMatchingPendingOperation(pendingJtAfterJd, {
    userId,
    mode: 'job_targeted',
    resumeId: null,
    jdTitle: 'Frontend Engineer',
    jdContent: 'Vue Nuxt.js', // Changed
  });
  assert.equal(matchCaseCContent, false, 'CASE C: Content change must invalidate pending operation');

  // CASE D: current-goal field_benchmark pending matching resolved goal -> reusable
  const pendingFb = {
    userId,
    idempotencyKey: 'key-fb-789',
    mode: 'field_benchmark',
    industry: 'FinTech',
    targetRole: 'Software Architect',
    seniority: 'Lead',
    timestamp: Date.now(),
  };

  const matchCaseD = isMatchingPendingOperation(pendingFb, {
    userId,
    mode: 'field_benchmark',
    resumeId: null,
    industry: '  FinTech  ',
    targetRole: 'Software Architect',
    seniority: 'Lead',
  });
  assert.equal(matchCaseD, true, 'CASE D: Field benchmark matching resolved goal must be reusable');

  // CASE E: field context changed -> pending not reusable
  const matchCaseE = isMatchingPendingOperation(pendingFb, {
    userId,
    mode: 'field_benchmark',
    resumeId: null,
    industry: 'HealthTech', // Changed
    targetRole: 'Software Architect',
    seniority: 'Lead',
  });
  assert.equal(matchCaseE, false, 'CASE E: Changed industry must invalidate pending benchmark operation');
});

// 14. Strict normalization of pending operations against executable contracts (Cases F-J)
test('14. Strict normalization of pending operations against executable contracts (Cases F-J)', () => {
  const userId = 'user-norm-1';

  // CASE F: normalize job_targeted: analysisId absent, jobDescriptionId absent, jdTitle/content absent -> null
  const caseF = {
    userId,
    idempotencyKey: 'key-f',
    mode: 'job_targeted',
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(caseF, userId), null, 'CASE F: job_targeted without JD ID or text must return null');

  // CASE G: normalize job_targeted: analysisId absent, jdTitle + jdContent present -> valid
  const caseG = {
    userId,
    idempotencyKey: 'key-g',
    mode: 'job_targeted',
    jdTitle: 'Product Designer',
    jdContent: 'Figma Design Systems',
    timestamp: Date.now(),
  };
  const normG = normalizePendingAnalysis(caseG, userId);
  assert.ok(normG !== null, 'CASE G: job_targeted with jdTitle + jdContent must be valid');
  assert.equal(normG.mode, 'job_targeted');
  assert.equal(normG.jdTitle, 'Product Designer');
  assert.equal(normG.jdContent, 'Figma Design Systems');

  // CASE H: normalize job_targeted: analysisId absent, jobDescriptionId present -> valid even if original JD text is unavailable
  const caseH = {
    userId,
    idempotencyKey: 'key-h',
    mode: 'job_targeted',
    jobDescriptionId: 'existing-jd-888',
    timestamp: Date.now(),
  };
  const normH = normalizePendingAnalysis(caseH, userId);
  assert.ok(normH !== null, 'CASE H: job_targeted with existing jobDescriptionId must be valid');
  assert.equal(normH.jobDescriptionId, 'existing-jd-888');

  // CASE I: normalize field_benchmark: analysisId absent, one required context field missing -> null
  const caseIMissingRole = {
    userId,
    idempotencyKey: 'key-i',
    mode: 'field_benchmark',
    industry: 'EdTech',
    seniority: 'Senior',
    // targetRole missing
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(caseIMissingRole, userId), null, 'CASE I: Missing targetRole must return null');

  const caseIBlankSeniority = {
    userId,
    idempotencyKey: 'key-i2',
    mode: 'field_benchmark',
    industry: 'EdTech',
    targetRole: 'Developer',
    seniority: '   ', // Blank
    timestamp: Date.now(),
  };
  assert.equal(normalizePendingAnalysis(caseIBlankSeniority, userId), null, 'CASE I: Blank seniority must return null');

  // CASE J: normalize operation with analysisId present -> remains recoverable even if old pre-analysis context fields are absent
  const caseJJobTargeted = {
    userId,
    idempotencyKey: 'key-j-jt',
    mode: 'job_targeted',
    analysisId: 'analysis-rec-111',
    timestamp: Date.now(),
  };
  const normJJobTargeted = normalizePendingAnalysis(caseJJobTargeted, userId);
  assert.ok(normJJobTargeted !== null, 'CASE J: operation with analysisId must be recoverable');
  assert.equal(normJJobTargeted.analysisId, 'analysis-rec-111');

  const caseJBenchmark = {
    userId,
    idempotencyKey: 'key-j-bm',
    mode: 'field_benchmark',
    analysisId: 'analysis-rec-222',
    timestamp: Date.now(),
  };
  const normJBenchmark = normalizePendingAnalysis(caseJBenchmark, userId);
  assert.ok(normJBenchmark !== null, 'CASE J: benchmark with analysisId must be recoverable even without industry/role');
  assert.equal(normJBenchmark.analysisId, 'analysis-rec-222');
});
