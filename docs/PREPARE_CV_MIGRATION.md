# Prepare / CV Experience Migration Report

## 1. Verified Starting HEADs
- **Production FE starting HEAD**: `8fbeebd78064083e7a40c5e7ba0e4bb70817fc53` (Merge commit of PR #13, verified with ancestor check for Public/Auth Shell `3717cd6e45e027b3e742d3405fa2361cbf97cb72`).
- **Prototype Reference HEAD**: `46711620c8f184adcf3fab63b932823eade4a841`.
- **Backend Reference HEAD**: `f4e60b4e709ce34a552632a9957c2321121e5056`.
- **Target Branch**: `feat/prepare-cv`.

---

## 2. Route & Component Architecture Mapping

### Canonical CV Routes
| Route | Access | Purpose | Components & Foundation Primitives |
| :--- | :--- | :--- | :--- |
| `/resume-analyses` | Authenticated (RequireAuth) | CV Analysis Launch Hub, Context Selection, Mode Configuration & Analysis History | `ProductPageHero`, `Card`, `Badge`, `Button`, `ClientDate`, `ResumeUploadPanel`, `JobDescriptionPanel`, `FieldBenchmarkPanel`, `ResumeHistoryList` |
| `/resume-analyses/[id]` | Authenticated (RequireAuth) | Analysis Report View for an Immutable Analysis Snapshot | `ProductPageHero`, `RadialScore`, `Card`, `Badge`, `Button`, `ClientDate` |
| `/resumes` | Authenticated (RequireAuth) | CV Asset Management & Primary Resume Selection | `ProductPageHero`, `Card`, `Badge`, `Button`, `ClientDate` |
| `/cv-analysis` | Public / Marketing | Public overview & entry point for anonymous visitors | `Header`, `CvAnalysisHero`, `Footer` |

---

## 3. Upload & Analysis Coordinator Contracts

### A2 Presigned Upload & Creation
The upload flow follows the production backend contract:
1. `cvAnalysisApi.presignUpload`: Requests upload token and presigned S3/MinIO upload URL for valid MIME types (PDF: `application/pdf`, DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
2. `cvAnalysisApi.uploadFile`: Uploads file binary stream with expected size and content type headers directly to the presigned URL.
3. `cvAnalysisApi.createResume`: Sends the upload token to `POST /resumes` to create the resume entity.
4. **Ready-Only Existing Resume Selection**:
   - Only resumes with `status === 'ready'` can be selected for analysis.
   - Resumes in `processing`, `pending`, or `queued` state display status badge "Đang xử lý" and have their selection button disabled.
   - Resumes in `failed` state display status badge "Lỗi xử lý" and are disabled.
   - Client handler guards against any non-ready resume selection and rejects it with clear guidance.
5. **Resilient Retry & Token Replay**:
   - `completedUpload` ref retains the active PUT upload token in memory. If a network blip interrupts the `POST /resumes` call, retry reuses the existing token rather than re-uploading file bytes.
   - If an `UPLOAD_NOT_FOUND` or `UPLOAD_INTENT_INVALID` error is returned, the stale cache is discarded to request a fresh presign URL.

### Asynchronous Analysis Coordinator
1. `createResumeAnalysisOperation`: Instantiates an immutable operation object with a unique idempotency key.
2. `runResumeAnalysisOperation`: Dispatches `POST /resume-analyses` (or resume-specific endpoint) and coordinates polling until completion or failure.
3. **Indeterminate Progress & Truthful Asynchronous Recovery**:
   - Replaced fake progress percentages (`w-2/3` with pulse) and duration promises (e.g. "10-20 seconds, do not close browser") with an indeterminate loading animation (`animate-indeterminate`).
   - Copy accurately reflects asynchronous capabilities: "Quá trình đang được xử lý bất đồng bộ. Kết quả sẽ xuất hiện khi hoàn tất. Bạn có thể rời trang và quay lại xem kết quả sau."
4. **Recovery & Local Persistence**:
   - Active operation is persisted into `sessionStorage` via `useResumeAnalysisHistory`.
   - After successful Job Description creation, the persisted operation updates to include `jobDescriptionId`.
   - On transient failure or retry, `isMatchingPendingOperation` matches and reuses that exact saved operation and idempotency key, bypassing duplicate JD creation.
   - On page refresh or unmount/remount, in-flight operations are resumed automatically. If `analysisId` exists, recovery proceeds via `GET /resume-analyses/{id}`.
   - Invalid legacy pre-analysis records lacking executable context (missing JD ID/content or missing benchmark dimensions) are safely discarded (`normalizePendingAnalysis` returns `null`), allowing user to cleanly re-submit.

---

## 4. Mode Selection & Validation Truth

### Analysis Modes Supported
1. **Theo vị trí mục tiêu (`field_benchmark`)**:
   - Compares CV against standard market expectations across 6 axes.
   - Requires: `industry`, `targetRole`, `seniority`.
   - When using active career goal, defaults to `activeCareerGoal`. If `industry` is absent, an inline prompt allows quick selection or input before launch.
2. **Theo JD cụ thể (`job_targeted`)**:
   - Compares CV directly against a job description across 5 axes.
   - Requires BOTH `jdTitle` and `jdContent` to form a valid job description context matching backend contract (`POST /job-descriptions` requires `title` and `content`).
   - Both `jdTitle` and `jdContent` inputs are required in both custom mode and current-goal mode (`useCurrentGoal`).
   - Submission is disabled and displays validation feedback if either field is missing.
   - **Truthful Empty State**: The inputs start completely empty. No fake default JD text or title is populated.

### Inline Validation & Submit Guardrails
- Submit CTA button is disabled and displays clear guidance whenever:
  - Required fields are missing (e.g. `jdTitle` or `jdContent` for `job_targeted`; `industry`, `targetRole`, or `seniority` for `field_benchmark`).
  - CV file is not selected, still uploading, or not in `ready` status.
  - Analysis is currently in flight.
- File validation enforces PDF/DOCX MIME types and a 10MB size limit.

---

## 5. Career Goal Integration & Override Behavior
- **Default Behavior**: If the user has an active Career Goal and Primary Resume, the system offers one-click automated analysis using those credentials.
- **Custom Overrides**: Users can toggle to "Mục tiêu khác (Tuỳ chỉnh)" to upload a different resume or specify a custom target role, seniority, and industry.
- **Immutability Principle**: Custom overrides apply only to that specific analysis run and do not overwrite or mutate historical analysis snapshots or the global Career Goal unless explicitly requested.

---

## 6. Immutable Historical Snapshots & Results Presentation

### Snapshot Context
Each analysis record (`GET /resume-analyses`) preserves the exact context under which it was executed:
- `targetRole` & `seniority`
- `industry`
- `createdAt` formatted by `ClientDate` to prevent hydration mismatches
- `status` (`completed`, `failed`, or in-progress)

### Detail View (`/resume-analyses/[id]`)
- **RadialScore**:
  - `field_benchmark`: Displays `readinessScore` (0–100).
  - `job_targeted`: Displays `matchScore` (0–100).
  - Displays "Chưa đủ dữ liệu" if score data is null/insufficient.
- **Dimension Breakdown**:
  - `field_benchmark` (6 axes): `technicalFoundation`, `projectEvidence`, `experiencePresentation`, `impactAchievements`, `clarity`, `roleAlignment`.
  - `job_targeted` (5 axes): `technicalSkillMatch`, `experienceRelevance`, `impactEvidence`, `clarity`, `structure`.
- **Skills & Recommendations**:
  - Matched and missing skills are rendered directly from `matchedKeywordsOrSkills` and `missingKeywordsOrSkills`.
  - Strengths, gaps, recommendations, and section feedback are rendered strictly from server response arrays.
- **Next Best Action CTA**:
  - Truthful next step: Displays "Luyện tiếp với phỏng vấn AI" linking to `/interviews/new` as a generic forward path to select interview context and start practice.
  - Does NOT make unsupported claims about automatic interview question/scenario generation from CV analysis results until backend provides that capability.
- **Hydration Safety**:
  - `createdAt` is rendered via `ClientDate` (`<ClientDate date={data.createdAt} format="date" />`) to prevent server/client timezone and locale mismatches.

---

## 7. Quota & Entitlement UX Semantics
- **Authoritative Error Codes**: `FEATURE_QUOTA_EXCEEDED` and `FEATURE_NOT_AVAILABLE`.
- **Honest Copy**:
  - Does NOT assume free tier or claim "1 lượt/tài khoản".
  - Displays:
    - **Title**: "Đã hết lượt phân tích CV"
    - **Message**: "Bạn đã sử dụng hết lượt phân tích CV của gói hiện tại."
    - Request ID when provided by backend.
    - CTA linking to `/billing` for plan upgrade.

---

## 8. Prototype Items Intentionally NOT Ported
- `PrototypeContext` and simulated personas.
- Mock ATS scores (e.g. fabricated 85%).
- Fabricated default JD contents or dummy profile histories.
- Mock career progression networks.

---

## 9. Verification & Quality Gates
- **TypeScript Type Check**: `npx tsc --noEmit` -> **PASSED** (0 errors).
- **Lint Check**: Verified clean on all touched files.
- **Build Verification**: `npm run build` -> **PASSED**.
- **Git Diff Hygiene**: `git diff --check` -> **PASSED** (no trailing whitespace or conflict markers).
- **Responsive Testing**:
  - Desktop 1440px: Clean 2-column bento grids, balanced padding.
  - Tablet 820px: Responsive grid wrap, touch-friendly buttons.
  - Mobile 390px: Full-width stacked cards, minimum 44px touch targets, zero horizontal overflow.
- **Unmerged PR Guarantee**: PR remains strictly open and unmerged.
