# Privileged RPC authorization review, phase 2

Read-only inspection of live function definitions on 2026-10-29. No RPC was invoked, no records were queried, and no database writes occurred.

## Verified authorization gates

| Function | Observed authorization and scope |
| --- | --- |
| `get_platform_audit_log()` | `private.is_platform_admin()` required; returns latest 100 audit rows |
| `get_platform_audit_count()` | `private.is_platform_admin()` required; returns audit row count |
| `get_assignable_staff_work()` | `private.is_platform_owner()` required; excludes managed demo organizations and limits to 400 work items |
| `get_my_work_assignments()` | Filters to `auth.uid()`, active assignments, and `private.is_platform_staff()` |
| `get_my_demo_access()` | Filters demo workspace by `auth.uid()`; reports expired status |
| `get_my_organization_access()` | Filters profile by `auth.uid()` and reports organization's active status |
| `touch_my_demo_access()` | Updates only the caller's active, unexpired demo workspace |
| `touch_my_platform_access()` | Delegates to `private.touch_platform_access()`; updates only active platform staff/owner/admin caller's profile timestamps |

## Remaining limitations

- This is source inspection, **not** an end-to-end authorization test. A security-definer function's effective permissions depend on the complete call chain and its owner.
- `get_assignable_staff_work()` returns survivor names in labels to privileged platform owners. Verify data-minimization requirements before making these results available elsewhere.
- Audit log `details` is JSON and could contain sensitive information. Keep this function administrator-only.
- Confirm that `private.is_platform_owner()` checks active organization status and does not rely on user-editable metadata.
- Continue inspection of internal messaging RPCs and their helper functions.
- Perform negative role tests using synthetic identities before any new API exposure.

No grants, functions, migrations, policies, application code, or dependencies were modified.
