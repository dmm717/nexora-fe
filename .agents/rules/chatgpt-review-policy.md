# Frontend Review Policy & ChatGPT Review Role

This policy governs Antigravity-with-ChatGPT interactions for the `nexora-fe` repository.

## Evidence Priority
1. Current repository source
2. Current git diff / status
3. Current task instructions
4. Repository-specific rules and docs
5. Execution / test evidence
6. Project memory
7. Antigravity prose summaries

Repository reality always wins over stale Project memory.

## Review Roles
- **ChatGPT** owns: task planning (Iteration 0), architecture review, semantic review, API contract review, accessibility review, UX consistency review, local diff review, remote PR review, exact-HEAD merge approval.
- **Antigravity** owns: implementation, editor changes, terminal commands, browser testing, screenshots/evidence, build, lint, typecheck, tests, git commits/push, PR creation, hosted CI evidence collection, conditional merge when authorized.
- Antigravity must never self-certify completion.

## Core Frontend Review Principles
1. **Backend API is Source of Truth**: Treat backend contracts as authoritative. Never invent backend authorization, quota, or business state client-side.
2. **Explicit Error Handling**: API errors, network failures, and 4xx/5xx responses must be handled explicitly with appropriate user feedback.
3. **Deliberate UI States**: All asynchronous views must deliberately implement loading, error, and empty states.
4. **Accessibility & Usability**: Semantic HTML, ARIA standards, keyboard navigation, and focus management must remain usable and preserved.
5. **Responsive & Route Stability**: Maintain responsive layouts across mobile/desktop. Never silently break existing routes or components.
6. **Security & Secrets**: Never hardcode secrets, API keys, or credentials. Never log tokens or sensitive data to browser console or execution logs.
7. **Auth & Session Discipline**: Do not bypass authentication or session handling; route through established auth services (`apiClient`, `authSession`, `authStore`).
8. **Minimal Dependencies**: Avoid adding unnecessary external packages.
9. **Browser Verification**: Browser-visible UX changes require browser/DOM verification.
10. **Backend Contract Verification**: API contract changes must be checked against current backend evidence. Never guess future backend field names when evidence is unavailable.
