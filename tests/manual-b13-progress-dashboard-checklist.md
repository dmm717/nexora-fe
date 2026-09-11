# Manual Verification Checklist: B13 Progress Dashboard

This document outlines manual verification procedures for:
- **B13 — Progress Dashboard** (`GET /api/v1/progress/dashboard`)
- Primary page:
  - `/dashboard`

---

## 1. Prerequisites & Environment Setup
- [ ] Backend is running with B13 (`8ffbdca7` or later merged on main).
- [ ] Frontend is running (`npm run dev` or production build `npm run build && npm run start`).
- [ ] User authentication session is active.

---

## 2. B13 Progress Dashboard Verification

### 2.1 Unauthenticated State
- [ ] Visit `/dashboard` while signed out.
- [ ] Verify user is redirected to `/auth` or cleanly prompted without network loops.
- [ ] Verify no unauthenticated requests are dispatched to `/progress/dashboard`.

### 2.2 Entitlement Check (`FEATURE_NOT_AVAILABLE` / 403)
- [ ] For a user without `ProgressAnalytics` feature entitlement:
  - [ ] Navigate to `/dashboard`.
  - [ ] Verify warning banner appears: *"Tính năng phân tích tiến độ nâng cao chưa khả dụng cho gói hiện tại."*.
  - [ ] Verify CTA button "Nâng cấp gói ngay →" links to `/dashboard/billing`.
  - [ ] Verify standard non-gated dashboard features (e.g. interviews list, resume history) remain accessible without page crash.

### 2.3 Empty / New User State (Zero Data)
- [ ] For a newly registered user with 0 completed interviews/scenarios/assessments:
  - [ ] Navigate to `/dashboard`.
  - [ ] **Readiness Score**:
    - [ ] Displays neutral text *"Chưa đủ dữ liệu"* (does NOT display 0/100 as a misleading failing score).
    - [ ] Displays *"0 năng lực được đánh giá"* and *"0 dữ liệu minh chứng"*.
  - [ ] **Weekly Completed Activities (UTC)**:
    - [ ] Displays 0 total completed activities.
    - [ ] Individual counters for CV, Phỏng vấn, Tình huống, STAR, and Lộ trình all show 0.
  - [ ] **Weakest Competencies**:
    - [ ] Displays neutral notice: *"Chưa có dữ liệu đánh giá năng lực. Hãy hoàn thành các bài phỏng vấn hoặc bài tập tình huống để đo lường."*.
  - [ ] **Recent Improvements**:
    - [ ] Displays neutral notice: *"Chưa ghi nhận thay đổi điểm gần đây."*.
  - [ ] **Next Recommended Practice (B12 Card)**:
    - [ ] Renders appropriately based on goal/path presence without duplicate network requests.

### 2.4 Populated User State
- [ ] For a user with completed practice activities and evaluated competencies:
  - [ ] Navigate to `/dashboard`.
  - [ ] **Readiness Score**:
    - [ ] Score is rendered verbatim (e.g. `78/100`).
    - [ ] Displays evaluated competencies count (e.g. `5 năng lực`) and total evidence count (e.g. `14 minh chứng`).
    - [ ] Badges show priority gap count (`! X khoảng cách ưu tiên`) and qualitative weakness count.
    - [ ] Latest evidence timestamp is displayed in localized format.
  - [ ] **Weekly Completed Activities**:
    - [ ] Total completed card shows exact backend sum.
    - [ ] Sub-cards (CV, Phỏng vấn, Tình huống, STAR, Lộ trình) display exact backend counts.
    - [ ] Header clarifies activity window in UTC (`Tuần này (UTC)`).
  - [ ] **Weakest Competencies**:
    - [ ] Displays up to 3 weakest competencies in exact backend priority order.
    - [ ] Each competency item displays name, category pill, score/100, and evidence count.
    - [ ] Quick link "Xem toàn bộ hồ sơ năng lực →" links to `/dashboard/skill-profile`.
  - [ ] **Recent Improvements**:
    - [ ] Displays recent score deltas (e.g. `+15 điểm`) with previous and current scores.
    - [ ] If resource is an interview, link navigates to `/dashboard/interviews/{resourceId}/report`.
  - [ ] **Embedded Next Recommended Practice**:
    - [ ] Reuses embedded recommendation from B13 payload directly.
    - [ ] Verify browser network tab shows exactly 1 call to `/progress/dashboard` and NO separate call to `/recommendations/next` on initial dashboard load.

### 2.5 Cross-Flow Invalidation & Realtime Freshness
- [ ] **Learning Path Activity**:
  - [ ] Mark a learning path activity as completed on `/dashboard/learning-path`.
  - [ ] Return to `/dashboard`; verify `weeklyCompletedActivities` and readiness update automatically.
- [ ] **Career Goal Mutation**:
  - [ ] Create, update, or archive a career goal on `/dashboard/career-goals`.
  - [ ] Return to `/dashboard`; verify progress dashboard queries invalidate and refresh.
- [ ] **Practice Completion**:
  - [ ] Complete a scenario or interview session.
  - [ ] Return to `/dashboard`; verify historical stats and recent improvements reflect the completed session.

### 2.6 Read-Only Guarantees
- [ ] Inspect dashboard network traffic:
  - [ ] Verify only `GET` requests are made to `/api/v1/progress/dashboard`.
  - [ ] Confirm no client-side recalculation of readiness score, weekly sum, or weakest competency rank is performed.
