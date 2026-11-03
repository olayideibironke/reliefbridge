import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  ACTIVE_CASE_STATUSES,
  canActivateCaseLimit,
  countsTowardActiveCaseLimit,
  increasesActiveCaseCount,
} from "./case-capacity";

test("all operational case statuses count as active", () => {
  for (const status of ACTIVE_CASE_STATUSES) {
    assert.equal(countsTowardActiveCaseLimit(status), true);
  }
  assert.equal(countsTowardActiveCaseLimit("closed"), false);
  assert.equal(countsTowardActiveCaseLimit("unknown"), false);
});

test("case creation and reopening consume capacity", () => {
  assert.equal(increasesActiveCaseCount(null, "open"), true);
  assert.equal(increasesActiveCaseCount("closed", "follow_up"), true);
  assert.equal(increasesActiveCaseCount("closed", "on_hold"), true);
});

test("ordinary case edits and closing do not consume capacity", () => {
  assert.equal(increasesActiveCaseCount("open", "in_review"), false);
  assert.equal(increasesActiveCaseCount("follow_up", "on_hold"), false);
  assert.equal(increasesActiveCaseCount("open", "closed"), false);
  assert.equal(increasesActiveCaseCount("closed", "closed"), false);
});

test("capacity activation requires an explicit approved safe integer", () => {
  assert.equal(canActivateCaseLimit(null, true), false);
  assert.equal(canActivateCaseLimit(70, false), false);
  assert.equal(canActivateCaseLimit(70, true), true);
  assert.equal(canActivateCaseLimit(0, true), true);
  for (const invalid of [-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(canActivateCaseLimit(invalid, true), false);
  }
});
