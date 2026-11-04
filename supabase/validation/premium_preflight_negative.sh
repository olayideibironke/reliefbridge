#!/usr/bin/env bash
set -euo pipefail
# Disposable PostgreSQL only. Verify the preflight fails closed on missing tables.
: "${PGDATABASE:?Set PGDATABASE to a disposable test database}"
case "$PGDATABASE" in
  reliefbridge_preflight_test) ;;
  *) echo "Refusing to run outside reliefbridge_preflight_test" >&2; exit 1 ;;
esac
preflight="supabase/validation/premium_staging_schema_preflight_readonly.sql"
if psql -X -v ON_ERROR_STOP=1 -f "$preflight" > /tmp/reliefbridge-preflight-out.log 2>&1; then
  echo "FAIL: preflight accepted missing schema" >&2
  exit 1
fi
if ! grep -q 'Premium staging preflight: missing tables:' /tmp/reliefbridge-preflight-out.log; then
  cat /tmp/reliefbridge-preflight-out.log >&2
  echo "FAIL: preflight did not identify missing tables" >&2
  exit 1
fi
echo "PASS: preflight rejects a disposable database missing required schema"
