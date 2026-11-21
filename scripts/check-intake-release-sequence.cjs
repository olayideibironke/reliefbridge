const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const runbook = fs.readFileSync(path.join(root, "supabase/validation/PREMIUM_RELEASE_RUNBOOK.md"), "utf8");
const evidence = fs.readFileSync(path.join(root, "supabase/validation/PREMIUM_RELEASE_EVIDENCE.md"), "utf8");
const required = [
  "20261102_capacity_configuration.sql",
  "20261102_case_capacity_guard.sql",
  "20261103_staff_capacity_guard.sql",
  "20261102_quote_request_sales_classification.sql",
  "20261103_quote_repeat_guard.sql",
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
assert(runbook.includes("Do not replay the superseded grant"), "runbook must exclude superseded intake migrations");
assert(runbook.includes("Retain the existing intake RPC, quota, grants, and RLS"), "rollback must retain live intake protections");
assert(evidence.includes("BLOCKED") || evidence.includes("NOT AUTHORIZED"), "release evidence must retain blocked status");
// Reject any release migration that grants direct intake INSERT.
const migrationDir = path.join(root, "supabase/migrations");
for (const name of fs.readdirSync(migrationDir).filter((file) => file.endsWith(".sql"))) {
  const sql = fs.readFileSync(path.join(migrationDir, name), "utf8")
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .toLowerCase();
  if (/grant\s+(?:all(?:\s+privileges)?|[^;]*\binsert\b)[^;]*\bon\s+(?:table\s+)?(?:public\.)?demo_requests\s+to\s+[^;]*\b(?:anon|authenticated|public|service_role)\b/.test(sql)) {
    throw new Error("Release sequence: migration regrants direct intake INSERT: " + name);
  }
}
console.log("PASS: staged migration order, rollback warnings, and release block");
