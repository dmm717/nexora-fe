# Admin portal

The Admin portal uses the dedicated `/(admin)` route group. Public URLs remain
`/admin`, `/admin/users`, `/admin/transactions`, `/admin/plans` and
`/admin/scenarios`, but these routes do not inherit the candidate
`DashboardLayout` or `AuthenticatedHeader`.

Access is guarded in order by `RequireAuth` and `RequireAdmin`; the backend
`Admin` policy remains authoritative. `/admin` consumes
`GET /api/v1/admin/dashboard`, while `/admin/transactions` consumes
`GET /api/v1/admin/transactions`. React Query keys include every effective
filter. Dashboard `granularity` and `currency` are reflected in the URL.

All metrics and charts use live backend responses. Revenue is displayed in
integer minor units using the response currency; different currencies are not
combined. Loading, empty, retry and access-denied states do not substitute mock
or randomly generated values.
