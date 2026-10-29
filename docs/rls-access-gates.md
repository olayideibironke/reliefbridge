# Verified access gates for future case-management APIs

2026-10-29. Read-only database catalog inspection; no user records were queried and no database configuration was changed.

## Schema permissions and helper findings

| Check | Result |
| --- | --- |
| `private` schema USAGE for `anon` | **Denied** |
| `private` schema USAGE for `authenticated` | Allowed |
| `public` schema USAGE for `anon` | Allowed |
| `private.is_platform_admin()` EXECUTE for `anon` | Granted at function level, but `anon` lacks schema USAGE |
| `private.is_platform_admin()` body | Requires `auth.uid()` matching an active owner/admin profile in the platform organization |
| `private.is_platform_staff()` body | Requires `auth.uid()` matching active manager/staff profile in active platform organization |
| `private.staff_has_work(type,id)` body | Requires platform-staff predicate and an active assignment to that work item |

Function-level EXECUTE without schema USAGE does not alone allow direct SQL invocation through that role. This does not replace a review of PostgREST exposed schemas, RPC proxying, or application-level authorization.

## Permission matrix to test

| Identity | Survivor reads | Recovery case reads | Referral reads |
| --- | --- | --- | --- |
| Normal organization member | Own organization, plus referral-linked survivor records when permitted by RLS | Own organization | Sending or receiving organization |
| Assigned platform manager/staff | Assigned survivor records and cases connected to assignments | Assigned recovery cases | Assigned referrals or referrals tied to assigned cases |
| Platform owner/admin | Platform-wide SELECT via dedicated RLS policies | Platform-wide SELECT via dedicated RLS policies | Platform-wide SELECT via dedicated RLS policies |
| Managed demo | Only within active/unexpired demo and applicable SELECT policies | Same | Same |
| Unauthenticated | No direct private-schema USAGE | No direct private-schema USAGE | No direct private-schema USAGE |

This matrix describes the *observed policy intent*, not a completed role-by-role behavioral test. The application pages may additionally filter query results.

## Remaining release gate

Before any new API endpoint or public partner integration:
- Confirm the project's exposed Data API schemas and any public RPC wrappers.
- Use synthetic users from distinct organizations for negative tenant-isolation tests.
- Confirm behavior for disabled accounts, expired demos, revoked staff assignments, and receiving-organization referrals.
- Define minimal fields and enforce pagination; do not expose contact information by default.
- Avoid `service_role` for request-scoped data reads.
- Only after automated verification should an authorized human test the authenticated UI.

No application code, routes, grants, policies, migrations, or paid services are changed by this document.
