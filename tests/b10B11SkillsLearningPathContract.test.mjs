import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeSkillProfileResponse,
  normalizeSkillProfileCompetency,
  normalizeSkillProfileSource,
  normalizeSkillProfileWeaknessSignal,
} from '../src/services/skillProfileContract.ts';

import {
  LearningPathValues,
  normalizeLearningPathResponse,
  normalizeLearningPathMilestone,
  normalizeLearningPathActivity,
  normalizeLearningPathProgress,
  getActivityDeepLink,
} from '../src/services/learningPathContract.ts';

// ---------------------------------------------------------------------------
// B10 Skill Profile Contract Tests
// ---------------------------------------------------------------------------

test('B10.1: normalizes valid backend skill profile response with exact scores', () => {
  const raw = {
    competencies: [
      {
        code: 'DOTNET',
        name: '.NET Core & C#',
        category: 'Backend',
        score: 85,
        evidenceCount: 4,
        latestEvidenceAt: '2026-03-10T10:00:00Z',
        sources: [
          { sourceType: 'cv', evidenceCount: 1, latestEvidenceAt: '2026-03-01T00:00:00Z' },
          { sourceType: 'interview', evidenceCount: 3, latestEvidenceAt: '2026-03-10T10:00:00Z' },
        ],
      },
      {
        code: 'SYSTEM_DESIGN',
        name: 'System Design',
        category: 'Architecture',
        score: 72,
        evidenceCount: 2,
        latestEvidenceAt: '2026-03-09T14:30:00Z',
        sources: [
          { sourceType: 'scenario', evidenceCount: 2, latestEvidenceAt: '2026-03-09T14:30:00Z' },
        ],
      },
    ],
    weaknessSignals: [
      {
        sourceType: 'interview',
        label: 'Needs deeper knowledge of distributed caching strategies',
        latestEvidenceAt: '2026-03-10T10:30:00Z',
      },
    ],
  };

  const normalized = normalizeSkillProfileResponse(raw);

  assert.equal(normalized.competencies.length, 2);
  assert.equal(normalized.competencies[0].code, 'DOTNET');
  assert.equal(normalized.competencies[0].name, '.NET Core & C#');
  assert.equal(normalized.competencies[0].score, 85);
  assert.equal(normalized.competencies[0].sources.length, 2);
  assert.equal(normalized.competencies[0].sources[0].sourceType, 'cv');
  assert.equal(normalized.competencies[0].sources[0].evidenceCount, 1);

  assert.equal(normalized.weaknessSignals.length, 1);
  assert.equal(normalized.weaknessSignals[0].sourceType, 'interview');
  assert.equal(
    normalized.weaknessSignals[0].label,
    'Needs deeper knowledge of distributed caching strategies'
  );
});

test('B10.2: handles null or undefined root safely returning empty arrays', () => {
  const fromNull = normalizeSkillProfileResponse(null);
  assert.deepEqual(fromNull, { competencies: [], weaknessSignals: [] });

  const fromUndefined = normalizeSkillProfileResponse(undefined);
  assert.deepEqual(fromUndefined, { competencies: [], weaknessSignals: [] });

  const fromEmptyObj = normalizeSkillProfileResponse({});
  assert.deepEqual(fromEmptyObj, { competencies: [], weaknessSignals: [] });
});

test('B10.3: preserves 0-100 score scale without client-side modifications', () => {
  const rawComp = {
    code: 'REACT',
    name: 'React.js',
    category: 'Frontend',
    score: 95,
    evidenceCount: 5,
    latestEvidenceAt: '2026-03-11T00:00:00Z',
    sources: [],
  };

  const comp = normalizeSkillProfileCompetency(rawComp);
  assert.equal(comp.score, 95);

  const rawZeroComp = {
    code: 'DOCKER',
    score: 0,
    evidenceCount: 0,
  };
  const zeroComp = normalizeSkillProfileCompetency(rawZeroComp);
  assert.equal(zeroComp.score, 0);
});

test('B10.4: normalizes single competency with empty or missing sources', () => {
  const comp = normalizeSkillProfileCompetency({
    code: 'SQL',
    name: 'PostgreSQL',
    category: 'Database',
    score: 80,
    evidenceCount: 1,
    latestEvidenceAt: '2026-03-05T00:00:00Z',
  });

  assert.equal(comp.code, 'SQL');
  assert.equal(comp.name, 'PostgreSQL');
  assert.deepEqual(comp.sources, []);
});

test('B10.5: normalizes weakness signals with null safety', () => {
  const signal = normalizeSkillProfileWeaknessSignal({
    sourceType: 'star_drill',
    label: 'Situation lacks business context metrics',
    latestEvidenceAt: '2026-03-11T12:00:00Z',
  });

  assert.equal(signal.sourceType, 'star_drill');
  assert.equal(signal.label, 'Situation lacks business context metrics');

  const emptySignal = normalizeSkillProfileWeaknessSignal(null);
  assert.equal(emptySignal.sourceType, '');
  assert.equal(emptySignal.label, '');
  assert.equal(emptySignal.latestEvidenceAt, '');
});

