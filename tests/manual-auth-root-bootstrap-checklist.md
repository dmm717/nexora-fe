# Manual Verification Checklist: Root Session Bootstrap & Auth Restoration

This document outlines manual verification procedures for root session bootstrap, auth restoration across full reloads, and route protection separation.

---

## A. Anonymous Landing
- [ ] Open fresh incognito browser window (clean cookies/cache).
- [ ] Navigate to root URL `/` (`http://localhost:3000/` or `https://nexora-fe-mu.vercel.app/`).
- [ ] **Verification**:
  - Landing page renders normally without full-page blocking spinners.
  - User is NOT redirected to `/auth`.
  - Header displays "Đăng nhập" and "Đăng ký" CTAs.
  - Network tab shows: `POST /api/v1/auth/refresh` was attempted with `credentials: include`.
  - Backend responds `401 Unauthorized` (no refresh cookie present).
  - UI remains safely in anonymous state without crashes or error banners.

---

## B. Authenticated Landing Full Reload
- [ ] Log in with valid credentials via `/auth`.
- [ ] Verify automatic navigation to `/dashboard`.
- [ ] Confirm in-memory access token is present and dashboard queries load.
- [ ] In browser address bar, manually type the landing page URL `/` and press Enter (full page reload).
- [ ] **Verification**:
  - Full reload clears in-memory `accessToken`.
  - Root `AuthBootstrapProvider` immediately triggers `POST /api/v1/auth/refresh` with `credentials: include`.
  - Backend validates HttpOnly cookie and responds `200 OK` with `{ data: { accessToken: "..." } }`.
  - Memory token is repopulated via `setAccessToken`.
  - Landing page renders without full-screen blocking.
  - Header renders authenticated CTA: "Vào Dashboard →" (linking to `/dashboard`).
  - No false "Đăng ký" / "Đăng nhập" flicker occurs during session initialization.

---

## C. Authenticated Dashboard Hard Reload
- [ ] While logged in on `/dashboard`, press Ctrl+F5 / Cmd+Shift+R (hard reload).
- [ ] **Verification**:
  - `RequireAuth` guard shows neutral spinner while `authReady` is false.
  - Root `AuthBootstrapProvider` fires `POST /api/v1/auth/refresh`.
  - Refresh succeeds with `200 OK`.
  - `authReady` becomes `true` and `isAuthenticated` becomes `true`.
  - Dashboard layout, stats, and realtime connection mount seamlessly.
  - User remains on `/dashboard` without being redirected to `/auth`.

---

## D. Anonymous Protected Route Access
- [ ] Open a new private window (unauthenticated).
- [ ] Directly enter protected URL: `/dashboard` or `/dashboard/scenarios`.
- [ ] **Verification**:
  - `RequireAuth` guard renders loading state while bootstrap runs.
  - Root `AuthBootstrapProvider` fires `POST /api/v1/auth/refresh` -> returns `401`.
  - Bootstrap completes with `authReady: true`, `isAuthenticated: false`, `bootstrapError: null`.
  - `RequireAuth` immediately executes `router.replace('/auth')`.
  - User lands on `/auth` login form.

---

## E. Transient / Network Refresh Failure
- [ ] Simulate network offline or backend downtime (e.g. block `/api/v1/auth/refresh` in DevTools Network Request Blocking).
- [ ] Perform full reload on `/`:
  - [ ] Landing page renders normally in anonymous mode.
  - [ ] No aggressive full-screen blocking error appears.
  - [ ] In-memory session is NOT destructively cleared as if permanently unauthenticated.
- [ ] Perform full reload on `/dashboard`:
  - [ ] `RequireAuth` guard displays recoverable error panel: *"Không thể khôi phục phiên đăng nhập"*.
  - [ ] Provides "Thử lại" button (triggers `window.location.reload()`) and "Đến trang đăng nhập" button.
  - [ ] Does NOT silently redirect to `/auth` as if authoritative 401.

---

## F. SPA Login & Logout Transitions (Reactive authStore Subscription)
- [ ] **SPA Login**:
  - [ ] Open incognito window and go to `/` (anonymous state: "Đăng nhập", "Đăng ký" shown).
  - [ ] Click "Đăng nhập" (client-side transition to `/auth`).
  - [ ] Fill credentials and click submit (`authApi.login()` returns access token).
  - [ ] `authApi.login()` calls `setAccessToken(token)`.
  - [ ] Root `AuthBootstrapProvider` reactively updates `isAuthenticated` to `true` via `subscribeAuthState`.
  - [ ] App navigates to `/dashboard`.
  - [ ] `RequireAuth` guard inspects `isAuthenticated === true` and grants immediate access without bouncing back to `/auth`.
  - [ ] Navigate back to `/` via client-side link: Header immediately renders "Vào Dashboard →" without full reload.
- [ ] **SPA Logout**:
  - [ ] From `/dashboard`, click user menu and select "Đăng xuất" (`authApi.logout()`).
  - [ ] `clearAccessToken()` notifies `subscribeAuthState` listeners; `isAuthenticated` updates immediately to `false`.
  - [ ] App navigates to `/auth`.
  - [ ] In browser, navigate back to `/`: Header renders "Đăng nhập" / "Đăng ký" without needing page refresh.
  - [ ] Attempting to navigate to `/dashboard` immediately triggers `RequireAuth` redirect to `/auth`.

---

## G. Security & Token Persistence Invariants
- [ ] Open browser DevTools -> Application -> Storage:
  - [ ] Inspect `localStorage`: Confirm ZERO entries for `accessToken`, `jwt`, or auth credentials.
  - [ ] Inspect `sessionStorage`: Confirm ZERO entries for `accessToken` or auth credentials.
  - [ ] Inspect `IndexedDB`: Confirm NO auth tokens stored.
  - [ ] Inspect Cookies: Confirm access token is NOT in client-readable document cookies. Refresh cookie remains `HttpOnly` and managed strictly by backend.
