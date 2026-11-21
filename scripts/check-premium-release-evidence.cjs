#!/usr/bin/env node
// Static release-documentation guard. This cannot prove staging execution or approval.
const fs = require('node:fs');
const evidence = fs.readFileSync('supabase/validation/PREMIUM_RELEASE_EVIDENCE.md', 'utf8');
const runbook = fs.readFileSync('supabase/validation/PREMIUM_RELEASE_RUNBOOK.md', 'utf8');
const required = [
  'Full-schema staging migration rehearsal',
  'Original sales-sync trigger/function snapshot',
  'Staging rollback and restore rehearsal',
  'Real anonymous quote/demo E2E',
  'Staging before/after sales-integrity audit',
  'Staging capacity opt-in, transfers and concurrency',
  'Stripe Standard grandfathering smoke test',
  'Browser/mobile/keyboard/screen-reader QA',
  'Edge abuse controls and operational monitoring',
  'Explicit production release approval',
];
function fail(message) { console.error('Release evidence guard: ' + message); process.exitCode = 1; }
if (!/\*\*Release status: BLOCKED\.\*\*/.test(evidence)) fail('Release must remain explicitly BLOCKED until independently approved');
for (const gate of required) {
  const row = evidence.split('\n').find(line => line.startsWith('| ' + gate + ' |'));
  if (!row) { fail('Missing required release gate: ' + gate); continue; }
  const status = row.split('|')[2]?.trim();
  if (!['NOT RUN', 'NOT VERIFIED', 'NOT CAPTURED FOR RELEASE', 'NOT GRANTED', 'BLOCKED', 'FAIL'].includes(status)) {
    fail('Gate unexpectedly marked ' + status + ' without independent verification: ' + gate);
  }
}
if (!runbook.includes('PREMIUM_RELEASE_EVIDENCE.md')) fail('Runbook must reference release evidence register');
if (!runbook.includes('separate explicit approval')) fail('Runbook must require separate explicit production approval');
if (!runbook.includes('full-schema staging rehearsal')) fail('Runbook must require full-schema staging rehearsal');
if (!process.exitCode) console.log('PASS: release evidence gate coverage and blocked status are consistent');
