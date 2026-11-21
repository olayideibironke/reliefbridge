// Guard against accidental escaped newlines in staged SQL migrations.
// This is static validation, not a substitute for PostgreSQL integration tests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../supabase/migrations");
const configuration = fs.readFileSync(path.join(root, "20261102_capacity_configuration.sql"), "utf8");
const guard = fs.readFileSync(path.join(root, "20261102_case_capacity_guard.sql"), "utf8");
const staff = fs.readFileSync(path.join(root, "20261103_staff_capacity_guard.sql"), "utf8");

for (const [name, sql] of [["configuration", configuration], ["guard", guard], ["staff", staff]]) {
  assert.ok(!sql.includes("\\n"), name + " migration contains literal escaped newline");
  assert.ok(!sql.includes("\\r"), name + " migration contains literal escaped carriage return");
}

assert.match(configuration, /enforce_case_limit boolean not null default false/i);
assert.match(configuration, /check\s*\(not enforce_case_limit or active_case_limit is not null\)/i);
assert.match(guard, /for update/i);
assert.match(guard, /before insert or update of status, organization_id/i);
assert.match(guard, /if not coalesce\(enabled, false\) then return new;/i);
assert.match(guard, /count\(\*\).*?from public\.recovery_cases/s);
assert.match(staff, /enforce_staff_limit boolean not null default false/i);
assert.match(staff, /check\s*\(not enforce_staff_limit or staff_limit is not null\)/i);
assert.match(staff, /before insert or update of access_status, organization_id/i);
assert.match(staff, /access_status = 'active'/i);
assert.match(staff, /for update/i);
assert.match(staff, /pg_catalog\.pg_constraint/i);
assert.match(staff, /staff_limit_required_when_enabled/i);
assert.match(staff, /if not exists\s*\(/i);
assert.match(staff, /revoke all on function public\.check_staff_capacity\(\) from public, anon, authenticated/i);
assert.match(guard, /revoke all on function public\.check_case_capacity\(\) from public, anon, authenticated/i);
console.log("Staged case and staff capacity SQL static guards passed. Database execution remains unverified.");
