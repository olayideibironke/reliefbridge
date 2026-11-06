const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");

const root = path.resolve(__dirname, "..");
const check = path.join(root, "scripts/check-public-intake-boundary.cjs");
const fixtures = [
  ["src/app/request-demo/actions.ts", (s) => s.replace("await persistPublicIntake(", "await bypassIntake(")],
  ["src/app/request-quote/actions.ts", (s) => s.replace('import { persistPublicIntake } from "@/lib/public-intake";', 'import { bypassIntake } from "@/lib/public-intake";')],
  ["src/lib/public-intake.ts", (s) => s.replace('import "server-only";', "")],
  ["supabase/migrations/20261105_public_intake_insert_lockdown.sql", (s) => s.replace("revoke insert on table public.demo_requests from anon;", "-- intentionally removed by test")],
  ["supabase/migrations/20261105_public_intake_rate_guard.sql", (s) => s.replace("new.source is distinct from 'Website'", "false")],
];
for (const [target, mutate] of fixtures) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "rb-boundary-"));
  try {
    for (const file of ["src/app/request-demo/actions.ts", "src/app/request-quote/actions.ts", "src/lib/public-intake.ts", "src/lib/supabase-admin.ts", "supabase/migrations/20261105_public_intake_insert_lockdown.sql", "supabase/migrations/20261105_public_intake_rate_guard.sql"]) {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      const changed = file === target ? mutate(source) : source;
      if (file === target && changed === source) throw new Error("Mutation did not change " + file);
      const output = path.join(temp, file);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, changed);
    }
    fs.mkdirSync(path.join(temp, "scripts"), { recursive: true });
    fs.copyFileSync(check, path.join(temp, "scripts/check-public-intake-boundary.cjs"));
    const result = cp.spawnSync(process.execPath, [path.join(temp, "scripts/check-public-intake-boundary.cjs")], { encoding: "utf8" });
    if (result.status === 0 || !String(result.stderr).includes("Public intake boundary:")) {
      throw new Error("Security guard did not reject mutation in " + target + ": " + result.stdout + result.stderr);
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
console.log("PASS: public intake security guard rejects five unsafe mutations");
