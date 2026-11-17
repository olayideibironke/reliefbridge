const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const dictionary = read("src/lib/i18n.ts");
const demoForm = read("src/app/app/demo-hub/CreateDemoForm.tsx");
const demoActions = read("src/app/app/demo-hub/actions.ts");
const edge = read("supabase/functions/demo-admin/index.ts");
const migration = read("supabase/validation/DEMO_I18N_STAGING_SQL.sql");

function keysFor(locale, nextLocale) {
  const start = dictionary.indexOf("  " + locale + ": {", dictionary.indexOf("export const translations"));
  assert.ok(start >= 0, "Missing locale: " + locale);
  const end = nextLocale
    ? dictionary.indexOf("  " + nextLocale + ": {", start + 1)
    : dictionary.indexOf("\n} as const;", start);
  assert.ok(end > start, "Missing dictionary boundary: " + locale);
  const matches = [...dictionary.slice(start, end).matchAll(/^    ([A-Za-z][A-Za-z0-9]*):/gm)].map((match) => match[1]);
  assert.equal(matches.length, new Set(matches).size, "Duplicate translation keys in " + locale);
  return matches.sort();
}

const en = keysFor("en", "es");
assert.deepEqual(keysFor("es", "fr"), en, "Spanish translation keys differ from English");
assert.deepEqual(keysFor("fr"), en, "French translation keys differ from English");
assert.ok(demoForm.includes('PR: ["San Juan"'), "Puerto Rico cities missing");
assert.ok(demoForm.includes('PR:"Puerto Rico"'), "Puerto Rico territory missing");
assert.ok(demoForm.includes('setPreferredLocale("es")'), "Puerto Rico Spanish default missing");
assert.ok(demoActions.includes("preferred_locale }),"), "Demo language not sent to provisioning");
assert.ok(demoActions.includes("preferred_locale },") || demoActions.includes("expires_at: data.expires_at, preferred_locale"), "Issued demo language not preserved");
assert.ok(demoForm.includes('state.credentials?.preferred_locale ?? "en"'), "Copied login language not tied to issued credentials");
assert.ok(edge.includes("preferred_locale:preferredLocale"), "Edge function does not persist preferred locale");
assert.ok(edge.includes("sendInvitation(contactEmail,contactName,organizationName,loginEmail,generatedPassword,expiresAt,preferredLocale)"), "Invitation locale not passed");
assert.ok(edge.includes("login?lang=${locale}"), "Localized login URL missing");
assert.ok(migration.includes("preferred_locale IN ('en', 'es', 'fr')"), "Database locale constraint missing");
console.log("Spanish demo static contract checks passed (" + en.length + " keys per language).");
