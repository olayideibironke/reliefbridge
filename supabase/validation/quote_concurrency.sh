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
opportunities="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.sales_opportunities where lower(btrim(contact_email))='$email' and lower(btrim(organization_name))=lower('$org')")"
activities="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.sales_activities a join public.sales_opportunities o on o.id=a.opportunity_id where lower(btrim(o.contact_email))='$email' and lower(btrim(o.organization_name))=lower('$org')")"
if [[ "$opportunities" != 1 || "$activities" != 1 ]]; then
  echo "FAIL: concurrent quote race produced $opportunities sales opportunities and $activities activities (expected 1 each)"
  exit 1
fi
echo "PASS: concurrent identical quote requests result in one intake, one opportunity and one activity"

# A demo and a quote from the same contact are not identical quote submissions.
# They must nevertheless share a single sales opportunity under concurrent inserts.
mixed_email="mixed-race@example.test"
mixed_org="Mixed Inquiry Agency"
mixed_lock="sales:$mixed_email:mixed inquiry agency"
(psql -X -v ON_ERROR_STOP=1 -c "begin; select pg_advisory_xact_lock(hashtextextended('$mixed_lock',0)); select pg_sleep(3); commit;" >"$dir/mixed-lock.log" 2>&1) &
mixed_locker=$!
sleep 0.5
for kind in demo quote; do
  if [[ "$kind" == demo ]]; then
    message="Request a demonstration"
  else
    message="QUOTE REQUEST: concurrent with demo"
  fi
  (if psql -X -v ON_ERROR_STOP=1 -c "insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message) values ('Mixed','Lead','$mixed_email','$mixed_org','Other','Director','$message')" >"$dir/mixed-$kind.log" 2>&1; then echo 0 >"$dir/mixed-$kind.rc"; else echo 1 >"$dir/mixed-$kind.rc"; fi) &
done
wait "$mixed_locker"
wait || true
for kind in demo quote; do
  if [[ "$(cat "$dir/mixed-$kind.rc")" != 0 ]]; then
    echo "FAIL: concurrent $kind submission was rejected"
    cat "$dir/mixed-$kind.log"
    exit 1
  fi
done
mixed_intakes="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.demo_requests where work_email='$mixed_email' and organization_name='$mixed_org'")"
mixed_opportunities="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.sales_opportunities where lower(btrim(contact_email))='$mixed_email' and lower(btrim(organization_name))=lower('$mixed_org')")"
mixed_activities="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.sales_activities a join public.sales_opportunities o on o.id=a.opportunity_id where lower(btrim(o.contact_email))='$mixed_email'")"
if [[ "$mixed_intakes" != 2 || "$mixed_opportunities" != 1 || "$mixed_activities" != 2 ]]; then
  echo "FAIL: concurrent demo/quote yielded $mixed_intakes intakes, $mixed_opportunities opportunities, $mixed_activities activities (expected 2/1/2)"
  exit 1
fi
echo "PASS: concurrent demo and quote preserve both inquiries and one shared opportunity"
