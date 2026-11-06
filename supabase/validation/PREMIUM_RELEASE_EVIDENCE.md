# Premium packages release evidence register

**Release status: BLOCKED.** This register is a template for actual test evidence, not a claim that staging or production validation has occurred. Do not mark a gate PASS without its supporting artifact and reviewer.

| Gate | Current status | Required evidence |
| --- | --- | --- |
| GitHub CI: validate, postgres-capacity, postgres-quote | PASS at commit `f2eb19264223b932d136804c727a313dc25a10b5` | [CI run 41892394866](https://github.com/olayideibironke/reliefbridge/actions/runs/41892394866); refresh for the release candidate commit |
| Disposable PostgreSQL case/staff and quote integration | PASS at above commit | Same CI run, both PostgreSQL jobs |
| Read-only production RLS and schema review | REVIEWED (2026-11-03) | `QUOTE_SECURITY_RELEASE_REVIEW.md`; repeat against current schema before release |
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

## Evidence rules

1. Use synthetic staging contacts and organizations. Never copy survivor or customer PII into evidence.
2. Record the exact Git SHA, workflow run URL, environment identifier, tester, UTC timestamp and result for every executed check.
3. Mark a gate **FAIL** if its required check fails; **BLOCKED** if it cannot be performed. Do not convert either into PASS by assumption.
4. Treat the current CI evidence as a point-in-time result. Every new commit requires its own green run before it is a release candidate.
5. Do not deploy, merge into production, apply production migrations, or enable numeric capacity enforcement based on this document.
6. Before requesting production approval, complete every applicable gate and attach a reviewer-signed go/no-go record.

## November 5 staged intake boundary

A shared server-only intake module, staged browser-role INSERT lockdown, and staged atomic database volume guard have been committed for validation. These controls are **NOT deployed or approved for production**. The quota guard currently uses a serialized global 120/hour backstop, 3/hour per normalized email, and 10/hour per normalized organization; thresholds and false-positive behavior need staging load review. The global backstop can be exhausted by an attacker, so edge-level mitigation and monitoring remain release requirements. Confirm service-role environment configuration without exposing credentials, run full-schema staging, validate concurrent submissions and rollback, and review legitimate insert callers before release. Do not treat disposable PostgreSQL CI as staging approval.
