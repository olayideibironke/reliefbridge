/**
 * ReliefBridge commercial package catalog.
 *
 * No checkout or access-control code should infer an entitlement from a
 * marketing selection. Only verified organization billing records can grant
 * paid access. Starter and Growth prices/case caps remain unapproved.
 */
export const PACKAGE_IDS = ["starter", "growth", "standard", "enterprise"] as const;
export type PackageId = (typeof PACKAGE_IDS)[number];

export type PackageDefinition = {
  id: PackageId;
  name: string;
  includedStaff: number | null;
  activeCaseLimit: number | null;
  quoteRequired: boolean;
  selfServiceCheckoutEnabled: boolean;
};

export const PACKAGES: Readonly<Record<PackageId, Readonly<PackageDefinition>>> = {
  starter: {
    id: "starter",
    name: "Recovery Starter",
    includedStaff: 2,
    activeCaseLimit: null,
    quoteRequired: true,
    selfServiceCheckoutEnabled: false,
  },
  growth: {
    id: "growth",
    name: "Recovery Growth",
    includedStaff: 3,
    activeCaseLimit: null,
    quoteRequired: true,
    selfServiceCheckoutEnabled: false,
  },
  standard: {
    id: "standard",
    name: "ReliefBridge Standard",
    includedStaff: 15,
    activeCaseLimit: null,
    quoteRequired: true,
    selfServiceCheckoutEnabled: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise & Multi-agency",
    includedStaff: null,
    activeCaseLimit: null,
    quoteRequired: true,
    selfServiceCheckoutEnabled: false,
  },
} as const;

export function isPackageId(value: unknown): value is PackageId {
  return typeof value === "string" && PACKAGE_IDS.some(id => id === value);
}

export function getPackage(id: PackageId): Readonly<PackageDefinition> {
  return PACKAGES[id];
}

/**
 * Existing subscriptions remain Standard unless a verified future
 * subscription mapping explicitly identifies another package.
 * Never use this fallback to create new paid access.
 */
export function classifyLegacySubscription(input: {
  stripeSubscriptionId: string | null | undefined;
  stripeBasePriceId: string | null | undefined;
  existingStandardPriceId: string | null | undefined;
}): PackageId | null {
  if (!input.stripeSubscriptionId) return null;
  if (!input.existingStandardPriceId || !input.stripeBasePriceId) return null;
  return input.stripeBasePriceId === input.existingStandardPriceId ? "standard" : null;
}

export type CapacityDecision =
  | { allowed: true }
  | { allowed: false; reason: "not_configured" | "capacity_exceeded" };

export function checkCapacity(current: number, requestedAdditional: number, limit: number | null): CapacityDecision {
  if (!Number.isSafeInteger(current) || current < 0 || !Number.isSafeInteger(requestedAdditional) || requestedAdditional < 0) {
    return { allowed: false, reason: "not_configured" };
  }
  if (limit === null || !Number.isSafeInteger(limit) || limit < 0) {
    return { allowed: false, reason: "not_configured" };
  }
  return current + requestedAdditional <= limit
    ? { allowed: true }
    : { allowed: false, reason: "capacity_exceeded" };
}
