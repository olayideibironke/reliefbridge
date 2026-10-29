# ReliefBridge case-management API inventory

Status: engineering discovery, not a public API contract. Verified against repository source on 2026-10-29.

## Existing application routes and data access

| Feature | Existing page | Supabase table | Existing dedicated REST route |
| --- | --- | --- | --- |
| Survivors | `/app/survivors` | `survivors` | `/api/survivors` not found |
| Recovery cases | `/app/cases` | `recovery_cases` | `/api/cases` not found |
| Referrals | `/app/referrals` | `referrals` | `/api/referrals` not found |

All three pages call `requireProfile()` and query Supabase through `createSupabaseServerClient()`. They are application pages, **not** REST endpoints, and must not be represented as API paths in OpenAPI until separate handlers are designed and verified.

### Existing read behavior

- Survivors: selects a limited field set, sorts by `created_at`, caps at 200, supports name/email/phone, status and state filters. Non-platform staff filter by `organization_id`.
- Recovery cases: selects case fields and related survivor name/state, sorts by `opened_at`, caps at 250, supports status/priority filters. Free-text search occurs after the capped query. Non-platform staff filter by `organization_id`.
- Referrals: joins survivor and sending/receiving organization records, sorts by `created_at`, caps at 250. Non-platform staff filter by sending or receiving organization based on direction; status/category filters are available.

### Security considerations before creating an integration API

1. Do not expose survivor names, phone numbers, email addresses, or referral details through public documentation examples.
2. Preserve authenticated organization context and database RLS. Never trust a caller-supplied organization ID as authorization.
3. Platform manager/staff behavior differs from ordinary organization access. Any new API must explicitly specify which roles can query across organizations and verify the underlying RLS policy.
4. Confirm access rules and RLS policies for each table before adding handlers. `requireProfile()` alone is not a role authorization check.
5. Design a minimal read-only, paginated contract first, with server-side validation and safe rate limits. Do not enable mutations or partner credentials until separately reviewed.
6. Test with synthetic records and distinct organization accounts. Confirm negative tests (cross-organization access, disabled profiles, demo restrictions) before production release.
7. Existing billing checkout and Stripe webhook endpoints are documented separately in `docs/internal-openapi.json`. They must not be executed as test calls.

## Proposed next engineering gates

- Inspect database policies and existing create/edit operations for survivors, cases, and referrals.
- Define approved field-level response shapes and role matrix.
- Implement a private, read-only route only after verifying tenant isolation.
- Add the new route to OpenAPI only after tests pass.
- Request human testing for the authenticated role/organization experience when automated verification is complete.

No new routes, permissions, migrations, or third-party services are introduced by this document.