test('B10.6: normalizes source entry with fallback defaults', () => {
  const source = normalizeSkillProfileSource({
    sourceType: 'cv',
    evidenceCount: 3,
    latestEvidenceAt: '2026-03-01T00:00:00Z',
  });
  assert.equal(source.sourceType, 'cv');
  assert.equal(source.evidenceCount, 3);
  assert.equal(source.latestEvidenceAt, '2026-03-01T00:00:00Z');

  const emptySource = normalizeSkillProfileSource(null);
  assert.equal(emptySource.sourceType, '');
  assert.equal(emptySource.evidenceCount, 0);
  assert.equal(emptySource.latestEvidenceAt, '');
});

test('B10.7: empty profile produces clean competencies: [] and weaknessSignals: []', () => {
  const rawEmpty = { competencies: [], weaknessSignals: [] };
  const normalized = normalizeSkillProfileResponse(rawEmpty);
  assert.equal(normalized.competencies.length, 0);
  assert.equal(normalized.weaknessSignals.length, 0);
});

// ---------------------------------------------------------------------------
// B11 Learning Path Contract Tests
// ---------------------------------------------------------------------------

test('B11.1: normalizes learning path response with progress, milestones, and activities', () => {
  const raw = {
    id: 'lp-123',
    careerGoalId: 'cg-456',
    status: 'active',
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-03-11T09:00:00Z',
    progress: {
      completedActivityCount: 2,
      totalActivityCount: 5,
      percentage: 40,
    },
    milestones: [
      {
        id: 'ms-1',
        code: 'critical_gaps',
        title: 'Critical Skill Gaps',
        order: 1,
        status: 'pending',
        activities: [
          {
            id: 'act-1',
            type: 'scenario',
            title: 'Handle high-concurrency API timeouts',
            description: 'Practice microservice resilience patterns.',
            competencyCode: 'SYSTEM_DESIGN',
            resourceId: 'scen-99',
            externalUrl: null,
            priority: 1,
            status: 'completed',
            order: 1,
            completedAt: '2026-03-11T08:30:00Z',
          },
          {
            id: 'act-2',
            type: 'star_drill',
            title: 'Describe a time you mitigated a production incident',
            description: 'Refine STAR answer structure.',
            competencyCode: 'PROBLEM_SOLVING',
            resourceId: null,
            externalUrl: null,
            priority: 2,
            status: 'pending',
            order: 2,
            completedAt: null,
          },
        ],
      },
    ],
  };

  const normalized = normalizeLearningPathResponse(raw);

  assert.equal(normalized.id, 'lp-123');
  assert.equal(normalized.careerGoalId, 'cg-456');
  assert.equal(normalized.status, 'active');
  assert.equal(normalized.progress.completedActivityCount, 2);
  assert.equal(normalized.progress.totalActivityCount, 5);
  assert.equal(normalized.progress.percentage, 40);

  assert.equal(normalized.milestones.length, 1);
  assert.equal(normalized.milestones[0].code, 'critical_gaps');
  assert.equal(normalized.milestones[0].activities.length, 2);
  assert.equal(normalized.milestones[0].activities[0].id, 'act-1');
  assert.equal(normalized.milestones[0].activities[0].status, 'completed');
  assert.equal(normalized.milestones[0].activities[1].status, 'pending');
});

test('B11.2: sorts milestones and activities by order property', () => {
  const raw = {
    milestones: [
      {
        id: 'ms-2',
        order: 2,
        title: 'Milestone 2',
        activities: [
          { id: 'act-2b', order: 2, title: 'Act 2B' },
          { id: 'act-2a', order: 1, title: 'Act 2A' },
        ],
      },
      {
        id: 'ms-1',
        order: 1,
        title: 'Milestone 1',
        activities: [
          { id: 'act-1b', order: 2, title: 'Act 1B' },
          { id: 'act-1a', order: 1, title: 'Act 1A' },
        ],
      },
    ],
  };

  const normalized = normalizeLearningPathResponse(raw);

  assert.equal(normalized.milestones[0].id, 'ms-1');
  assert.equal(normalized.milestones[1].id, 'ms-2');
  assert.equal(normalized.milestones[0].activities[0].id, 'act-1a');
  assert.equal(normalized.milestones[0].activities[1].id, 'act-1b');
  assert.equal(normalized.milestones[1].activities[0].id, 'act-2a');
  assert.equal(normalized.milestones[1].activities[1].id, 'act-2b');
});

