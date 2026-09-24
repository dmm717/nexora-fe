import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import {
  CAREER_GOAL_SENIORITY_OPTIONS,
  formatSeniorityLabel,
  buildCreateCareerGoalRequest,
  buildUpdateCareerGoalRequest,
  reconcileCareerGoals,
} from '../src/services/careerGoalContract.ts';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('Requirement A: /career-profile contains canonical Career Goal management with DOM id="goals"', async () => {
  const screenSource = await readSource(
    '../src/components/features/career-profile/CareerProfileScreen.tsx'
  );
  assert.match(screenSource, /CareerGoalsSection/);

  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /id="goals"/);
  assert.match(sectionSource, /tabIndex=\{-1\}/);
  assert.match(sectionSource, /Mục tiêu nghề nghiệp/);
});

test('Requirement B & Q: /career-goals owns goal editor and legacy deep link redirects', async () => {
  await assert.doesNotReject(() =>
    access(
      new URL('../src/app/(dashboard)/career-goals/page.tsx', import.meta.url),
      constants.F_OK
    )
  );

  const routeSource = await readSource(
    '../src/app/(dashboard)/career-goals/page.tsx'
  );
  assert.match(routeSource, /<CareerGoalsPageContent \/>/);
  const legacySource = await readSource('../src/app/(dashboard)/career-profile/page.tsx');
  assert.match(legacySource, /section === 'goals' \? '\/career-goals' : '\/profile'/);
});

test('Requirement C: Old standalone CareerGoals component and stylesheet are deleted', async () => {
  await assert.rejects(() =>
    access(
      new URL(
        '../src/components/features/career-goals/CareerGoals.tsx',
        import.meta.url
      ),
      constants.F_OK
    )
  );
  await assert.rejects(() =>
    access(
      new URL(
        '../src/components/features/career-goals/CareerGoals.module.css',
        import.meta.url
      ),
      constants.F_OK
    )
  );
});

