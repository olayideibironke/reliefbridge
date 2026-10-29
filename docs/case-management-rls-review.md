# Case-management RLS review (read-only)

Reviewed 2026-10-29 against live PostgreSQL catalog metadata for ReliefBridge. This document records observed policies, not proof that every access scenario is safe. No user data was queried or changed.

| Table | RLS enabled | SELECT policies | INSERT / UPDATE / DELETE |
| --- | --- | --- | --- |
| `survivors` | Yes | Own organization or referred; assigned staff; platform admin | Own-organization insert/update; owner-only delete; managed demos excluded from mutations |
| `recovery_cases` | Yes | Own organization; assigned staff; platform admin | Own-organization insert/update; owner-only delete; managed demos excluded from mutations |
| `referrals` | Yes | Sender or receiver; assigned staff; platform admin | Sender insert with survivor ownership and receiving-organization checks; sender/receiver update; managed demos excluded from mutations |

## Important policy details

- Survivor visibility is **not limited to organization ownership**: a receiving organization may see referred survivors, and assigned staff can have access.
- Recovery-case visibility can include assigned staff and platform administrators.
- Referral visibility includes sender/receiver organizations and assigned staff.
- The `private.is_platform_admin()` policy controls privileged platform-wide SELECT access. Application page checks for platform manager/staff are not by themselves proof that the database authorizes that same scope.
- The `private.managed_demo_read_allowed()` and `private.is_managed_demo_user()` helpers appear in policies. Their implementations and test outcomes must be reviewed before new API routes.
- `UPDATE` policies have both `USING` and `WITH CHECK` predicates for the reviewed tables.
- The presence of RLS does **not** establish that all roles and relationships are correctly isolated. Negative tests are required.

## API implementation gate

Do not create externally callable case-management API routes until:
1. Helper function definitions and grants are reviewed for security-definer and search-path issues.
2. The intended permission matrix for organization owners/admins, ordinary staff, assigned staff, platform administrators, and managed demos is explicitly agreed.
3. Cross-organization and referral-linked access are tested with synthetic accounts and records.
4. Field-level response minimization, pagination, and error handling are specified.
5. New handlers use the authenticated user session and RLS, not service-role bypasses.

This review is documentation-only. It introduces no SQL changes, permissions, API endpoints, or dependencies.
