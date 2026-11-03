// Guard against accidental escaped newlines in staged SQL migrations.
// This is static validation, not a substitute for PostgreSQL integration tests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../supabase/migrations");
const configuration = fs.readFileSync(path.join(root, "20261102_capacity_configuration.sql"), "utf8");
const guard = fs.readFileSync(path.join(root, "20261102_case_capacity_guard.sql"), "utf8");

for (const [name, sql] of [["configuration", configuration], ["guard", guard]]) {
  assert.ok(!sql.includes("\\n"), name + " migration contains literal escaped newline");
  assert.ok(!sql.includes("\\r"), name + " migration contains literal escaped carriage return");
}

assert.match(configuration, /enforce_case_limit boolean not null default false/i);
assert.match(configuration, /check\s*\(not enforce_case_limit or active_case_limit is not null\)/i);
assert.match(guard, /for update/i);
assert.match(guard, /before insert or update of status, organization_id/i);
assert.match(guard, /if not coalesce\(enabled, false\) then return new;/i);
assert.match(guard, /count\(\*\).*?from public\.recovery_cases/s);
console.log("Staged capacity SQL static guards passed. Database execution remains unverified.");
