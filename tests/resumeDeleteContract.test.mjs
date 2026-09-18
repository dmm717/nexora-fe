import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('Requirement A: profileApi.deleteResume(id) calls DELETE /resumes/{id} with no expected body', async () => {
  const profileApiSource = await readSource('../src/services/profileApi.ts');
  assert.match(profileApiSource, /deleteResume:\s*async\s*\(\s*resumeId:\s*string\s*\)/);
  assert.match(profileApiSource, /apiClient\.delete\(`\/resumes\/\$\{resumeId\}`\)/);
  // Ensure it does not attempt to parse or expect a response body
  assert.doesNotMatch(profileApiSource, /deleteResume[\s\S]*?response\.data/);
});

test('Requirement B: useDeleteResume exists and calls canonical profileApi.deleteResume', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.match(queryHooksSource, /export\s+function\s+useDeleteResume\(\)/);
  assert.match(queryHooksSource, /profileApi\.deleteResume\(resumeId\)/);
});

test('Requirement C: Successful delete invalidates resumeKeys.all and careerProfileKeys.all', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.match(queryHooksSource, /invalidateQueries\(\{\s*queryKey:\s*resumeKeys\.all\s*\}\)/);
  assert.match(queryHooksSource, /invalidateQueries\(\{\s*queryKey:\s*careerProfileKeys\.all\s*\}\)/);
});

test('Requirement D: Career Profile ResumeManagementSection exposes a delete action for each resume', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  assert.match(sectionSource, /setResumeToDelete\(res\)/);
  assert.match(sectionSource, /aria-label=\{`Xóa CV \$\{res\.fileName \|\| 'CV Không tên'\}`\}/);
  assert.match(sectionSource, /<span className="material-symbols-outlined text-\[18px\]">delete<\/span>/);
});

test('Requirement E & F: Delete uses a custom Modal and strictly no window.confirm', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  assert.doesNotMatch(sectionSource, /window\.confirm/);
  assert.match(sectionSource, /<DeleteResumeModal/);

  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.doesNotMatch(modalSource, /window\.confirm/);
  assert.match(modalSource, /import\s+\{\s*Modal\s*\}\s+from\s+['"]@\/components\/ui\/Modal['"]/);
});

test('Requirement G: Modal displays the target Resume filename', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.match(modalSource, /title=\{`Xóa CV “\$\{fileName\}”\?`\}/);
  assert.match(modalSource, /const\s+fileName\s*=\s*resume\.fileName\s*\|\|\s*'CV Không tên'/);
});

test('Requirement H: Modal accurately states context removal and that historical analyses and interviews remain', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.match(
    modalSource,
    /CV này sẽ không còn xuất hiện trong hồ sơ hoặc được dùng làm bối cảnh cho các phân tích và phiên luyện tập mới\./
  );
  assert.match(
    modalSource,
    /Các phân tích và phiên phỏng vấn đã tạo trước đó vẫn được giữ lại trong lịch sử\./
  );
  // Must NOT claim everything is permanently deleted
  assert.doesNotMatch(modalSource, /Đã xóa vĩnh viễn mọi dữ liệu/);
});

test('Requirement I: Primary Resume warning is rendered when resume is primary', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.match(modalSource, /\{isPrimary\s*&&/);
  assert.match(modalSource, /Đây là CV chính hiện tại\./);
  assert.match(
    modalSource,
    /Sau khi xóa, Nexora sẽ bỏ chọn CV chính\. Bạn có thể chọn một CV khác sau\./
  );

  const sectionSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  assert.match(sectionSource, /isPrimary=\{resumeToDelete\?\.id === primaryResumeId\}/);
});

test('Requirement J: Deleting primary Resume does NOT first call setPrimaryResume(null)', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.doesNotMatch(modalSource, /setPrimaryResume/);
  assert.doesNotMatch(modalSource, /put\(['"]\/me\/primary-resume['"]/);
  // Modal confirms via owner-provided onConfirmDelete callback
  assert.match(modalSource, /onConfirmDelete\(resume\.id\)/);
});

test('Requirement K: Deleting non-primary Resume leaves primary semantics untouched in modal copy', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  // Primary warning is strictly conditional on isPrimary
  assert.match(modalSource, /\{isPrimary\s*&&\s*\(/);
});

test('Requirement L: Processing and non-ready Resumes may still be deleted', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  // The primary button checks !isReady, but the delete button does not
  assert.match(sectionSource, /disabled=\{isSettingPrimary\s*\|\|\s*isDeletingResume\s*\|\|\s*!isReady\}/);
  assert.doesNotMatch(
    sectionSource,
    /onClick=\{\(\) => setResumeToDelete\(res\)\}[^>]*disabled=\{[^}]*!isReady/
  );
});

test('Requirement M: Confirm button is disabled and shows loading state during mutation', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.match(modalSource, /loading=\{isDeleting\}/);
  assert.match(modalSource, /disabled=\{isDeleting\}/);
});

test('Requirement N: Cancel closes modal without sending delete request', async () => {
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );
  assert.match(modalSource, /onClick=\{handleClose\}/);
  assert.match(modalSource, /if\s*\(isDeleting\)\s*return;/);
});

test('Requirement O & P: Cache management removes resume on success and preserves it on failure', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.match(queryHooksSource, /onSuccess:\s*\(_,\s*resumeId\)\s*=>/);
  assert.match(queryHooksSource, /old\s*\?\s*old\.filter\(\(r\)\s*=>\s*r\.id\s*!==\s*resumeId\)\s*:\s*old/);

  // Unit verify cache filtering behavior
  const oldResumes = [
    { id: 'res-1', fileName: 'cv1.pdf' },
    { id: 'res-2', fileName: 'cv2.pdf' },
  ];
  const filterFn = (old, id) => (old ? old.filter((r) => r.id !== id) : old);
  assert.deepEqual(filterFn(oldResumes, 'res-1'), [{ id: 'res-2', fileName: 'cv2.pdf' }]);
});

