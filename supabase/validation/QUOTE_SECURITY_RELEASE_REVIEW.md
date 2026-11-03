# ReliefBridge quote intake security and rollout review

Reviewed 2026-11-03 against the live ReliefBridge Supabase schema, using **read-only SQL**. This is a pre-release audit, not proof of a completed public form submission.

## Observed production permissions

| Table | RLS | Anonymous INSERT | Anonymous SELECT | Anonymous UPDATE |
| --- | --- | --- | --- | --- |
| public.demo_requests | enabled | yes | no | no |
| public.sales_opportunities | enabled | no | no | no |
| public.sales_activities | enabled | no | no | no |

The demo_requests INSERT policy allows anon/authenticated submissions only with `status='New'` and `source='Website'`. The quote action explicitly sends both values.

Sales opportunity and activity policies require an authenticated active owner/admin profile in the internal platform organization. Anonymous users have no table privileges for these tables.

The existing `demo_request_sales_sync` trigger is installed on demo_requests (AFTER INSERT OR UPDATE). The staged quote classification migration modifies its trigger function, but **has not been applied to production**.

## Release gates

- [x] Disposable PostgreSQL tests: case and staff limits, concurrency, opt-out, reactivation and transfer.
- [x] Disposable PostgreSQL tests: quote classification, ordinary demo compatibility, updates and existing-lead deduplication.
- [x] Production read-only inspection: public INSERT policy, table grants, sales RLS, trigger presence, stage/activity constraints.
- [ ] Validate a real anonymous quote form submission in a **nonproduction** environment and inspect the resulting demo request, opportunity and activity.
- [x] Test quote-only duplicate cooldown, expiry, and concurrent identical submissions in disposable PostgreSQL.
- [x] Provide a user-friendly acknowledgement when the database rejects a repeated quote request.
- [ ] Verify broader spam/rate limiting and operational abuse handling before exposing the form publicly.
- [ ] Confirm production migration rollout and rollback steps, including a snapshot of the existing sales-sync function definition.
- [ ] Human QA: mobile, keyboard, screen reader, success and validation states.
- [ ] Explicit approval for any customer-facing rollout; never enable numeric case/staff enforcement without approved caps.

## Security boundaries

Do not expose service-role credentials to the browser. Do not grant anonymous SELECT on intake records or anonymous access to internal sales tables. Keep capacity enforcement off by default and preserve existing paid subscriptions. A green disposable test is not equivalent to a successful production request.

**No production SQL writes, migrations, or deployments were made during this review.**
