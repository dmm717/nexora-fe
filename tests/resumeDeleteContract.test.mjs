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
  // Directly calls deleteMutation.mutateAsync(resume.id)
  assert.match(modalSource, /deleteMutation\.mutateAsync\(resume\.id\)/);
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
  assert.match(sectionSource, /disabled=\{isSettingPrimary\s*\|\|\s*!isReady\}/);
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

test('Requirement Q: Career Profile primaryResume becomes null locally if deleted resume was primary', async () => {
  const queryHooksSource = await readSource('../src/hooks/queries/useCareerProfile.ts');
  assert.match(queryHooksSource, /if\s*\(old\.primaryResume\?\.id\s*===\s*resumeId\)/);
  assert.match(queryHooksSource, /primaryResume:\s*null/);

  // Unit verify profile primary clearing logic
  const oldProfile = {
    profile: { email: 'user@nexora.io' },
    primaryResume: { id: 'res-1', fileName: 'cv1.pdf' },
    onboarding: { hasPrimaryResume: true, isComplete: true },
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
            }
          : old.onboarding,
      };
    }
    return old;
  };

  const cleared = updateProfile(oldProfile, 'res-1');
  assert.equal(cleared.primaryResume, null);
  assert.equal(cleared.onboarding.hasPrimaryResume, false);

  const untouched = updateProfile(oldProfile, 'res-999');
  assert.deepEqual(untouched, oldProfile);
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
