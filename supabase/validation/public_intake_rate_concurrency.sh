#!/usr/bin/env bash
set -euo pipefail
# Disposable PostgreSQL only, after quote_pipeline_integration.sql.
# Four simultaneous submissions for one normalized email must admit at most three.
psql -X -v ON_ERROR_STOP=1 -f supabase/migrations/20261105_public_intake_rate_guard.sql >/dev/null
dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT
email="volume-race@example.test"
for i in 1 2 3 4; do
  (
    if psql -X -v ON_ERROR_STOP=1 -c "insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message) values ('Volume','Race','$email','Volume Race Agency $i','Other','Director','Ordinary demo')" >"$dir/$i.log" 2>&1; then
      echo 0 >"$dir/$i.rc"
    else
      echo 1 >"$dir/$i.rc"
    fi
  ) &
done
wait || true
accepted=0
rejected=0
for i in 1 2 3 4; do
  if [[ "$(cat "$dir/$i.rc")" == "0" ]]; then
    accepted=$((accepted+1))
  elif grep -q "Public intake temporarily limited" "$dir/$i.log"; then
    rejected=$((rejected+1))
  else
    echo "FAIL: unexpected database error for writer $i"
    cat "$dir/$i.log"
    exit 1
  fi
done
stored="$(psql -X -At -v ON_ERROR_STOP=1 -c "select count(*) from public.demo_requests where work_email='$email'")"
if [[ "$accepted" != 3 || "$rejected" != 1 || "$stored" != 3 ]]; then
  echo "FAIL: race accepted $accepted, rejected $rejected, stored $stored; expected 3/1/3"
  exit 1
fi
echo "PASS: atomic public intake quota admits exactly 3 of 4 simultaneous requests"
