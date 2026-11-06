import {
  checkCapacity,
  classifyLegacySubscription,
  getPackage,
  type CapacityDecision,
  type PackageId,
} from "./billing-packages";

/**
 * Pure entitlement resolution. This module does not grant access or write to
 * Stripe/Supabase. Callers must use server-verified billing records.
 */
export type VerifiedBillingRecord = {
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeBasePriceId: string | null;
  licensedOrganizationalUsers: number | null;
  contractedActiveCaseLimit?: number | null;
};

export type ResolvedEntitlements =
  | { kind: "unconfigured"; reason: string }
  | {
      kind: "configured";
      packageId: PackageId;
      billingStatus: string;
      staffLimit: number;
      activeCaseLimit: number | null;
      enforcementReady: boolean;
    };

const BILLABLE_STATUSES = new Set(["active", "trialing"]);

export function resolveEntitlements(
  billing: VerifiedBillingRecord | null,
  existingStandardPriceId: string | null
): ResolvedEntitlements {
  if (!billing?.stripeSubscriptionId) {
    return { kind: "unconfigured", reason: "No verified subscription" };
  }
  const status = (billing.stripeSubscriptionStatus ?? "").toLowerCase();
  if (!BILLABLE_STATUSES.has(status)) {
    return { kind: "unconfigured", reason: "Subscription is not active or trialing" };
  }

  const legacy = classifyLegacySubscription({
    stripeSubscriptionId: billing.stripeSubscriptionId,
    stripeBasePriceId: billing.stripeBasePriceId,
    existingStandardPriceId,
  });

  // Only the existing verified Standard price is recognized until new
  // Stripe price mappings have been explicitly approved and implemented.
  if (!legacy) {
    return { kind: "unconfigured", reason: "Subscription price is not a verified package" };
  }
  const packageId = legacy;

  const packageDefinition = getPackage(packageId);
  const seats = billing.licensedOrganizationalUsers;
  if (!Number.isSafeInteger(seats) || seats === null || seats < 1) {
    return { kind: "unconfigured", reason: "Invalid licensed staff capacity" };
  }

  const contractedCaseLimit = billing.contractedActiveCaseLimit;
  const activeCaseLimit =
    typeof contractedCaseLimit === "number" &&
    Number.isSafeInteger(contractedCaseLimit) &&
    contractedCaseLimit >= 0
      ? contractedCaseLimit
      : packageDefinition.activeCaseLimit;

  return {
    kind: "configured",
    packageId,
    billingStatus: status,
    staffLimit: seats,
    activeCaseLimit,
    // A null case limit is unresolved, not unlimited.
    enforcementReady: activeCaseLimit !== null,
  };
}

export function checkStaffEntitlement(
  entitlements: ResolvedEntitlements,
  currentActiveStaff: number,
  additionalStaff = 1
): CapacityDecision {
  if (entitlements.kind !== "configured") {
    return { allowed: false, reason: "not_configured" };
  }
  return checkCapacity(currentActiveStaff, additionalStaff, entitlements.staffLimit);
}

export function checkActiveCaseEntitlement(
  entitlements: ResolvedEntitlements,
  currentActiveCases: number,
  additionalCases = 1
): CapacityDecision {
  if (entitlements.kind !== "configured") {
    return { allowed: false, reason: "not_configured" };
  }
  return checkCapacity(currentActiveCases, additionalCases, entitlements.activeCaseLimit);
}