test('Requirement D: No primary product navigation target points to standalone /career-goals', async () => {
  const overviewSource = await readSource(
    '../src/app/(dashboard)/overview/page.tsx'
  );
  assert.doesNotMatch(overviewSource, /router\.push\(['"]\/career-goals['"]\)/);
  assert.match(overviewSource, /\/career-profile\?section=goals/);

  const lpSource = await readSource(
    '../src/components/features/learning-path/LearningPathView.tsx'
  );
  assert.doesNotMatch(lpSource, /router\.push\(['"]\/career-goals['"]\)/);
  assert.match(lpSource, /\/career-profile\?section=goals/);

  const recSource = await readSource(
    '../src/components/features/recommendations/NextPracticeRecommendationContent.tsx'
  );
  assert.doesNotMatch(recSource, /href=['"]\/career-goals['"]/);
  assert.match(recSource, /href=['"]\/career-profile\?section=goals['"]/);

  const nbaSource = await readSource('../src/services/nextBestAction.ts');
  assert.doesNotMatch(nbaSource, /destination:\s*['"]\/career-goals['"]/);
  assert.match(
    nbaSource,
    /destination:\s*['"]\/career-profile\?section=goals['"]/
  );
});

test('Requirement E: No-goal state can create a goal directly in Career Profile', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /Chưa có mục tiêu nghề nghiệp/);
  assert.match(sectionSource, /Tạo mục tiêu đầu tiên/);
  assert.match(sectionSource, /handleOpenCreateModal/);
  assert.match(sectionSource, /<EditCareerGoalModal/);
});

test('Requirement F & J: Create goal form and request builder support all 5 fields', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/EditCareerGoalModal.tsx'
  );
  assert.match(modalSource, /targetRole/);
  assert.match(modalSource, /seniority/);
  assert.match(modalSource, /industry/);
  assert.match(modalSource, /targetCompany/);
  assert.match(modalSource, /targetDate/);

  const request = buildCreateCareerGoalRequest({
    targetRole: 'Staff Platform Engineer',
    seniority: 'staff',
    industry: 'Cloud Infrastructure',
    targetCompany: 'Nexora Inc',
    targetDate: '2026-12-31',
  });

  assert.deepEqual(request, {
    targetRole: 'Staff Platform Engineer',
    seniority: 'staff',
    industry: 'Cloud Infrastructure',
    targetCompany: 'Nexora Inc',
    targetDate: '2026-12-31',
  });
});

test('Requirement G: Canonical seniority machine values remain intact', async () => {
  const expectedValues = [
    'intern',
    'entry',
    'junior',
    'mid',
    'senior',
    'lead',
    'staff',
    'principal',
    'manager',
    'director',
    'executive',
  ];

  const actualValues = CAREER_GOAL_SENIORITY_OPTIONS.map((opt) => opt.value);
  assert.deepEqual(actualValues, expectedValues);

  assert.equal(formatSeniorityLabel('staff'), 'Staff');
  assert.equal(formatSeniorityLabel('mid'), 'Chuyên viên (Mid-level)');
});

test('Requirement H: Active goal renders all 5 real values with truthful fallback copy', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /activeGoal\.targetRole/);
  assert.match(sectionSource, /activeGoal\.seniority/);
  assert.match(sectionSource, /activeGoal\.industry/);
  assert.match(sectionSource, /activeGoal\.targetCompany/);
  assert.match(sectionSource, /activeGoal\.targetDate/);
  assert.match(sectionSource, /Chưa cập nhật/);
  assert.match(sectionSource, /Đang kích hoạt/);
});

test('Requirement I: Inactive / other goals render separately and compactly', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /reconcileCareerGoals/);
  assert.match(sectionSource, /otherGoals\.length\s*>\s*0/);
  assert.match(sectionSource, /Mục tiêu khác/);
  assert.match(sectionSource, /Tạm dừng/);
  assert.match(sectionSource, /Kích hoạt lại/);
  assert.match(sectionSource, /Xóa/);
});

test('Requirement J: Partial update preserves unspecified and unchanged backend fields', () => {
  const currentGoal = {
    id: 'goal-1',
    targetRole: 'Junior Frontend Developer',
    seniority: 'junior',
    industry: 'EdTech',
    targetCompany: 'Old Company',
    targetJobDescriptionId: 'jd-999',
    targetDate: '2026-10-01T00:00:00Z',
    active: true,
  };

  const updateOnlyCompany = buildUpdateCareerGoalRequest(currentGoal, {
    targetRole: 'Junior Frontend Developer',
    seniority: 'junior',
    industry: 'EdTech',
    targetCompany: 'Nexora Corporation',
    targetDate: '2026-10-01',
  });

  assert.deepEqual(updateOnlyCompany, {
    targetCompanySpecified: true,
    targetCompany: 'Nexora Corporation',
  });

  // Unrelated fields are not marked specified or modified
  assert.equal('targetRoleSpecified' in updateOnlyCompany, false);
  assert.equal('senioritySpecified' in updateOnlyCompany, false);
  assert.equal('industrySpecified' in updateOnlyCompany, false);
  assert.equal('targetDateSpecified' in updateOnlyCompany, false);
  assert.equal('targetJobDescriptionIdSpecified' in updateOnlyCompany, false);
  assert.equal('activeSpecified' in updateOnlyCompany, false);
});

test('Requirement K & L: Archive and reactivate invoke production mutations with active specified', async () => {
  const queryHooksSource = await readSource(
    '../src/hooks/queries/useCareerGoals.ts'
  );
  assert.match(queryHooksSource, /useArchiveCareerGoal/);
  assert.match(queryHooksSource, /activeSpecified:\s*true,\s*active:\s*false/);
  assert.match(queryHooksSource, /useReactivateCareerGoal/);
  assert.match(queryHooksSource, /activeSpecified:\s*true,\s*active:\s*true/);

  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /archiveMutation\.mutateAsync/);
  assert.match(sectionSource, /reactivateMutation\.mutateAsync/);
});

test('Requirement M & N: Delete requires explicit custom modal confirmation (no window.confirm)', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.doesNotMatch(sectionSource, /window\.confirm/);
  assert.match(sectionSource, /<DeleteCareerGoalModal/);

  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteCareerGoalModal.tsx'
  );
  assert.doesNotMatch(modalSource, /window\.confirm/);
  assert.match(modalSource, /Xóa mục tiêu/);
  assert.match(modalSource, /goal\.targetRole/);
  assert.match(modalSource, /hành động này không thể hoàn tác/i);
  assert.match(modalSource, /deleteMutation\.mutateAsync\(goal\.id\)/);
  assert.match(modalSource, /disabled=\{isDeleting\}/);
});

test('Requirement O & P: Mutations invalidate both career goals and career profile queries to update header snapshot', async () => {
  const queryHooksSource = await readSource(
    '../src/hooks/queries/useCareerGoals.ts'
  );
  assert.match(queryHooksSource, /CAREER_GOALS_QUERY_KEY/);
  assert.match(queryHooksSource, /careerProfileKeys\.all/);

  const headerSource = await readSource(
    '../src/components/header/AuthenticatedHeader.tsx'
  );
  assert.match(headerSource, /useCareerProfile\(\)/);
  assert.match(headerSource, /activeGoal\s*=\s*careerProfile\?\.activeCareerGoal/);
  assert.match(headerSource, /targetRole\s*=\s*propTargetRole\s*!==\s*undefined\s*\?\s*propTargetRole\s*:\s*activeGoal\?\.targetRole/);
});

// ==================================================
// PR #24 CORRECTIVE TESTS (A - H)
// ==================================================

test('Corrective 6-A & 6-C: Career Profile active goal always wins over stale full-list active state and no duplicate appears in other goals', () => {
  const profileActiveGoal = {
    id: 'goal-B',
    targetRole: 'Staff Infrastructure Engineer',
    seniority: 'staff',
    industry: 'Cloud',
    targetCompany: 'Nexora Inc',
    targetDate: '2026-12-31',
    active: true,
  };

  const staleFullList = [
    {
      id: 'goal-A',
      targetRole: 'Junior Frontend Developer',
      seniority: 'junior',
      industry: 'EdTech',
      targetCompany: 'Old Company',
      targetJobDescriptionId: null,
      targetDate: '2026-06-01',
      active: true, // Stale cache claims A is active
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'goal-B',
      targetRole: 'Staff Infrastructure Engineer',
      seniority: 'staff',
      industry: 'Cloud',
      targetCompany: 'Nexora Inc',
      targetJobDescriptionId: null,
      targetDate: '2026-12-31',
      active: false, // Stale cache claims B is inactive
      createdAt: '2026-02-01',
      updatedAt: '2026-02-01',
    },
    {
      id: 'goal-C',
      targetRole: 'Product Manager',
      seniority: 'mid',
      industry: 'SaaS',
      targetCompany: 'Startup XYZ',
      targetJobDescriptionId: null,
      targetDate: '2027-01-01',
      active: false,
      createdAt: '2026-03-01',
      updatedAt: '2026-03-01',
    },
  ];

  const { activeGoal, otherGoals } = reconcileCareerGoals(
    profileActiveGoal,
    staleFullList
  );

  // Profile active goal B wins over stale full list active A
  assert.equal(activeGoal?.id, 'goal-B');
  assert.equal(activeGoal?.targetRole, 'Staff Infrastructure Engineer');

  // Stale active A does NOT override active B
  assert.notEqual(activeGoal?.id, 'goal-A');

  // No duplicate active goal B appears in "other goals"
  assert.equal(otherGoals.some((g) => g.id === 'goal-B'), false);

  // otherGoals contains A and C
  assert.equal(otherGoals.length, 2);
  assert.equal(otherGoals[0].id, 'goal-A');
  assert.equal(otherGoals[1].id, 'goal-C');
});

test('Corrective 6-B & Requirement R: Secondary list failure does not hide/replace canonical active goal B', async () => {
  const profileActiveGoal = {
    id: 'goal-B',
    targetRole: 'Staff Infrastructure Engineer',
    seniority: 'staff',
    active: true,
  };

  // Full-list query failed (returns empty array or error)
  const emptyList = [];
  const { activeGoal, otherGoals } = reconcileCareerGoals(
    profileActiveGoal,
    emptyList
  );

  // B remains visible as canonical active goal
  assert.equal(activeGoal?.id, 'goal-B');
  assert.equal(activeGoal?.targetRole, 'Staff Infrastructure Engineer');
  assert.deepEqual(otherGoals, []);

  const sectionSource = await readSource(
    '../src/components/features/career-profile/CareerGoalsSection.tsx'
  );
  assert.match(sectionSource, /reconcileCareerGoals/);
  assert.match(sectionSource, /isGoalsError/);
  assert.match(sectionSource, /Không thể làm mới danh sách mục tiêu đầy đủ/);
  assert.doesNotMatch(
    sectionSource,
    /activeFromGoals\s*\|\|\s*activeGoalFromProfile/
  );
});

test('Corrective 6-D: No full-page Suspense fallback={null} wraps CareerProfileScreen', async () => {
  const pageSource = await readSource(
    '../src/app/(dashboard)/career-profile/page.tsx'
  );
  assert.doesNotMatch(
    pageSource,
    /<Suspense[^>]*fallback=\{null\}[^>]*>\s*<CareerProfileScreen/
  );
  assert.match(pageSource, /redirect\(section === 'goals'/);

  const screenSource = await readSource(
    '../src/components/features/career-profile/CareerProfileScreen.tsx'
  );
  // Suspense is only wrapped around the isolated deep-link handler
  assert.match(
    screenSource,
    /<Suspense fallback=\{null\}>\s*<CareerProfileDeepLinkHandler\s*\/>\s*<\/Suspense>/
  );
});

test('Corrective 6-E: /career-profile?section=goals still focuses the goals section', async () => {
  const screenSource = await readSource(
    '../src/components/features/career-profile/CareerProfileScreen.tsx'
  );
  assert.match(screenSource, /CareerProfileDeepLinkHandler/);
  assert.match(screenSource, /section\s*===\s*['"]goals['"]/);
  assert.match(screenSource, /document\.getElementById\(['"]goals['"]\)/);
  assert.match(screenSource, /scrollIntoView/);
  assert.match(screenSource, /el\.focus/);
});

test('Corrective 6-F & 6-G: ActiveCareerGoalCard is deleted and tests do not source-read it', async () => {
  await assert.rejects(() =>
    access(
      new URL(
        '../src/components/features/career-profile/ActiveCareerGoalCard.tsx',
        import.meta.url
      ),
      constants.F_OK
    )
  );

  const paritySource = await readSource(
    '../tests/careerProfileParity.test.mjs'
  );
  assert.doesNotMatch(paritySource, /ActiveCareerGoalCard\.tsx/);
});

test('Corrective 6-H: Delete confirmation copy does not claim all related context is deleted', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteCareerGoalModal.tsx'
  );
  assert.match(
    modalSource,
    /Mục tiêu này sẽ không còn xuất hiện trong hồ sơ của bạn và hành động này không thể hoàn tác/
  );
  assert.doesNotMatch(
    modalSource,
    /Mọi dữ liệu bối cảnh liên quan đến mục tiêu này sẽ bị xóa khỏi hồ sơ của bạn/
  );
});
