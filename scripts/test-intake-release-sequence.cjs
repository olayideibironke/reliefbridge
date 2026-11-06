const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "rb-release-"));
try {
  for (const file of [
    "scripts/check-intake-release-sequence.cjs",
    "supabase/validation/PREMIUM_RELEASE_RUNBOOK.md",
    "supabase/validation/PREMIUM_RELEASE_EVIDENCE.md",
    "supabase/migrations/20261102_capacity_configuration.sql",
    "supabase/migrations/20261102_case_capacity_guard.sql",
    "supabase/migrations/20261103_staff_capacity_guard.sql",
    "supabase/migrations/20261102_quote_request_sales_classification.sql",
    "supabase/migrations/20261103_quote_repeat_guard.sql",
    "supabase/migrations/20261105_public_intake_rate_guard.sql",
    "supabase/migrations/20261105_public_intake_insert_lockdown.sql",
  ]) {
    const target = path.join(temp, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  const run = () => cp.spawnSync(process.execPath, [path.join(temp, "scripts/check-intake-release-sequence.cjs")], { encoding: "utf8" });
  const baseline = run();
  if (baseline.status !== 0) throw new Error("Baseline release gate failed: " + baseline.stderr);
  const malicious = path.join(temp, "supabase/migrations/20261106_reopen_intake.sql");
  for (const sql of [
    "GRANT INSERT ON TABLE public.demo_requests TO anon;",
    "grant select, insert on public.demo_requests to authenticated;",
    "GRANT ALL PRIVILEGES ON TABLE public.demo_requests TO PUBLIC;",
  ]) {
    fs.writeFileSync(malicious, sql);
    const result = run();
    if (result.status === 0 || !result.stderr.includes("regrants public intake INSERT")) {
      throw new Error("Release gate failed to detect unsafe migration: " + sql + "\n" + result.stderr);
    }
  }
  fs.writeFileSync(malicious, "-- GRANT INSERT ON TABLE public.demo_requests TO anon;\nGRANT SELECT ON TABLE public.demo_requests TO authenticated;");
  const safe = run();
  if (safe.status !== 0) throw new Error("Safe migration was rejected: " + safe.stderr);
  console.log("PASS: release gate rejects three unsafe grants and accepts commented/safe SQL");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
