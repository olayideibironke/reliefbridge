# Capacity enforcement database acceptance plan

**Status:** Disposable PostgreSQL 16 CI fixtures and concurrency checks passed on 2026-11-03. Full-schema staging integration and human end-to-end acceptance remain pending. Never run these scenarios against customer records.

## Prerequisites
1. Apply staged migrations to an isolated test database, in order.
2. Confirm all existing profile and recovery-case authorization triggers remain installed.
3. Create isolated organizations A and B, with valid test survivors and staff.
4. Ensure enforcement is disabled by default for every organization.
5. Use two independent database sessions for concurrency tests.

## Required acceptance scenarios
| Scenario | Expected result |
| --- | --- |
| No capacity-policy row | Existing case and staff writes behave as before |
| Policy row with enforcement off | Writes remain unrestricted by capacity |
| Enable case limit without numeric cap | Configuration rejected |
| Enable staff limit without numeric cap | Configuration rejected |
| Case cap 1, no active cases | First case succeeds, second fails |
| Case cap 1, one closed case | New active case succeeds |
| Reopen closed case at cap | Reopening fails |
| Edit active case at cap | Edit succeeds |
| Close active case at cap | Closing succeeds |
| Transfer active case into organization at cap via authorized backend | Transfer rejected |
| Staff cap 1, no active profiles | First active staff succeeds, second fails |
| Activate pending staff at cap | Activation fails |
| Deactivate staff at cap | Deactivation succeeds |
| Transfer active staff into organization at cap via authorized backend | Transfer rejected |
| Two simultaneous active-case inserts with cap 1 | Exactly one succeeds |
| Two simultaneous staff activations with cap 1 | Exactly one succeeds |
| Existing organization with no approved limits | No newly introduced denial |

## Verification
- Confirm errors roll back the attempted insert or update.
- Confirm no case or profile is partially created or activated.
- Confirm no unrelated organization is blocked.
- Confirm RLS and existing authorization guards still reject unauthorized mutations.
- Inspect database logs for unexpected permission or deadlock errors.
- Leave all capacity enforcement flags disabled after testing.
- Do not merge or apply migrations to production until results are recorded and reviewed.

**Important:** GitHub Actions now runs the staged capacity migrations against disposable PostgreSQL 16 fixtures, including independent-session concurrency tests. These fixtures are intentionally minimal, so a passing CI run does **not** prove compatibility with every existing production trigger, RLS policy, or customer workflow. Full-schema staging and human acceptance remain required.
