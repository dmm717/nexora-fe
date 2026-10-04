# Public account deletion — review handoff

## Scope and contracts

Based on `origin/main` at `98e32bfbd3aaaa0da331274592e24cb1fc3c39ee`, after PR #59 merged. Independent feature branch: `feat/public-account-deletion`. No backend edits, authentication/billing changes, merge or production deployment.

- `/account-deletion`: anonymous email request; explicit submit only; accessible validation and live feedback. All HTTP 202 responses show the same generic Vietnamese message, ignoring account-dependent response content.
- `/account-deletion/confirm`: explicit confirmation only. Missing, malformed, invalid/expired/replayed links offer a new email request. Reads the backend's `{ data: { id, status, requestedAt, completedAt } }` envelope and distinguishes queued, processing, completed and failed results.
- POST `/api/v1/account-deletion/external/request` with `{ email }`.
- POST `/api/v1/account-deletion/external/confirm` with `{ token }`.

Contracts inspected in the existing local `qbao0111/nexora-backend` checkout (`3ff0ecf`): `ExternalAccountDeletionController`, `PrivacyContracts`, `ExternalAccountDeletionService`, `ApiEnvelope` and `PrivacyService`. Backend invalid/expired/replayed tokens share `DELETION_VERIFICATION_INVALID`; the UI deliberately does not invent separate backend distinctions. Email link lifetime is 30 minutes, single use. It is not a deletion grace period.

## Security and UX

Dedicated typed fetch transport sends no Authorization header, omits cookies, uses no-referrer/no-store, disallows redirects and has a 20-second timeout. No auth refresh, session mutation or automatic POST retry. Connection failures, server errors and unreadable accepted confirmation envelopes are reported as uncertain: the server may already have accepted the request. Any further attempt requires another click.

Confirmation token stays only in the mounted component's memory. Native history replacement removes the URL query/hash immediately; Next router replacement also clears the old query from `history.state`. No token in visible text, storage, logs or telemetry. HTTP and metadata referrer protection and noindex apply to both routes. Confirmation rendering is dynamic and not cached. Development request logging excludes the confirmation route. Deployment access-log/query redaction remains an infrastructure dependency; an emailed query token necessarily reaches the initial frontend host request before JavaScript can remove it.

Stateless route policy avoids auth bootstrap on direct public entry. Shared official logo, public navigation frame, input/button primitives and ambient blue surfaces are reused. No auth-aware footer fetches on these routes. External Google icon font is excluded on deletion routes; existing Next font remains self-hosted. Existing Settings modal/service remain unchanged and are exercised with mocked destructive requests.

Public/legal footers link to deletion without adding a global menu item. Privacy and Terms still use backend Site Content. Contact navigation points to the published Privacy document instead of duplicating a disputed support address. JavaScript is required for POST interaction, with server-rendered guidance and contact navigation available without it. Reloading a scrubbed confirmation URL intentionally loses the token; users reopen the email link.

## Validation

- `npm ci`: passed; existing dependency audit reports 7 vulnerabilities (6 high, 1 critical). No unrelated dependency upgrades.
- `npm run lint`: passed, 0 errors and 192 warnings (existing warning volume; external icon-font warning moved from root layout to its route-aware component).
- `npx tsc --noEmit`: passed.
- `npm test`: 696/696 passed, including 10 new transport/policy tests.
- `npm run build`: passed, including static request and dynamic confirmation routes.
- Full Playwright run: 91/92 passed initially; the new no-JavaScript assertion exposed unreliable `<noscript>` visibility in this runtime. Added permanently visible server-rendered guidance; reran the complete 20-test account-deletion suite successfully. Other 72 existing tests passed in the full run.
- Browser inspected both public routes at 1440×900, 768×1024 and 390×844. No horizontal overflow or runtime error logs on confirmation; action buttons within the initial mobile viewport. Screenshots saved locally under ignored `.playwright-mcp/account-deletion/`. Mocked Playwright interactions verify generic acceptance, loading/duplicate protection, validation, rate/server/network errors, deliberate confirmation, token payload and history/storage/referrer protections, all four backend result states, no-JavaScript guidance, keyboard entry, mobile layout and existing Settings deletion/logout.

No real account deletion/email request was sent during validation. Development preview: `http://localhost:3000/account-deletion` and `http://localhost:3000/account-deletion/confirm` (without a token this shows the missing-link guidance).

## Configuration/content follow-up and Google Play

- Local backend development `Authentication:EmailVerification:PublicUrl` is `http://localhost:3000`; controller builds `/account-deletion/confirm?token=...` from that base. Production value was not inspected: verify `https://www.nexorainterview.io.vn` (base origin, not the full confirmation path), correct API base URL/CORS, email delivery and deletion worker configuration before release.
- Published Privacy document (25 September 2026) uses `nexorainterview@gmail.com`; current Site Settings contact uses `nexorainterview.vn@gmail.com`. Resolve this backend-owned content discrepancy separately. No published policy was replaced. Privacy does not yet explicitly describe the external email verification route; a content update should clarify that path and confirmed deletion/retention practices. Do not invent fixed retention periods.
- Query strings must be redacted in hosting/CDN/reverse-proxy observability and excluded from analytics/session replay, including initial document requests. Future global tracking integrations must preserve this route exclusion.
- After independent review and a separately authorized production release, verify the functional HTTPS public URL and email flow with a dedicated test account; enter `https://www.nexorainterview.io.vn/account-deletion` in Play Console's Data safety deletion URL field. Verify the mobile app also exposes its in-app account/data deletion option, that the store listing identity matches Nexora, and that the declared deletion/retention disclosures match backend behavior.
- Primary policy reference: [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111). This FE change supports the web path; it does not by itself certify Play compliance or publish the URL.

**PR CREATED — WAITING FOR INDEPENDENT REVIEW. DO NOT MERGE.**
