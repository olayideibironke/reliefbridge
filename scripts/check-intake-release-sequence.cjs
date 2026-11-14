const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const runbook = fs.readFileSync(path.join(root, "supabase/validation/PREMIUM_RELEASE_RUNBOOK.md"), "utf8");
const evidence = fs.readFileSync(path.join(root, "supabase/validation/PREMIUM_RELEASE_EVIDENCE.md"), "utf8");
const guard = fs.readFileSync(path.join(root, "supabase/migrations/20261105_public_intake_rate_guard.sql"), "utf8");
const lockdown = fs.readFileSync(path.join(root, "supabase/migrations/20261105_public_intake_insert_lockdown.sql"), "utf8");
const required = [
  "20261102_capacity_configuration.sql",
  "20261102_case_capacity_guard.sql",
  "20261103_staff_capacity_guard.sql",
  "20261102_quote_request_sales_classification.sql",
  "20261103_quote_repeat_guard.sql",
  "20261105_public_intake_rate_guard.sql",
  "20261105_public_intake_insert_lockdown.sql",
];
function assert(condition, message) {
  if (!condition) throw new Error("Release sequence: " + message);
}
let previous = -1;
for (const name of required) {
  const index = runbook.indexOf(name);
  assert(index > previous, "missing or out-of-order migration: " + name);
  previous = index;
  assert(fs.existsSync(path.join(root, "supabase/migrations", name)), "missing migration file: " + name);
}
assert(runbook.includes("server-only intake path is deployed"), "lockdown must require working server intake");
assert(runbook.includes("revert the cutover"), "cutover must include coordinated rollback");
assert(runbook.includes("Re-enabling public INSERT reopens the direct API bypass"), "rollback must flag the direct API security risk");
assert(runbook.includes("source = 'Website'") || runbook.includes("only `Website`"), "runbook must reflect website-only quota");
assert(runbook.includes("unreachable under the current schema"), "runbook must not present non-Website quota bypass as currently usable");
assert(guard.includes("new.source is distinct from 'Website'"), "SQL must preserve internal insert exemption");
assert(lockdown.includes("revoke insert on table public.demo_requests from anon;"), "anonymous INSERT revoke missing");
assert(lockdown.includes("revoke insert on table public.demo_requests from authenticated;"), "authenticated INSERT revoke missing");
assert(evidence.includes("BLOCKED") || evidence.includes("NOT AUTHORIZED"), "release evidence must retain blocked status");
// Reject any later migration that reopens browser-facing direct intake INSERT.
const migrationDir = path.join(root, "supabase/migrations");
const cutoff = "20261105_public_intake_insert_lockdown.sql";
for (const name of fs.readdirSync(migrationDir).filter((file) => file.endsWith(".sql") && file > cutoff)) {
  const sql = fs.readFileSync(path.join(migrationDir, name), "utf8")
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .toLowerCase();
  if (/grant\s+(?:all(?:\s+privileges)?|[^;]*\binsert\b)[^;]*\bon\s+(?:table\s+)?(?:public\.)?demo_requests\s+to\s+[^;]*\b(?:anon|authenticated|public)\b/.test(sql)) {
    throw new Error("Release sequence: later migration regrants public intake INSERT: " + name);
  }
}
console.log("PASS: staged migration order, rollback warnings, and release block");
