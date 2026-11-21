import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function load(file, imports, globals = {}) {
  const filename = fileURLToPath(new URL("../src/" + file, import.meta.url));
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  runInNewContext(source, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), "Unexpected import: " + name);
      return imports[name];
    },
    ...globals,
  }, { filename });
  return exports;
}

test("quote action sends both emails once and isolates provider failures", async () => {
  const sent = [], logs = [];
  let result = "accepted", failDelivery = false, writes = 0;
  const globals = { console: { error: (...args) => logs.push(args.join(" ")) } };
  const validation = load("lib/quote-form-validation.ts", { "./utils": load("lib/utils.ts", {}) });
  const email = load("lib/quote-request-email.ts", {
    "server-only": {},
    resend: { Resend: class {
      emails = { send: async (message) => {
        assert.ok(writes > 0, "Email must follow the intake write");
        sent.push(message);
        if (!failDelivery) return { error: null };
        if (message.to === "connect@reliefbridge.net") return { error: { message: "private detail" } };
        throw new Error("private detail");
      } };
    } },
  }, { ...globals, process: { env: { RESEND_API_KEY: "mock", RESEND_FROM_EMAIL: "sender@example.test" } } });
  const { requestQuoteAction } = load("app/request-quote/actions.ts", {
    "@/lib/quote-form-validation": validation,
    "@/lib/quote-request-email": email,
    "@/lib/website-intake": { submitWebsiteIntake: async () => { writes++; return result; } },
  }, globals);

  const form = new FormData();
  for (const [key, value] of Object.entries({
    first_name: "Ada", last_name: "Example", work_email: "ADA@example.test",
    organization_name: "Example Recovery", role_title: "Coordinator",
    package: "Recovery Growth", staff_count: "3", active_cases: "0", notes: "Two regions",
  })) form.set(key, value);
  const submit = () => requestQuoteAction({}, form);

  assert.equal((await submit()).ok, true);
  const [admin, requester] = sent;
  assert.equal(sent.length, 2);
  assert.equal(admin.to, "connect@reliefbridge.net");
  assert.equal(admin.replyTo, "ada@example.test");
  assert.match(admin.text, /Ada Example[\s\S]*Example Recovery[\s\S]*ada@example.test[\s\S]*Coordinator[\s\S]*Recovery Growth[\s\S]*staff count: 3[\s\S]*Active cases: 0[\s\S]*Two regions[\s\S]*\/app\/platform\/sales/);
  assert.equal(requester.to, "ada@example.test");
  assert.equal(requester.replyTo, "connect@reliefbridge.net");
  assert.match(requester.text, /received[\s\S]*Example Recovery[\s\S]*Recovery Growth[\s\S]*follow up by email/);

  for (const rejected of ["duplicate", "limited", "unavailable"]) {
    result = rejected;
    await submit();
  }
  form.set("website", "spam");
  await submit();
  form.delete("website");
  form.set("work_email", "invalid");
  assert.equal((await submit()).ok, false);
  assert.equal(writes, 4);
  assert.equal(sent.length, 2);

  result = "accepted";
  failDelivery = true;
  form.set("work_email", "ada@example.test");
  assert.equal((await submit()).ok, true);
  assert.equal(sent.length, 4);
  assert.equal(logs.length, 2);
  assert.doesNotMatch(logs.join("\n"), /private detail|ada@example\.test/);
});
