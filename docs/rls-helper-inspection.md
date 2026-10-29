# ReliefBridge RLS helper function inspection

Date: 2026-10-29. Source: live PostgreSQL catalog and `pg_get_functiondef`. Read-only review; no records, policies, grants, or functions were changed.

## Verified function behavior

| Private function | Security definer | Search path | Relevant behavior |
| --- | --- | --- | --- |
| `current_org_id()` | Yes | Empty | Resolves organization from the authenticated profile, checks profile not disabled and organization active |
| `is_platform_admin()` | Yes | Empty | Requires active profile in the platform organization with role owner/admin |
| `staff_has_work(type, id)` | Yes | Empty | Requires platform-staff predicate and active matching staff assignment |
| `is_managed_demo_user()` | Yes | `public, private` | Checks existence of demo workspace for authenticated user |
| `managed_demo_read_allowed()` | Yes | `public, private` | Checks active, unexpired demo access or normal active profile/organization |

These are RLS helper predicates, not partner API endpoints. They use `auth.uid()` rather than a caller-supplied user ID in the inspected definitions.

## Grants observed

- `anon` has **EXECUTE privilege** on `private.is_platform_admin()`, unlike the other inspected helpers, which are callable by `authenticated` but not `anon`.
- The function's body checks `auth.uid()` and an active platform owner/admin profile; an unauthenticated invocation would not satisfy that predicate.
- **Important:** SQL EXECUTE privilege does not by itself establish whether the `private` schema is exposed through PostgREST or whether the caller has schema USAGE. Review schema exposure and USAGE before judging exploitability.
- `is_managed_demo_user()` and `managed_demo_read_allowed()` use nonempty search paths. Their inspected table names are schema-qualified; nevertheless, future modifications should preserve explicit qualification.

## Follow-up checks before introducing API routes

1. Confirm `private` schema exposure and schema USAGE privileges.
2. Inspect `private.is_platform_staff()` and other helper dependencies for active-profile and assignment rules.
3. Run role-based negative tests with synthetic accounts, especially cross-tenant and demo scenarios.
4. Evaluate whether `anon` EXECUTE on `private.is_platform_admin()` is needed; do not revoke it without checking dependencies.
5. Keep future API handlers tied to authenticated sessions and database RLS; do not use a service-role bypass.

No vulnerability or unauthorized access is asserted from these catalog observations alone.
