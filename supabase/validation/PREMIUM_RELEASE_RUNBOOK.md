# ReliefBridge premium packages: guarded release runbook

**Status: NOT AUTHORIZED FOR PRODUCTION.** Use only after explicit release approval and a successful full-schema staging rehearsal. This document is a checklist, not permission to execute migrations or deploy.

## Release boundaries

- No price publication or unapproved numeric case caps.
- Existing Standard subscriptions and entitlements must continue working.
- Capacity enforcement defaults to **off**. A null cap means unconfigured.
- Do not expose internal sales data, service-role credentials, or survivor information to public visitors.
- Quote requests should receive a written email follow-up; a sales call is optional.
- Do not use Vercel production deployments to debug failing code.

## Before staging

1. Record the exact Git commit, PR review, and all four successful CI jobs: `validate`, `postgres-preflight`, `postgres-capacity`, `postgres-quote`.
2. Prepare a disposable staging project with a **schema-equivalent** copy of the actual ReliefBridge schema, including RLS, existing triggers, constraints, and grants. Do not copy real survivor or customer PII.
3. Capture the current `public.sync_demo_request_to_sales()` function definition and `demo_request_sales_sync` trigger definition as a reviewed, access-controlled rollback artifact. Do not overwrite this snapshot with the staged replacement.
4. Back up staging and verify a restore procedure before applying changes.
5. Confirm the existing `demo_requests`, `sales_opportunities`, and `sales_activities` structures and their CHECK constraints match the staged migrations.
6. Run `supabase/validation/premium_staging_schema_preflight_readonly.sql` in staging. Inspect the role privilege matrix: before cutover browser INSERT may still be enabled, while after cutover service_role INSERT must be enabled and browser INSERT disabled. Confirm the sales-sync function is SECURITY DEFINER with an appropriate privileged owner; do not grant service_role broad sales-table access as a workaround. Review missing tables/columns, RLS flags, existing triggers and CHECK constraints against the actual migration requirements. Secure the function-definition output because it is rollback-sensitive; this query is not a substitute for the controlled original-function snapshot.

## Staging migration order

Apply in this order, in the staging environment only:

1. `supabase/migrations/20261102_capacity_configuration.sql`
2. `supabase/migrations/20261102_case_capacity_guard.sql`
3. `supabase/migrations/20261103_staff_capacity_guard.sql`
4. `supabase/migrations/20261102_quote_request_sales_classification.sql`
5. `supabase/migrations/20261103_quote_repeat_guard.sql`
6. `supabase/migrations/20261105_public_intake_rate_guard.sql`
7. `supabase/migrations/20261105_public_intake_insert_lockdown.sql` **only after** the server-only intake path is deployed and verified against the same staging database.

Review all migrations against the current schema before execution. Do not blindly replay migrations or alter production migration history.

## Intake cutover safety

- Confirm the staging `service_role` has effective INSERT on `public.demo_requests` after the staged lockdown migration, while `anon` and `authenticated` do not. The server-only intake path uses INSERT without RETURNING and does not require service-role SELECT. Test as the actual service role, not just the database owner.
- Confirm the server runtime has a valid service-role credential without printing or exposing it. If absent, stop: both forms will fail after privilege lockdown.
- Verify both form actions use `persistPublicIntake`, with explicit field mapping and no browser-side service-role key.
- Run a synthetic demo and written quote through the deployed staging application **before** revoking public INSERT; verify both persist and the demo notifications behave correctly.
- Apply the staged rate guard and test legitimate multiple contacts, concurrent requests, and abuse thresholds against staging data. Review the global 120/hour ceiling for false positives and denial-of-service exposure.
- Only then apply the direct INSERT lockdown and repeat form submissions. Verify direct anonymous/authenticated Data API INSERT is rejected while authorized staff UPDATE remains functional.
- Never deploy a code revision that depends on the new permissions before its server environment is ready. Coordinate cutover to avoid an interval where valid requests are rejected.
- The quota trigger counts only rows with `source = 'Website'`; internal privileged inserts with a different source remain outside the quota. A global website quota can still be exhausted intentionally. Confirm operational mitigation and monitoring before approving production.

## Intake cutover rollback (staging rehearsal required)

1. Capture the current table privileges, RLS policies, triggers, and a reviewed rollback artifact **before** any migration. Keep secrets and live PII out of evidence.
2. If a form fails after the new application code is deployed but before privilege lockdown, stop rollout and revert the application revision to the previously verified version. Do not alter production grants to debug.
3. If a form fails **after** privilege lockdown, first confirm the service-role environment and server-side intake path. Rolling back the application alone will **not** restore public submissions because the old code uses the browser-facing database role.
4. To revert the cutover, coordinate a reviewed restoration of the prior database grants/RLS and the prior application version as a single controlled operation. Re-enabling public INSERT reopens the direct API bypass and must be treated as a temporary security exception, not a routine rollback.
5. For a rate-guard defect, review and rehearse disabling the `public_intake_volume_guard` trigger in staging while retaining the public INSERT lockdown and the working server-only intake path. Do not disable the quote repeat guard or sales pipeline sync.
6. Re-run the real staging demo and quote forms, their notifications, internal sales management updates, and direct anonymous/authenticated Data API rejection after every rollback or remediation.

