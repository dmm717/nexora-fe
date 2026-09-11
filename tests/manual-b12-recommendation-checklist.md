# Manual Verification Checklist: B12 Next Practice Recommendation

This document outlines manual verification procedures for:
- **B12 — Next Practice Recommendation** (`GET /api/v1/recommendations/next`)
- Card placements:
  - `/dashboard/learning-path`
  - `/dashboard`

---

## 1. Prerequisites & Environment Setup
- [ ] Backend is running on `http://localhost:5000` (or staging backend) with B12 merged on main.
- [ ] Frontend is running on `http://localhost:3000`.
- [ ] User is logged into the application.

---

## 2. B12 Next Practice Recommendation Verification

### 2.1 State: Active Career Goal Required (`ACTIVE_CAREER_GOAL_REQUIRED`)
- [ ] For a user account with no active career goals:
  - [ ] Navigate to `/dashboard`.
  - [ ] Verify the recommendation card displays: *"Chưa thiết lập mục tiêu nghề nghiệp"*.
  - [ ] Verify CTA button "Thiết lập mục tiêu nghề nghiệp →" navigates to `/dashboard/career-goals`.
  - [ ] Navigate to `/dashboard/learning-path`.
  - [ ] Verify identical clean CTA guidance is presented.

### 2.2 State: Learning Path Not Created (`LEARNING_PATH_NOT_FOUND` / 404)
- [ ] For a user account with an active career goal but no generated learning path:
  - [ ] Navigate to `/dashboard`.
  - [ ] Verify the recommendation card displays: *"Chưa tạo lộ trình học tập"*.
  - [ ] Verify CTA button "Đến Lộ trình học →" navigates to `/dashboard/learning-path`.

### 2.3 State: Populated Recommendation Available
- [ ] For a user account with an active career goal and generated learning path:
  - [ ] Navigate to `/dashboard/learning-path` or `/dashboard`.
  - [ ] Verify the recommendation card appears with header "Đề xuất luyện tập tiếp theo".
  - [ ] Verify backend-owned metadata:
    - [ ] Activity type badge (e.g. `Tình huống`, `STAR Drill`, `Phỏng vấn`, `Cải thiện CV`).
    - [ ] Priority pill: `Ưu tiên: X`.
    - [ ] Estimated duration: `⏱ ~Y phút` (e.g. `~20 phút` for scenario/interview, `~15 phút` for STAR).
    - [ ] Reason box displaying the exact backend-generated reason verbatim without client truncation.
  - [ ] Click the action button:
    - [ ] If `scenario` with `resourceId`: navigates to `/dashboard/scenarios/{resourceId}`.
    - [ ] If `scenario` without `resourceId`: falls back to `/dashboard/scenarios`.
    - [ ] If `star_drill`: navigates to `/dashboard/star-builder`.
    - [ ] If `interview`: navigates to `/dashboard/interviews/new`.
    - [ ] If `resume_improvement`: navigates to `/dashboard/resumes`.
    - [ ] If `external_learning`: does NOT render broken fake link; renders neutral guidance.

### 2.4 State: Null Recommendation (`data: null`)
- [ ] If all high-priority pending activities in the learning path have been completed:
  - [ ] Verify backend returns `data: null`.
  - [ ] Verify card renders neutral state: *"🎯 Hiện chưa có bài luyện tập tiếp theo được đề xuất."*.
  - [ ] Verify no fake or randomized recommendations are displayed.

### 2.5 Invalidation & Freshness
- [ ] On `/dashboard/learning-path`, complete a pending activity:
  - [ ] Mark activity as completed.
  - [ ] Verify the recommendation automatically re-fetches and updates to the next ranked activity or transitions to null state.
- [ ] On `/dashboard/career-goals`, update or switch active career goal:
  - [ ] Return to `/dashboard` or `/dashboard/learning-path`.
  - [ ] Verify recommendation query was invalidated and reflects the updated goal.

### 2.6 Error Resilience
- [ ] Disconnect network or simulate 500 error on `GET /api/v1/recommendations/next`:
  - [ ] Verify error card renders clean message.
  - [ ] Verify error code and request ID are shown if provided by API error response.
  - [ ] Click "Thử lại":
    - [ ] Verify query refetches without reloading the whole page.