test('Requirement Q & Corrective 2: Career Profile primaryResume becomes null and onboarding isComplete becomes false', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.match(queryHooksSource, /if\s*\(old\.primaryResume\?\.id\s*===\s*resumeId\)/);
  assert.match(queryHooksSource, /primaryResume:\s*null/);
  assert.match(queryHooksSource, /hasPrimaryResume:\s*false/);
  assert.match(queryHooksSource, /isComplete:\s*false/);

  // Unit verify profile primary clearing and onboarding consistency
  const oldProfile = {
    profile: { email: 'user@nexora.io', displayName: 'Jane Doe', yearsOfExperience: 3 },
    primaryResume: { id: 'res-1', fileName: 'cv1.pdf' },
    activeCareerGoal: { id: 'goal-1', targetRole: 'Frontend Engineer' },
    onboarding: {
      hasDisplayName: true,
      hasYearsOfExperience: true,
      hasPrimaryResume: true,
      hasActiveCareerGoal: true,
      isComplete: true,
    },
  };

  const updateProfile = (old, resumeId) => {
    if (!old) return old;
    if (old.primaryResume?.id === resumeId) {
      return {
        ...old,
        primaryResume: null,
        onboarding: old.onboarding
          ? {
              ...old.onboarding,
              hasPrimaryResume: false,
              isComplete: false,
            }
          : old.onboarding,
      };
    }
    return old;
  };

  // 1. Deleting primary resume: primaryResume is null, hasPrimaryResume is false, isComplete is false
  const cleared = updateProfile(oldProfile, 'res-1');
  assert.equal(cleared.primaryResume, null);
  assert.equal(cleared.onboarding.hasPrimaryResume, false);
  assert.equal(cleared.onboarding.isComplete, false);

  // 2. Deleting non-primary resume: leaves primaryResume and onboarding completion intact
  const untouched = updateProfile(oldProfile, 'res-999');
  assert.deepEqual(untouched, oldProfile);
  assert.equal(untouched.primaryResume?.id, 'res-1');
  assert.equal(untouched.onboarding.hasPrimaryResume, true);
  assert.equal(untouched.onboarding.isComplete, true);
});

test('Corrective 1: One authoritative useDeleteResume mutation instance owned by ResumeManagementSection', async () => {
  const sectionSource = await readSource(
    '../src/components/features/career-profile/ResumeManagementSection.tsx'
  );
  const modalSource = await readSource(
    '../src/components/features/career-profile/DeleteResumeModal.tsx'
  );

  // 1. Owning component creates the delete mutation instance
  assert.match(sectionSource, /const\s+deleteResumeMutation\s*=\s*useDeleteResume\(\);/);
  assert.match(sectionSource, /const\s+isDeletingResume\s*=\s*deleteResumeMutation\.isPending;/);
  assert.match(sectionSource, /const\s+deletingResumeId\s*=\s*deleteResumeMutation\.variables;/);

  // 2. DeleteResumeModal must NOT create another useDeleteResume() instance
  assert.doesNotMatch(modalSource, /useDeleteResume/);

  // 3. Section passes its exact mutation execution and state to the modal
  assert.match(sectionSource, /isDeleting=\{isDeletingResume\}/);
  assert.match(sectionSource, /onConfirmDelete=\{\(resumeId\)\s*=>\s*deleteResumeMutation\.mutateAsync\(resumeId\)\}/);

  // 4. Modal confirms using the provided onConfirmDelete callback
  assert.match(modalSource, /onConfirmDelete:\s*\(resumeId:\s*string\)\s*=>\s*Promise<void>;/);
  assert.match(modalSource, /await\s+onConfirmDelete\(resume\.id\);/);

  // 5. Primary controls are visibly and functionally disabled during deletion
  assert.match(sectionSource, /disabled=\{isSettingPrimary\s*\|\|\s*isDeletingResume\s*\|\|\s*!isReady\}/);
  assert.match(sectionSource, /disabled=\{isSettingPrimary\s*\|\|\s*isDeletingResume\}/);
});

test('Requirement R: Shared resume query invalidation keeps other surfaces in sync without duplicate sync logic', async () => {
  const interviewsNewSource = await readSource(
    '../src/app/(dashboard)/interviews/new/page.tsx'
  );
  assert.match(interviewsNewSource, /useResumes\(\)/);

  const analysesSource = await readSource(
    '../src/app/(dashboard)/resume-analyses/page.tsx'
  );
  assert.match(analysesSource, /useResumes\(\)/);

  const legacyResumesSource = await readSource(
    '../src/app/(dashboard)/resumes/page.tsx'
  );
  assert.match(legacyResumesSource, /useResumes\(\)/);
});

test('Requirement S: Historical Resume Analysis history is preserved and not cleared upon delete', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.doesNotMatch(queryHooksSource, /resumeAnalysisHistory/);
  assert.doesNotMatch(queryHooksSource, /cvAnalysisHistory/);
});

test('Requirement T: Account Settings receives no new Resume delete controls', async () => {
  const accountSource = await readSource(
    '../src/app/(dashboard)/account/page.tsx'
  );
  assert.doesNotMatch(accountSource, /useDeleteResume/);
  assert.doesNotMatch(accountSource, /DeleteResumeModal/);
  assert.doesNotMatch(accountSource, /deleteResume/);
});
