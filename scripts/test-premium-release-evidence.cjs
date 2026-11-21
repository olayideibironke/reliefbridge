#!/usr/bin/env node
// Verify the release guard fails closed when critical documentation is altered.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const evidence = fs.readFileSync(path.join(root,'supabase/validation/PREMIUM_RELEASE_EVIDENCE.md'),'utf8');
const runbook = fs.readFileSync(path.join(root,'supabase/validation/PREMIUM_RELEASE_RUNBOOK.md'),'utf8');
const script = path.join(root,'scripts/check-premium-release-evidence.cjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'reliefbridge-release-guard-'));
function run(e, r) {
  const dir = path.join(tmp,'supabase/validation');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'PREMIUM_RELEASE_EVIDENCE.md'),e);
  fs.writeFileSync(path.join(dir,'PREMIUM_RELEASE_RUNBOOK.md'),r);
  return spawnSync(process.execPath,[script],{cwd:tmp,encoding:'utf8'});
}
try {
  assert.equal(run(evidence,runbook).status,0,'Unmodified release documentation must pass');
  assert.notEqual(run(evidence.replace('Release status: BLOCKED.','Release status: APPROVED.'),runbook).status,0,'Approval cannot be inferred by editing documentation');
  assert.notEqual(run(evidence.replace('| Full-schema staging migration rehearsal |','| Removed staging migration rehearsal |'),runbook).status,0,'Missing staging gate must fail');
  assert.notEqual(run(evidence.replace('| Explicit production release approval | NOT GRANTED |','| Explicit production release approval | PASS |'),runbook).status,0,'Unverified approval must fail');
  assert.notEqual(run(evidence,runbook.replace('PREMIUM_RELEASE_EVIDENCE.md','missing-register.md')).status,0,'Missing runbook evidence link must fail');
  console.log('PASS: release evidence guard rejects unapproved release, missing gate, forged approval and missing linkage');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
