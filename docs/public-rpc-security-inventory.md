# Public RPC security inventory

Read-only inspection of live ReliefBridge PostgreSQL catalog, 2026-10-29. This is a privilege inventory, not a penetration test.

## Findings

- A complete query of public-schema ordinary functions returned **26 function overloads**. The majority are `SECURITY DEFINER` and executable by the authenticated role.
- The only public functions in this inventory with `anon` EXECUTE privileges were `set_demo_request_updated_at()` and `touch_demo_workspace_updated_at()`. Both were marked **not** security-definer. They appear to be trigger helpers; their trigger-only invocation semantics should be verified.
- `handle_reliefbridge_signup()`, `rls_auto_enable()`, `sync_demo_request_to_sales()`, and one older overload of `send_internal_message_multi()` were not executable by either `anon` or `authenticated`.
- The public `assign_staff_work(...)` function requires `private.is_platform_owner()` before writing assignments, checks staff role and target existence, and writes an audit entry.
- The public `seed_managed_demo_workspace(target_org)` function requires `public.is_reliefbridge_platform_admin()` and a matching managed demo workspace before inserting synthetic demonstration records. It was **inspected, not invoked**.
- `public.is_reliefbridge_platform_admin()` checks the caller's `auth.uid()`, platform organization, owner/admin role, and active profile.

## Security implications and next checks

1. A public `SECURITY DEFINER` RPC can bypass row-level security and must enforce authorization inside its own body. EXECUTE grants alone do not establish safety.
2. Review each authenticated-callable security-definer RPC for explicit caller authorization, input validation, safe `search_path`, and minimal returned data.
3. Verify whether the two anonymous-callable trigger helpers can be invoked directly and whether they have any side effects outside trigger context.
4. Confirm Data API exposed schemas in the project configuration. SQL `pg_settings` did not reveal `pgrst.%` settings in the current connection.
5. Run synthetic-account negative tests for staff assignments, demo creation, internal messaging, and audit-log reads before declaring role isolation validated.
6. Do not invoke privileged RPCs in production as a test or modify grants without dependency review.

No user records were read or changed. No database grants, policies, functions, application routes, or dependencies were modified.
