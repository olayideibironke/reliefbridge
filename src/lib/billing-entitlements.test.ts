import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkCapacity, classifyLegacySubscription } from "./billing-packages";
import {
  checkActiveCaseEntitlement,
  checkStaffEntitlement,
  resolveEntitlements,
  type VerifiedBillingRecord,
} from "./billing-entitlements";

const STANDARD_PRICE = "price_existing_standard";
const standard: VerifiedBillingRecord = {
  stripeSubscriptionId: "sub_existing",
  stripeSubscriptionStatus: "active",
  stripeBasePriceId: STANDARD_PRICE,
  licensedOrganizationalUsers: 15,
};

test("existing verified Standard subscription resolves without a case cap", () => {
  const result = resolveEntitlements(standard, STANDARD_PRICE);
  assert.equal(result.kind, "configured");
  if (result.kind !== "configured") return;
  assert.equal(result.packageId, "standard");
  assert.equal(result.staffLimit, 15);
  assert.equal(result.activeCaseLimit, null);
  assert.equal(result.enforcementReady, false);
  assert.deepEqual(checkStaffEntitlement(result, 14), { allowed: true });
  assert.deepEqual(checkStaffEntitlement(result, 15), {
    allowed: false,
    reason: "capacity_exceeded",
  });
  assert.deepEqual(checkActiveCaseEntitlement(result, 0), {
    allowed: false,
    reason: "not_configured",
  });
});

test("explicit approved case cap is enforced at boundary", () => {
  const result = resolveEntitlements({ ...standard, contractedActiveCaseLimit: 70 }, STANDARD_PRICE);
  assert.equal(result.kind, "configured");
  if (result.kind !== "configured") return;
  assert.equal(result.enforcementReady, true);
  assert.deepEqual(checkActiveCaseEntitlement(result, 69), { allowed: true });
  assert.deepEqual(checkActiveCaseEntitlement(result, 70), {
    allowed: false,
    reason: "capacity_exceeded",
  });
});

test("inactive, canceled, unverified, and absent subscriptions cannot resolve", () => {
  for (const record of [
    null,
    { ...standard, stripeSubscriptionId: null },
    { ...standard, stripeSubscriptionStatus: "canceled" },
    { ...standard, stripeSubscriptionStatus: "past_due" },
    { ...standard, stripeBasePriceId: "price_unverified" },
  ]) {
    assert.equal(resolveEntitlements(record, STANDARD_PRICE).kind, "unconfigured");
  }
});

test("bad staff limits and invalid case limits never expand capacity", () => {
  assert.equal(resolveEntitlements({ ...standard, licensedOrganizationalUsers: 0 }, STANDARD_PRICE).kind, "unconfigured");
  const result = resolveEntitlements({ ...standard, contractedActiveCaseLimit: -1 }, STANDARD_PRICE);
  assert.equal(result.kind, "configured");
  if (result.kind === "configured") assert.equal(result.activeCaseLimit, null);
});

test("capacity validation rejects invalid counts and respects exact limits", () => {
  assert.deepEqual(checkCapacity(2, 1, 3), { allowed: true });
  assert.deepEqual(checkCapacity(3, 1, 3), { allowed: false, reason: "capacity_exceeded" });
  assert.deepEqual(checkCapacity(-1, 1, 3), { allowed: false, reason: "not_configured" });
  assert.deepEqual(checkCapacity(1, 1, null), { allowed: false, reason: "not_configured" });
  assert.equal(classifyLegacySubscription({
    stripeSubscriptionId: "sub_existing",
    stripeBasePriceId: STANDARD_PRICE,
    existingStandardPriceId: STANDARD_PRICE,
  }), "standard");
});

test("staff capacity uses purchased seats rather than package included seats", () => {
  const result = resolveEntitlements({ ...standard, licensedOrganizationalUsers: 18 }, STANDARD_PRICE);
  assert.equal(result.kind, "configured");
  if (result.kind !== "configured") return;
  assert.equal(result.staffLimit, 18);
  assert.deepEqual(checkStaffEntitlement(result, 17), { allowed: true });
  assert.deepEqual(checkStaffEntitlement(result, 18), { allowed: false, reason: "capacity_exceeded" });
});

test("no subscription status normalization can activate an unknown status", () => {
  for (const status of ["checkout_pending", "incomplete", "unpaid", "paused", "not_configured", ""]) {
    assert.equal(resolveEntitlements({ ...standard, stripeSubscriptionStatus: status }, STANDARD_PRICE).kind, "unconfigured");
  }
});

test("case cap zero prohibits new active cases", () => {
  const result = resolveEntitlements({ ...standard, contractedActiveCaseLimit: 0 }, STANDARD_PRICE);
  assert.equal(result.kind, "configured");
  if (result.kind !== "configured") return;
  assert.deepEqual(checkActiveCaseEntitlement(result, 0), { allowed: false, reason: "capacity_exceeded" });
});

test("capacity comparison stays safe at maximum integer boundaries", () => {
  assert.deepEqual(checkCapacity(Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER), {
    allowed: false, reason: "capacity_exceeded",
  });
  assert.deepEqual(checkCapacity(Number.MAX_SAFE_INTEGER - 1, 1, Number.MAX_SAFE_INTEGER), { allowed: true });
});
