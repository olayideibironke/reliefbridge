#!/usr/bin/env bash
set -euo pipefail
# Disposable PostgreSQL only. Test fail-closed staging preflight behavior.
: "${PGDATABASE:?Set PGDATABASE to a disposable test database}"
case "$PGDATABASE" in
  reliefbridge_preflight_test) ;;
  *) echo "Refusing to run outside reliefbridge_preflight_test" >&2; exit 1 ;;
esac
preflight="supabase/validation/premium_staging_schema_preflight_readonly.sql"
output="$(mktemp)"
trap 'rm -f "$output"' EXIT
expect_failure() {
  local expected="$1"
  if psql -X -v ON_ERROR_STOP=1 -f "$preflight" > "$output" 2>&1; then
    echo "FAIL: preflight accepted invalid schema (expected: $expected)" >&2
    exit 1
  fi
  if ! grep -Fq "$expected" "$output"; then
    cat "$output" >&2
    echo "FAIL: expected preflight failure not found: $expected" >&2
    exit 1
  fi
}
expect_failure 'Premium staging preflight: missing tables:'
echo 'PASS: missing tables rejected'

psql -X -v ON_ERROR_STOP=1 <<'SQL'
create table public.organizations (id uuid);
create table public.profiles (organization_id uuid, access_status text);
create table public.recovery_cases (organization_id uuid, status text);
create table public.demo_requests (
  work_email text, organization_name text, message text, status text, source text
);
create table public.sales_opportunities (
  demo_request_id uuid, contact_email text, organization_name text,
  stage text, next_action text, source text
);
create table public.sales_activities (opportunity_id uuid);
SQL
expect_failure 'Premium staging preflight: missing columns: sales_activities.activity_type'
echo 'PASS: missing required column rejected'

psql -X -v ON_ERROR_STOP=1 <<'SQL'
alter table public.sales_activities add column activity_type text;
SQL
expect_failure 'Premium staging preflight: RLS disabled on:'
echo 'PASS: disabled RLS rejected'

psql -X -v ON_ERROR_STOP=1 <<'SQL'
alter table public.demo_requests enable row level security;
alter table public.sales_opportunities enable row level security;
alter table public.sales_activities enable row level security;
SQL
expect_failure 'Premium staging preflight: original demo_request_sales_sync trigger missing'
echo 'PASS: missing sales-sync trigger rejected'

psql -X -v ON_ERROR_STOP=1 <<'SQL'
create function public.sync_demo_request_to_sales()
returns trigger language plpgsql as $$
begin
  return new;
end
$$;
create trigger demo_request_sales_sync
after insert or update on public.demo_requests
for each row execute function public.sync_demo_request_to_sales();
SQL
psql -X -v ON_ERROR_STOP=1 <<'SQL'
alter table public.demo_requests disable trigger demo_request_sales_sync;
SQL
expect_failure 'Premium staging preflight: original demo_request_sales_sync trigger missing'
echo 'PASS: disabled sales-sync trigger rejected'

psql -X -v ON_ERROR_STOP=1 <<'SQL'
alter table public.demo_requests enable trigger demo_request_sales_sync;
SQL
psql -X -v ON_ERROR_STOP=1 -f "$preflight" > "$output" 2>&1
grep -Fq 'PASS: required schema objects, RLS and original sales sync exist' "$output"
echo 'PASS: complete synthetic schema accepted'