## Staging verification

- Confirm every existing organization has capacity enforcement disabled unless specifically approved. Test both missing-policy and disabled-policy paths.
- Submit an anonymous quote through the real Next.js form. Confirm exactly one `demo_requests` record and the expected internal sales opportunity and activity. Check written quote classification and no sensitive information in client output.
- Submit an ordinary demo request. Confirm the original demo classification and behavior remain intact.
- Retry the same quote within 10 minutes. Confirm the friendly acknowledgement and no additional intake record. Submit from a different organization; confirm acceptance.
- Test invalid form values, offline/database failure, mobile layout, keyboard focus, screen-reader error announcements, and no survivor information requested.
- Confirm anonymous users cannot read `demo_requests`, `sales_opportunities`, or `sales_activities`.
- Verify capacity transitions and two-session concurrency with realistic authorization and existing triggers.
- Validate verified Stripe Standard subscriptions still resolve to the correct existing entitlements.
- Review operational abuse controls and monitoring. The 10-minute email+organization cooldown is **not** a replacement for edge-level rate limiting.

## Sales-pipeline integrity acceptance matrix

Run these against the **real staging schema and application**, not just the disposable CI fixture. Use synthetic contacts and capture redacted query evidence.

| Scenario | Required outcome |
| --- | --- |
| Existing prospect submits another quote | One opportunity; new intake and activity only when outside the quote cooldown |
| Same contact submits demo and quote concurrently | Two intake records, one opportunity, two correctly typed activities, final stage **Quote/Proposal** |
| Quote arrives before a later demo | Quote/Proposal stage and written-quote follow-up remain intact |
| Existing opportunity originated from a partner referral | Original attribution is retained, not overwritten with Website |
| Legacy attribution is empty or whitespace-only | Source falls back to Website |
| Legacy email/organization differs only by case or surrounding spaces | Existing opportunity is matched without duplication |
| Existing inquiry changes email, organization name, or role | Linked opportunity updates in place; no fabricated new activity |
| Management has edited next action or notes | Management instructions remain intact and new quote details are recorded |
| Existing customer opportunity is Won | Later demo/quote cannot reopen or downgrade it |
| Simultaneous identical quote submissions | Exactly one accepted intake, opportunity, and activity |
| Anonymous visitor attempts to read or modify internal sales data | Denied by RLS/grants |

Also verify the audit trail after each scenario: no orphaned activities, no duplicate opportunity for a normalized contact/organization pair, and no unintended modification to a different organization's records. If any scenario fails on the real staging schema, stop the release and investigate before another deployment.

Run `supabase/validation/quote_pipeline_staging_audit_readonly.sql` **before and after** the staging smoke tests. Record aggregate counts and any duplicate/orphan findings. The audit is read-only and may expose historical pre-existing anomalies; distinguish baseline findings from new regressions rather than assuming every returned row was introduced by this release. Do not export real customer identifiers or use the audit to modify production data.

## Go/no-go

Do not proceed if any required test fails, if staging schema differs unexpectedly, if the rollback snapshot is missing, if the abuse protection is inadequate, or if written customer-facing approval has not been granted.

## Production rollout, only after separate explicit approval

1. Confirm recent backup, restore access, migration owner, maintenance window, and rollback contact.
2. Reconfirm current live schema and trigger definitions; compare to the reviewed staging baseline.
3. Apply only reviewed migrations in approved order; verify trigger and RLS permissions after each.
4. Deploy the already validated commit once, avoiding speculative redeployments.
5. Run non-destructive smoke tests and monitor errors, duplicate rates, quote classification, and existing demo intake.
6. Keep capacity enforcement flags **off** until separate approval of numeric limits per organization.

## Rollback planning

- **Application:** revert to the last known-good application deployment if a user-facing regression occurs.
- **Quote classification:** restore the **captured original function definition**, not a guessed SQL body. Validate the original demo trigger after restoration.
- **Duplicate guard:** remove `quote_request_repeat_guard` only after approving the security tradeoff and replacing it with an appropriate intake control; retain records.
- **Capacity guards:** leave `enforce_case_limit` and `enforce_staff_limit` false. If required, roll back staged trigger changes using reviewed scripts that preserve existing authorization triggers.
- Do not delete customer intake, case, profile, or sales records to roll back.
- Test rollback in staging first. If rollback cannot be proven safe, do not release.

## Evidence register

Maintain `supabase/validation/PREMIUM_RELEASE_EVIDENCE.md` as the source of truth for gate status. Refresh the CI commit and run evidence after the final code change; no prior green run substitutes for a release-candidate run. A gate with missing evidence is not passed.

## Evidence to record

Commit SHA; CI run URLs; staging project identifier; migration execution log; original trigger/function snapshot; RLS audit; quote/demo screenshots or redacted test records; browser and accessibility results; security/abuse review; rollback rehearsal; explicit release approval.
