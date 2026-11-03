#!/usr/bin/env bash
set -euo pipefail
# Disposable CI database only. Must run after capacity_integration.sql.
psql -X -v ON_ERROR_STOP=1 <<'SQL'
insert into public.organizations(id) values
('00000000-0000-0000-0000-000000000003'),
('00000000-0000-0000-0000-000000000004');
insert into public.organization_capacity_policies
(organization_id, active_case_limit, enforce_case_limit, staff_limit, enforce_staff_limit)
values
('00000000-0000-0000-0000-000000000003',1,true,1,true),
('00000000-0000-0000-0000-000000000004',1,true,1,true);
SQL

run_race() {
  local kind="$1" query1="$2" query2="$3" expected_count_sql="$4"
  local dir
  dir="$(mktemp -d)"
  # Hold the destination organization's row lock while both workers queue.
  # This makes the workers overlap rather than relying on scheduler timing.
  local org
  if [[ "$kind" == "case" ]]; then org='00000000-0000-0000-0000-000000000003'
  else org='00000000-0000-0000-0000-000000000004'; fi
  (
    psql -X -v ON_ERROR_STOP=1 -c "begin; select id from public.organizations where id='$org' for update; select pg_sleep(3); commit;" >"$dir/lock.log" 2>&1
  ) &
  local locker=$!
  sleep 0.5
  (psql -X -v ON_ERROR_STOP=1 -c "$query1" >"$dir/one.log" 2>&1; echo $? >"$dir/one.rc") &
  local one=$!
  (psql -X -v ON_ERROR_STOP=1 -c "$query2" >"$dir/two.log" 2>&1; echo $? >"$dir/two.rc") &
  local two=$!
  wait "$locker"
  wait "$one" || true
  wait "$two" || true
  local ok=0
  if [[ "$(cat "$dir/one.rc")" == "0" ]]; then ok=$((ok+1)); fi
  if [[ "$(cat "$dir/two.rc")" == "0" ]]; then ok=$((ok+1)); fi
  if [[ "$ok" != "1" ]]; then
    echo "FAIL: $kind race had $ok successful inserts (expected exactly one)"
    cat "$dir/one.log" "$dir/two.log"
    exit 1
  fi
  local count
  count="$(psql -X -At -v ON_ERROR_STOP=1 -c "$expected_count_sql")"
  if [[ "$count" != "1" ]]; then
    echo "FAIL: $kind race left $count active rows (expected 1)"
    exit 1
  fi
  echo "PASS: concurrent $kind requests: exactly one accepted"
  rm -rf "$dir"
}

run_race case \
"insert into public.recovery_cases values ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000003','open')" \
"insert into public.recovery_cases values ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000003','open')" \
"select count(*) from public.recovery_cases where organization_id='00000000-0000-0000-0000-000000000003' and status <> 'closed'"

run_race staff \
"insert into public.profiles values ('20000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000004','active')" \
"insert into public.profiles values ('20000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000004','active')" \
"select count(*) from public.profiles where organization_id='00000000-0000-0000-0000-000000000004' and access_status='active'"
