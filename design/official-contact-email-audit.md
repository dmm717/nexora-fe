# Official contact email audit — 4 October 2026

Official product-owner-approved support address: `nexorainterview.vn@gmail.com`.

## Source change

Branch `fix/legal-official-contact-email`, based on `origin/main` at `053673a46fe23df05fc096cf7206e1ef8a6c4df1` (PR #60 already merged). Working tree was clean before branching. Static fallback lives in `src/config/contact.ts` and is reused by Footer, unavailable-policy support instructions and current Terms/Privacy draft templates. Footer still prioritizes the backend's `contactEmail`; this PR does not override settings or rewrite published legal content. Account deletion routes, token verification and authenticated deletion behavior are unchanged.

Searched all active `src` references for email addresses, `mailto:`, `contactEmail`, the legacy Gmail address and both legacy `support@nexora` domains. No outdated support contacts remain in active source. Example candidate emails in interview/CV illustrations are not support contacts and remain unchanged. Historical design reports describe past observations and are not active contact templates.

## Current backend-owned content (read-only inspection)

Anonymous GETs against the configured public API `https://nexora-backend-q32b.onrender.com/api/v1` and rendered `/privacy` and `/terms` confirmed:

| Source | Current contact | Last updated (UTC) |
| --- | --- | --- |
| `/public/site-settings`, `contactEmail` | `nexorainterview.vn@gmail.com` | 2026-10-04 12:56:37.644458 |
| `/public/pages/privacy`, published, section 9 “Thay đổi chính sách và liên hệ” | `nexorainterview.vn@gmail.com` | 2026-10-04 13:52:52.835691 |
| `/public/pages/terms`, published, section 10 “Thay đổi điều khoản và liên hệ” | `nexorainterview.vn@gmail.com` | 2026-10-04 13:53:04.278294 |

Both published Markdown bodies contain only the official email. No legal section currently references an outdated address in this inspected environment. Current policy contact instructions are plain text; their public footer exposes `mailto:nexorainterview.vn@gmail.com`. The unavailable-policy UI now also links to that official address. Account deletion's support navigation continues to point to the published Privacy page.

No backend writes, admin saves or policy publishes were performed. Changing these frontend templates cannot update another environment's already-published database documents.

## Exact administrator/content-owner edits, if another environment still has old copy

After review, inspect its Site Content admin screen and public GET responses. The inspected environment already has these values, so no email content update is needed there. For any stale environment:

1. Site Settings: set `contactEmail` to `nexorainterview.vn@gmail.com` without changing other settings.
2. Privacy, section 9: use exactly “Nếu có câu hỏi về dữ liệu cá nhân hoặc chính sách bảo mật, liên hệ nexorainterview.vn@gmail.com.”
3. Terms, section 10: use exactly “Nếu có câu hỏi về điều khoản dịch vụ, liên hệ nexorainterview.vn@gmail.com.”
4. Replace any remaining outdated support email in other contact instructions and explicit Markdown email links with `nexorainterview.vn@gmail.com`; use `mailto:nexorainterview.vn@gmail.com` for their destinations. Preserve all unrelated policy language, version metadata and account deletion instructions. Review and publish those backend-owned document edits separately; this source PR does not authorize or perform publication.
5. Verify the published pages, footer text and mailto destinations after the separate content action.

## Actual validation

- `npm run lint`: passed, 0 errors / 192 existing warnings.
- `npx tsc --noEmit`: passed.
- `npm test`: 698/698 passed, including new shared fallback/template consistency and active-source regression tests.
- `npm run build`: passed.
- Relevant Playwright: 42/42 passed (`official-contact`, `account-deletion`, `product-site-public`). New tests inspect every rendered mailto destination in Privacy/Terms fallback states with unavailable, empty, official and custom settings. Custom setting case proves backend values remain authoritative. All 20 account deletion regressions passed using mocked destructive interactions.
- Browser read-only inspection confirmed the published sections/contact destinations. No backend content was edited.

No merge or production deployment performed.
