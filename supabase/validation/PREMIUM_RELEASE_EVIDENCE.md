# Premium packages release evidence register

**Release status: BLOCKED.** This register is a template for actual test evidence, not a claim that staging or production validation has occurred. Do not mark a gate PASS without its supporting artifact and reviewer.

| Gate | Current status | Required evidence |
| --- | --- | --- |
| GitHub CI: validate, postgres-preflight, postgres-capacity, postgres-quote | PASS at commit `eb66857a4d53134292b9d2c3b75f3764bcb888b2` | [CI run #148](https://github.com/olayideibironke/reliefbridge/actions/runs/43084781135), all four required jobs succeeded; refresh after every new commit |
| Disposable PostgreSQL preflight, case/staff and quote integration | PASS at above commit | CI run #148, three PostgreSQL jobs; disposable fixtures only |
| Read-only production RLS and schema review | REVIEWED (2026-11-03) | `QUOTE_SECURITY_RELEASE_REVIEW.md`; repeat against current schema before release |
| Production service-role table permissions (read-only review, 2026-11-05) | **BLOCKED: service_role lacks INSERT on public.demo_requests** | Effective `has_table_privilege` results and role grants verified read-only; stage a narrowly scoped INSERT grant fix and verify before any cutover |
| Full-schema staging migration rehearsal | NOT RUN | Staging project ID, migration logs, preflight schema comparison |
| Original sales-sync trigger/function snapshot | NOT CAPTURED FOR RELEASE | Original definition saved as an unreviewed reference in `rollback_original_sales_sync_20261115.sql` at commit `c8af7ab`; independent review and staging restore are still required |
| Staging rollback and restore rehearsal | NOT RUN | Restore transcript, validation results, owner |
| Real anonymous quote/demo E2E | NOT RUN | Redacted synthetic intake, opportunity and activity evidence |
| Staging before/after sales-integrity audit | NOT RUN | `quote_pipeline_staging_audit_readonly.sql` outputs, baseline comparison |
| Staging capacity opt-in, transfers and concurrency | NOT RUN | Test log showing disabled default, case/staff race safety |
| Stripe Standard grandfathering smoke test | NOT RUN | Verified subscription and unchanged entitlement outcomes |
| Browser/mobile/keyboard/screen-reader QA | NOT RUN | Browser versions, redacted screenshots and findings |
| Edge abuse controls and operational monitoring | NOT VERIFIED | Rate-limit design, monitoring ownership, failure handling |
| Explicit production release approval | NOT GRANTED | Written approval naming exact commit and rollout scope |

## Live schema finding, November 5 (read-only)

A read-only query against ReliefBridge Supabase project `hknfbkbqfcombsblrnnu` confirmed RLS is enabled on `demo_requests`, `sales_opportunities`, and `sales_activities`. On `public.demo_requests`, `anon` and `authenticated` both currently have effective INSERT, while `service_role` has **neither INSERT nor SELECT**. The underlying role grants also lack those privileges for `service_role`. The staged server-only intake client uses INSERT **without** `.select()` or RETURNING, so **INSERT is required but SELECT is not**. Rehearse a narrowly scoped service-role INSERT grant in schema-equivalent staging and validate both demo and quote end-to-end before revoking browser INSERT. Do not change production grants without a separate approved rollout. No SQL writes were performed during this review.

### Live sales-sync privilege review, November 5 (read-only)

The existing `public.sync_demo_request_to_sales()` function is owned by `postgres` and is `SECURITY DEFINER`. The live `service_role` has no direct INSERT/SELECT on `public.sales_opportunities` or `public.sales_activities`. PostgreSQL trigger execution does not require the triggering role to have explicit EXECUTE on the trigger function; the trigger runs the security-definer body with its owner privileges. **Do not grant broad sales-table access merely to satisfy the intake cutover.** This is a structural review, not proof that the full sales-sync function works with staged migrations. Verify actual service-role inserts, trigger side effects, and sales integrity in schema-equivalent staging.

GitHub Actions [run #139](https://github.com/olayideibironke/reliefbridge/actions/runs/42155849308) passed at commit `3613f70464c9bcd87731614e21c6421d48931e40`, including the corrected `BYPASSRLS` service-role fixture. It does not supersede the staging gates.

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

## November 10 CI verification

GitHub Actions [run #144](https://github.com/olayideibironke/reliefbridge/actions/runs/42853030829) completed successfully for application commit `2eb788bdeb512f03271cb37b10b7c05945884650`. The `validate`, `postgres-preflight`, `postgres-capacity`, and `postgres-quote` jobs each reported success. The application commit changes demo notification handling to use independent settled results and updates email-first messaging. This evidence-register update is documentation only and requires its own current-head CI confirmation before release.

**Still blocked:** a full-schema-equivalent staging rehearsal, reviewed original sales-sync rollback artifact, staging E2E and rollback, abuse review, and explicit production approval. CI fixtures are not proof of production-schema compatibility. No production migration or deployment is authorized.

## November 11 live-schema prerequisite verification (read-only)

Read-only checks against the connected ReliefBridge production database found **zero missing tables** among the six required tables and **zero missing columns** among the 17 columns listed in the staging preflight. RLS was enabled on all three sales/intake tables. The `demo_request_sales_sync` trigger was enabled and `sync_demo_request_to_sales()` remained SECURITY DEFINER. These findings establish only structural prerequisites, **not** that the premium migrations or intake cutover work against the full schema. No live schema or data writes were performed.

## November 11 CI release evidence

GitHub Actions [run #148](https://github.com/olayideibironke/reliefbridge/actions/runs/43084781135) succeeded for commit `eb66857a4d53134292b9d2c3b75f3764bcb888b2`: `validate`, `postgres-preflight`, `postgres-capacity`, and `postgres-quote` all passed. Run #147 failed because the newly live-aligned disposable quote fixture declared `demo_requests.status` twice; commit `eb66857` removed the duplicate declaration and #148 passed. The fixture now models more live column defaults and constraints but **is not** a schema-equivalent staging environment.

**Current decision: NO-GO.** Full-schema staging, captured original rollback function, actual staging form E2E, restoration, and abuse/monitoring review remain unverified. This evidence-register-only commit must also pass its own CI checks; no production approval is implied.

## November 13 messaging tenant isolation and live intake baseline

GitHub Actions [run #153](https://github.com/olayideibironke/reliefbridge/actions/runs/43497846620) passed at commit `eb93149f454cda031dc5053332f62250be7094e0` with all five jobs successful, including `postgres-message-tenant`. Its disposable PostgreSQL log explicitly reported `Legacy tenant isolation SQL integration passed`. This validates the staged legacy messaging tenant check with synthetic identities; it does **not** demonstrate application-level authorization against full Supabase Auth or production.

Read-only production review confirmed PostgreSQL 17.6, two enabled demo-request triggers, three demo-request RLS policies, and effective INSERT on `demo_requests` for `anon` and `authenticated` but not `service_role`. The live source constraint accepts only `Website`, so the rate-guard comment about bypassing quotas using an internal source is not an executable workflow under the present schema. The sales-sync function remains SECURITY DEFINER, owned by `postgres`. No production grants, schema, records, or deployment were changed.

**Current decision: NO-GO.** Full-schema staging, rollback snapshot and rehearsal, actual application demo/quote E2E, abuse monitoring, and explicit production approval remain outstanding. This evidence-document update requires a fresh CI run before being considered the current green head.

## November 15 current-head verification and privileged-function review

GitHub Actions [run #159](https://github.com/olayideibironke/reliefbridge/actions/runs/43748950869) completed successfully at commit `ff03cc1eb6f3d24383f4a10f63dfff35e9452f33`. All five jobs passed: `validate`, `postgres-preflight`, `postgres-capacity`, `postgres-quote`, and `postgres-message-tenant`. This includes the live-aligned `profiles.access_status` fixture (`invited`, `active`, `disabled`). The demo notification footer now uses ReliefBridge Team branding. This documentation commit, if any, requires its own green CI run.

Read-only Supabase security advisors reported 20 `authenticated_security_definer_function_executable` warnings, two `rls_enabled_no_policy` informational findings (`staff_activation_tokens` and `stripe_webhook_events`), and one leaked-password-protection warning. The 20 flagged functions deny anonymous EXECUTE and their definitions include caller-scoped access checks or call protected helpers; this static review does **not** establish authenticated-user penetration-test coverage. `private.touch_platform_access()` was inspected and limits writes to the caller's active ReliefBridge platform profile. Do not revoke RPC execution blindly because existing authorized workflows depend on it. See [Supabase linter guidance](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

**Release remains NO-GO:** no billable staging branch has been authorized or created; full-schema staging, rollback rehearsal, application E2E, and final production approval remain outstanding. No production writes or Vercel deployment were made during these checks.

## November 15 latest CI and rollback reference

GitHub Actions [run #161](https://github.com/olayideibironke/reliefbridge/actions/runs/43758404027) completed successfully at commit `c8af7ab0b2c9e47e7815fdd8d1d07e8b5cc51494`. All five jobs passed: `validate`, `postgres-preflight`, `postgres-capacity`, `postgres-quote`, and `postgres-message-tenant`. The commit also corrected duplicate ReliefBridge Team sign-offs in demo confirmations.

The read-only production definition of `public.sync_demo_request_to_sales()` was saved to `supabase/validation/rollback_original_sales_sync_20261115.sql`, and the existing `demo_request_sales_sync` trigger was verified as enabled. The saved function matches the original definition apart from terminal formatting. This is a **captured reference, not an executed rollback**; a reviewer must approve the artifact and validate restoration on full-schema staging. No production writes were performed.

A no-cost local PostgreSQL installation was attempted but the package-index update timed out. It does not count as a staging rehearsal. **NO-GO** remains in effect until full-schema staging, rollback execution, real demo/quote E2E, operational abuse controls, and explicit approval are complete.

