#!/usr/bin/env bash
set -euo pipefail
# Run only against disposable CI PostgreSQL, after quote_pipeline_integration.sql.
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT
email="race-quote@example.test"
org="Concurrency Fixture"
query="insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message) values ('Race','Lead','$email','$org','Other','Director','QUOTE REQUEST: concurrent submission')"
# Hold the exact advisory lock used by the trigger until both writers are waiting.
(psql -X -v ON_ERROR_STOP=1 -c "begin; select pg_advisory_xact_lock(hashtextextended('race-quote@example.test:concurrency fixture',0)); select pg_sleep(3); commit;" >"$dir/lock.log" 2>&1) &
locker=$!
sleep 0.5
for i in 1 2; do
  (if psql -X -v ON_ERROR_STOP=1 -c "$query" >"$dir/$i.log" 2>&1; then echo 0 >"$dir/$i.rc"; else echo 1 >"$dir/$i.rc"; fi) &
done
wait "$locker"
wait || true
success=0
for i in 1 2; do
  if [[ "$(cat "$dir/$i.rc")" == 0 ]]; then success=$((success+1)); fi
done
count="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.demo_requests where work_email='$email' and organization_name='$org'")"
if [[ "$success" != 1 || "$count" != 1 ]]; then
  echo "FAIL: quote race had $success successful requests and $count stored rows (expected 1 each)"
  cat "$dir/1.log" "$dir/2.log"
  exit 1
fi
echo "PASS: concurrent identical quote requests result in exactly one stored row"
