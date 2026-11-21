const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const demo = fs.readFileSync(path.join(root, "src/app/request-demo/actions.ts"), "utf8");
const quote = fs.readFileSync(path.join(root, "src/app/request-quote/actions.ts"), "utf8");
const intake = fs.readFileSync(path.join(root, "src/lib/website-intake.ts"), "utf8");
const admin = fs.readFileSync(path.join(root, "src/lib/supabase-admin.ts"), "utf8");
const lockdown = fs.readFileSync(path.join(root, "supabase/migrations/2026112002_enforce_server_only_website_intake.sql"), "utf8");
const guard = fs.readFileSync(path.join(root, "supabase/migrations/2026112001_secure_mail_and_prepare_website_intake.sql"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error("Public intake boundary: " + message);
}
for (const [name, content] of [["demo", demo], ["quote", quote]]) {
  assert(content.includes('import { submitWebsiteIntake } from "@/lib/website-intake";'), name + " action must import the shared server-only intake");
  assert(content.includes("await submitWebsiteIntake("), name + " action must call the shared intake");
  assert(!/\.from\s*\(\s*["'`]demo_requests["'`]\s*\)\s*\.insert\s*\(/.test(content), name + " action must not directly INSERT");
  assert(!content.includes("createSupabaseServerClient"), name + " action must not use a cookie-scoped client for public intake");
}
assert(demo.includes('preferredContact === "Phone" && !phone'), "phone contact selection must require a phone number");
assert(demo.includes('/^\\d{10}$/.test(digits)'), "optional phone must validate as ten U.S. digits");
assert(intake.includes('import "server-only";'), "shared intake must be server-only");
assert(intake.includes("createSupabaseAdminClient()"), "shared intake must use a privileged server client");
assert(intake.includes('.rpc("submit_website_intake", { request })'), "shared intake must call the restricted RPC");
assert(!intake.includes('.from("demo_requests")'), "shared intake must not directly INSERT");
assert(admin.includes('import "server-only";'), "admin client must be server-only");
assert(admin.includes("SUPABASE_SERVICE_ROLE_KEY"), "admin client must read the server-only service-role key");
assert(lockdown.includes("revoke insert on table public.demo_requests from public, anon, authenticated;"), "INSERT lockdown must revoke browser access");
assert(guard.includes("pg_advisory_xact_lock"), "rate guard must serialize concurrent inserts");
assert(guard.includes("where source = 'Website'"), "rate guard must count website records only");
assert(guard.includes("'New', 'Website'"), "intake RPC must pin status and source");
assert(guard.includes("revoke all on function public.submit_website_intake(jsonb) from public, anon, authenticated;"), "intake RPC must revoke browser access");
assert(guard.includes("grant execute on function public.submit_website_intake(jsonb) to service_role;"), "intake RPC must grant server access");
console.log("PASS: public intake server-only boundary and SQL invariants");
