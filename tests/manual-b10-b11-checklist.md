# Manual Verification Checklist: B10 Skill Profile & B11 Learning Path

This document outlines manual verification procedures for:
- **B10 — Skill Profile / Skill Gaps** (`/dashboard/skill-profile`)
- **B11 — Learning Path** (`/dashboard/learning-path`)

---

## 1. Prerequisites & Environment Setup
- [ ] Backend is running on `http://localhost:5000` (or staging backend).
- [ ] Frontend is running on `http://localhost:3000`.
- [ ] User is logged into the application.

---

## 2. B10: Skill Profile Verification (`/dashboard/skill-profile`)

### 2.1 Initial / Empty State
- [ ] Navigate to `/dashboard/skill-profile` via the top navigation ("Hồ sơ kỹ năng").
- [ ] If the user has no CV uploaded and no interview/STAR/scenario attempts:
  - [ ] Check that empty state message is shown: *"Chưa có đủ dữ liệu để đánh giá năng lực..."*.
  - [ ] Verify quick action buttons exist:
    - [ ] "Tải lên CV" links to `/dashboard/resumes`.
    - [ ] "Luyện STAR & Tình huống" links to `/dashboard/scenarios`.
    - [ ] "Bắt đầu phỏng vấn" links to `/dashboard/interviews/new`.
  - [ ] Verify "Xem lộ trình học →" header button links to `/dashboard/learning-path`.

### 2.2 Populated Profile State
- [ ] Complete at least one CV upload or interview/STAR practice.
- [ ] Return to `/dashboard/skill-profile`:
  - [ ] Competencies grid renders cards for each competency code (`DOTNET`, `SYSTEM_DESIGN`, etc.).
  - [ ] Score is displayed as an integer scale `score/100` (e.g. `85/100`).
  - [ ] Progress bar fill width corresponds accurately to `${score}%`.
  - [ ] Sources pills show each evidence source (`cv`, `interview`, `star_drill`, `scenario`) with evidence count.
  - [ ] Latest evidence date displays formatted date in `vi-VN` locale.
  - [ ] Weakness signals section lists identified gaps with source badges and descriptions.

### 2.3 Error & Resilience Handling
- [ ] Disconnect network or simulate 500 error on `GET /api/v1/skill-profile`.
- [ ] Verify error banner displays:
  - [ ] Error message.
  - [ ] Error code (if returned by backend API).
  - [ ] Request ID (if returned by backend API).
  - [ ] "Thử lại" button triggers re-fetch without full page reload.

---

## 3. B11: Learning Path Verification (`/dashboard/learning-path`)

### 3.1 Prerequisite: Active Career Goal Required
- [ ] If the user has no active career goal:
  - [ ] Navigate to `/dashboard/learning-path`.
  - [ ] Verify empty state informs user: *"Chưa thiết lập mục tiêu nghề nghiệp"*.
  - [ ] Verify CTA button "Thiết lập mục tiêu nghề nghiệp →" navigates to `/dashboard/career-goals`.

### 3.2 Uncreated Learning Path State (`LEARNING_PATH_NOT_FOUND` / 404)
- [ ] User has an active career goal, but has not generated a learning path yet:
  - [ ] Navigate to `/dashboard/learning-path`.
  - [ ] Verify card explains that a personalized path can be generated based on gaps.
  - [ ] Click "Tạo lộ trình học ngay":
    - [ ] Button disables with loading text "Đang tạo lộ trình...".
    - [ ] Synchronous `POST /api/v1/learning-path` call completes.
    - [ ] View automatically transitions to the populated learning path without manual refresh.

### 3.3 Populated Learning Path View
- [ ] Progress bar at the top displays:
  - [ ] "X / Y hoạt động (Z%)" with accurate fraction and percentage.
  - [ ] Gradient progress bar reflecting the exact percentage.
- [ ] Milestones appear in order (`order`):
  - [ ] Milestone 1: Critical Skill Gaps (`critical_gaps`).
  - [ ] Milestone 2: Developing Skills (`developing_skills`).
  - [ ] Milestone 3: Supporting Improvements (`supporting_improvements`).
- [ ] Activity cards within milestones:
  - [ ] Type badge renders distinct styling (Scenario = yellow, STAR = indigo, Interview = pink, Resume = green, External = slate).
  - [ ] Priority pill shows priority integer.
  - [ ] Activity title and description are rendered.
  - [ ] Competency code tag displays associated competency.

### 3.4 Deep Link Routing
- [ ] Click action link on a `scenario` activity -> Navigates to `/dashboard/scenarios/{resourceId}` or `/dashboard/scenarios`.
- [ ] Click action link on a `star_drill` activity -> Navigates to `/dashboard/star-builder`.
- [ ] Click action link on an `interview` activity -> Navigates to `/dashboard/interviews/new`.
- [ ] Click action link on a `resume_improvement` activity -> Navigates to `/dashboard/resumes`.
- [ ] Click action link on an `external_learning` activity -> Opens external URL in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).

### 3.5 Complete Activity
- [ ] On a pending activity, click "Đánh dấu xong":
  - [ ] Button enters pending state "Đang lưu...".
  - [ ] `PATCH /api/v1/learning-path/activities/{id}` is sent with `{ status: "completed" }`.
  - [ ] Activity card updates to completed style:
    - [ ] Card background dims slightly.
    - [ ] Title shows strikethrough.
    - [ ] Checkmark "✓ Đã hoàn thành" replaces action button.
  - [ ] Overall progress percentage and completed count immediately increase.
  - [ ] Skill Profile query cache is automatically invalidated.

### 3.6 Refresh Learning Path
- [ ] Click "Cập nhật lộ trình" in the header:
  - [ ] Button enters pending state "Đang đồng bộ...".
  - [ ] `POST /api/v1/learning-path/refresh` executes synchronously.
  - [ ] Fresh activities and reconciliations are reflected without page reload.