test('B11.3: normalizes progress with clamped percentage between 0 and 100', () => {
  const p1 = normalizeLearningPathProgress({ completedActivityCount: 3, totalActivityCount: 4, percentage: 75 });
  assert.equal(p1.percentage, 75);

  const pOver = normalizeLearningPathProgress({ completedActivityCount: 5, totalActivityCount: 4, percentage: 125 });
  assert.equal(pOver.percentage, 100);

  const pUnder = normalizeLearningPathProgress({ completedActivityCount: 0, totalActivityCount: 4, percentage: -10 });
  assert.equal(pUnder.percentage, 0);

  const pEmpty = normalizeLearningPathProgress(null);
  assert.deepEqual(pEmpty, { completedActivityCount: 0, totalActivityCount: 0, percentage: 0 });
});

test('B11.4: normalizes individual activity with null-safe resourceId and externalUrl', () => {
  const act = normalizeLearningPathActivity({
    id: 'act-xyz',
    type: 'external_learning',
    title: 'Study CAP Theorem',
    description: 'Read the Martin Kleppmann chapter.',
    externalUrl: 'https://example.com/cap-theorem',
    priority: 1,
    status: 'pending',
    order: 3,
  });

  assert.equal(act.id, 'act-xyz');
  assert.equal(act.type, 'external_learning');
  assert.equal(act.resourceId, null);
  assert.equal(act.externalUrl, 'https://example.com/cap-theorem');
  assert.equal(act.completedAt, null);
});

test('B11.5: resolves deep link for scenario activity with resourceId', () => {
  const actWithRes = normalizeLearningPathActivity({
    id: '1',
    type: LearningPathValues.Scenario,
    resourceId: 'scen-42',
  });
  assert.equal(getActivityDeepLink(actWithRes), '/dashboard/scenarios/scen-42');

  const actWithoutRes = normalizeLearningPathActivity({
    id: '2',
    type: LearningPathValues.Scenario,
    resourceId: null,
  });
  assert.equal(getActivityDeepLink(actWithoutRes), '/dashboard/scenarios');
});

test('B11.6: resolves deep links for star_drill, interview, resume_improvement, and external_learning', () => {
  const starAct = normalizeLearningPathActivity({ id: '1', type: LearningPathValues.StarDrill });
  assert.equal(getActivityDeepLink(starAct), '/dashboard/star-builder');

  const interviewAct = normalizeLearningPathActivity({ id: '2', type: LearningPathValues.Interview });
  assert.equal(getActivityDeepLink(interviewAct), '/dashboard/interviews/new');

  const resumeAct = normalizeLearningPathActivity({ id: '3', type: LearningPathValues.ResumeImprovement });
  assert.equal(getActivityDeepLink(resumeAct), '/dashboard/resumes');

  const extAct = normalizeLearningPathActivity({
    id: '4',
    type: LearningPathValues.ExternalLearning,
    externalUrl: 'https://learn.microsoft.com/dotnet',
  });
  assert.equal(getActivityDeepLink(extAct), 'https://learn.microsoft.com/dotnet');

  const extEmpty = normalizeLearningPathActivity({
    id: '5',
    type: LearningPathValues.ExternalLearning,
    externalUrl: null,
  });
  assert.equal(getActivityDeepLink(extEmpty), null);
});

test('B11.7: handles unknown activity types gracefully in deep link resolver', () => {
  const unknownAct = normalizeLearningPathActivity({ id: '99', type: 'custom_hackathon' });
  assert.equal(getActivityDeepLink(unknownAct), null);
});

test('B11.8: activity status mapping preserves pending, completed, and obsolete', () => {
  const pendingAct = normalizeLearningPathActivity({ status: 'pending' });
  assert.equal(pendingAct.status, 'pending');

  const completedAct = normalizeLearningPathActivity({ status: 'completed' });
  assert.equal(completedAct.status, 'completed');

  const obsoleteAct = normalizeLearningPathActivity({ status: 'obsolete' });
  assert.equal(obsoleteAct.status, 'obsolete');
});

test('B11.9: LearningPathValues mirrors backend domain constants exactly', () => {
  assert.equal(LearningPathValues.Active, 'active');
  assert.equal(LearningPathValues.Pending, 'pending');
  assert.equal(LearningPathValues.Completed, 'completed');
  assert.equal(LearningPathValues.Obsolete, 'obsolete');
  assert.equal(LearningPathValues.Scenario, 'scenario');
  assert.equal(LearningPathValues.StarDrill, 'star_drill');
  assert.equal(LearningPathValues.Interview, 'interview');
  assert.equal(LearningPathValues.ResumeImprovement, 'resume_improvement');
  assert.equal(LearningPathValues.ExternalLearning, 'external_learning');
  assert.equal(LearningPathValues.CriticalMilestone, 'critical_gaps');
  assert.equal(LearningPathValues.DevelopingMilestone, 'developing_skills');
  assert.equal(LearningPathValues.SupportingMilestone, 'supporting_improvements');
});

