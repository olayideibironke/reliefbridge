# Premium packages release evidence register

**Release status: BLOCKED.** This register is a template for actual test evidence, not a claim that staging or production validation has occurred. Do not mark a gate PASS without its supporting artifact and reviewer.

| Gate | Current status | Required evidence |
| --- | --- | --- |
| GitHub CI: validate, postgres-preflight, postgres-capacity, postgres-quote | PASS at commit `6611135365ccf51d94f4136042eb8c1b3a42c3de` | [CI run #135](https://github.com/olayideibironke/reliefbridge/actions/runs/42143967022), all four required jobs succeeded; refresh after every new commit |
| Disposable PostgreSQL preflight, case/staff and quote integration | PASS at above commit | CI run #135, three PostgreSQL jobs; disposable fixtures only |
| Read-only production RLS and schema review | REVIEWED (2026-11-03) | `QUOTE_SECURITY_RELEASE_REVIEW.md`; repeat against current schema before release |
| Production service-role table permissions (read-only review, 2026-11-05) | **BLOCKED: service_role lacks INSERT and SELECT on public.demo_requests** | Effective `has_table_privilege` results and role grants verified read-only; stage a narrowly scoped grant fix and verify before any cutover |
| Full-schema staging migration rehearsal | NOT RUN | Staging project ID, migration logs, preflight schema comparison |
| Original sales-sync trigger/function snapshot | NOT CAPTURED FOR RELEASE | Restricted rollback artifact and review sign-off |
| Staging rollback and restore rehearsal | NOT RUN | Restore transcript, validation results, owner |
| Real anonymous quote/demo E2E | NOT RUN | Redacted synthetic intake, opportunity and activity evidence |
| Staging before/after sales-integrity audit | NOT RUN | `quote_pipeline_staging_audit_readonly.sql` outputs, baseline comparison |
| Staging capacity opt-in, transfers and concurrency | NOT RUN | Test log showing disabled default, case/staff race safety |
| Stripe Standard grandfathering smoke test | NOT RUN | Verified subscription and unchanged entitlement outcomes |
| Browser/mobile/keyboard/screen-reader QA | NOT RUN | Browser versions, redacted screenshots and findings |
| Edge abuse controls and operational monitoring | NOT VERIFIED | Rate-limit design, monitoring ownership, failure handling |
| Explicit production release approval | NOT GRANTED | Written approval naming exact commit and rollout scope |

## Live schema finding, November 5 (read-only)

A read-only query against ReliefBridge Supabase project `hknfbkbqfcombsblrnnu` confirmed RLS is enabled on `demo_requests`, `sales_opportunities`, and `sales_activities`. On `public.demo_requests`, `anon` and `authenticated` both currently have effective INSERT, while `service_role` has **neither INSERT nor SELECT**. The underlying role grants also lack those two privileges for `service_role`. This is a concrete compatibility blocker for the staged server-only intake client, which inserts with the service-role key and requests the inserted row in its response. Rehearse a narrowly scoped service-role privilege correction in schema-equivalent staging and validate both demo and quote end-to-end before revoking browser INSERT. Do not change production grants without a separate approved rollout. No SQL writes were performed during this review.

## Evidence rules

1. Use synthetic staging contacts and organizations. Never copy survivor or customer PII into evidence.
2. Record the exact Git SHA, workflow run URL, environment identifier, tester, UTC timestamp and result for every executed check.
3. Mark a gate **FAIL** if its required check fails; **BLOCKED** if it cannot be performed. Do not convert either into PASS by assumption.
4. Treat the current CI evidence as a point-in-time result. Every new commit requires its own green run before it is a release candidate.
5. Do not deploy, merge into production, apply production migrations, or enable numeric capacity enforcement based on this document.
6. Before requesting production approval, complete every applicable gate and attach a reviewer-signed go/no-go record.

## November 5 staged intake boundary

A shared server-only intake module, staged browser-role INSERT lockdown, and staged atomic database volume guard have been committed for validation. These controls are **NOT deployed or approved for production**. The quota guard currently uses a serialized global 120/hour backstop, 3/hour per normalized email, and 10/hour per normalized organization; thresholds and false-positive behavior need staging load review. The global backstop can be exhausted by an attacker, so edge-level mitigation and monitoring remain release requirements. Confirm service-role environment configuration without exposing credentials, run full-schema staging, validate concurrent submissions and rollback, and review legitimate insert callers before release. Do not treat disposable PostgreSQL CI as staging approval.

### CI evidence, November 5

GitHub Actions [run #135](https://github.com/olayideibironke/reliefbridge/actions/runs/42143967022) completed successfully at commit `6611135365ccf51d94f4136042eb8c1b3a42c3de`. All four jobs passed: `validate`, `postgres-preflight`, `postgres-capacity`, and `postgres-quote`. The latest checks include the staged browser-role INSERT lockdown, rolling website intake quotas, concurrency regressions, and mutation tests that reject unsafe permission changes.

**Evidence boundary:** these results come from isolated GitHub Actions runners and disposable PostgreSQL fixtures. They do not establish schema-equivalent staging compatibility, a tested rollback, real application E2E success, edge abuse mitigation, or production readiness. Every later code commit requires a fresh green run before a release candidate can be identified. Production approval remains **BLOCKED**.
