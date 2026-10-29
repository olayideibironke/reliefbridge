# Case-management Data API grant audit

Verified 2026-10-29 with read-only queries against the live ReliefBridge PostgreSQL catalog.

| Public table | `anon` SELECT | `authenticated` SELECT | RLS |
| --- | --- | --- | --- |
| `survivors` | No | Yes | Enabled |
| `recovery_cases` | No | Yes | Enabled |
| `referrals` | No | Yes | Enabled |

The anonymous role cannot directly SELECT these tables under the observed grants. Authenticated SELECT remains subject to the documented RLS policies, including organization, referral, platform-admin, and assigned-staff paths.

A catalog search for public-schema functions with names containing `survivor`, `referral`, or `case` returned no rows. **This is not an exhaustive audit of public RPC wrappers**, which may use unrelated names.

PostgREST configuration settings with names matching `pgrst.%` were not visible through `pg_settings` in this connection. Therefore the configured exposed schemas have **not** been independently confirmed here. Check the project's Data API settings before publishing an API exposure conclusion.

## Still required

- Verify Data API exposed schemas in project configuration.
- Audit public RPCs and function grants comprehensively, not only by name.
- Run synthetic multi-organization, staff-assignment, referral, disabled-user and demo tests.
- Preserve least-privilege response fields and server-side pagination for future routes.

No changes to database roles, policies, grants, user data, API routes, or dependencies.
