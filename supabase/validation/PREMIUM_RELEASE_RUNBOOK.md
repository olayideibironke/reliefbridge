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

1. Record the exact Git commit, PR review, and all three successful CI jobs: `validate`, `postgres-capacity`, `postgres-quote`.
2. Prepare a disposable staging project with a **schema-equivalent** copy of the actual ReliefBridge schema, including RLS, existing triggers, constraints, and grants. Do not copy real survivor or customer PII.
3. Capture the current `public.sync_demo_request_to_sales()` function definition and `demo_request_sales_sync` trigger definition as a reviewed, access-controlled rollback artifact. Do not overwrite this snapshot with the staged replacement.
4. Back up staging and verify a restore procedure before applying changes.
5. Confirm the existing `demo_requests`, `sales_opportunities`, and `sales_activities` structures and their CHECK constraints match the staged migrations.

## Staging migration order

Apply in this order, in the staging environment only:

1. `supabase/migrations/20261102_capacity_configuration.sql`
2. `supabase/migrations/20261102_case_capacity_guard.sql`
3. `supabase/migrations/20261103_staff_capacity_guard.sql`
4. `supabase/migrations/20261102_quote_request_sales_classification.sql`
5. `supabase/migrations/20261103_quote_repeat_guard.sql`

Review all migrations against the current schema before execution. Do not blindly replay migrations or alter production migration history.

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

## Evidence to record

Commit SHA; CI run URLs; staging project identifier; migration execution log; original trigger/function snapshot; RLS audit; quote/demo screenshots or redacted test records; browser and accessibility results; security/abuse review; rollback rehearsal; explicit release approval.
