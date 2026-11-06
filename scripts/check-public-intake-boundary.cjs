const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const demo = fs.readFileSync(path.join(root, "src/app/request-demo/actions.ts"), "utf8");
const quote = fs.readFileSync(path.join(root, "src/app/request-quote/actions.ts"), "utf8");
const intake = fs.readFileSync(path.join(root, "src/lib/public-intake.ts"), "utf8");
const admin = fs.readFileSync(path.join(root, "src/lib/supabase-admin.ts"), "utf8");
const lockdown = fs.readFileSync(path.join(root, "supabase/migrations/20261105_public_intake_insert_lockdown.sql"), "utf8");
const guard = fs.readFileSync(path.join(root, "supabase/migrations/20261105_public_intake_rate_guard.sql"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error("Public intake boundary: " + message);
}
for (const [name, content] of [["demo", demo], ["quote", quote]]) {
  assert(content.includes('import { persistPublicIntake } from "@/lib/public-intake";'), name + " action must import the shared server-only intake");
  assert(content.includes("await persistPublicIntake("), name + " action must call the shared intake");
  assert(!/\.from\s*\(\s*["'`]demo_requests["'`]\s*\)\s*\.insert\s*\(/.test(content), name + " action must not directly INSERT");
  assert(!content.includes("createSupabaseServerClient"), name + " action must not use a cookie-scoped client for public intake");
}
assert(intake.includes('import "server-only";'), "shared intake must be server-only");
assert(intake.includes("createSupabaseAdminClient()"), "shared intake must use a privileged server client");
assert(intake.includes('status: "New"') && intake.includes('source: "Website"'), "server must pin status and source");
assert(!intake.includes("...payload"), "shared intake must map permitted fields explicitly");
assert(admin.includes("SUPABASE_SERVICE_ROLE_KEY"), "admin client must read the server-only service-role key");
for (const role of ["anon", "authenticated", "public"]) {
  assert(lockdown.includes("from " + role + ";"), "INSERT lockdown must revoke from " + role);
}
assert(guard.includes("pg_advisory_xact_lock"), "rate guard must serialize concurrent inserts");
assert(guard.includes("new.source is distinct from 'Website'"), "rate guard must exempt non-website records");
assert(guard.includes("RB002"), "rate guard must return the documented quota error code");
console.log("PASS: public intake server-only boundary and staged SQL invariants");
