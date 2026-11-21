/**
 * Capacity accounting rules for ReliefBridge organizational subscriptions.
 * These are pure helpers only. Enforcement must be atomic in PostgreSQL.
 */
export const ACTIVE_CASE_STATUSES = ["open", "in_review", "follow_up", "on_hold"] as const;

export function countsTowardActiveCaseLimit(status: string): boolean {
  return ACTIVE_CASE_STATUSES.some((candidate) => candidate === status);
}

/**
 * Whether a case mutation increases the active-case count.
 * Case creation and reopening consume capacity; edits of already-active
 * cases and closing a case do not.
 */
export function increasesActiveCaseCount(
  previousStatus: string | null,
  nextStatus: string
): boolean {
  return countsTowardActiveCaseLimit(nextStatus) &&
    (previousStatus === null || !countsTowardActiveCaseLimit(previousStatus));
}

/**
 * Do not enable limits for existing organizations until a verified
 * contractual cap has been approved and explicitly activated.
 */
export function canActivateCaseLimit(
  approvedLimit: number | null,
  explicitlyEnabled: boolean
): boolean {
  return explicitlyEnabled &&
    approvedLimit !== null &&
    Number.isSafeInteger(approvedLimit) &&
    approvedLimit >= 0;
}

/**
 * An organization transfer of an already-active case consumes capacity in
 * the destination organization, even when the case status stays unchanged.
 */
export function increasesOrganizationActiveCaseCount(
  previousStatus: string | null,
  nextStatus: string,
  previousOrganizationId: string | null,
  nextOrganizationId: string
): boolean {
  return countsTowardActiveCaseLimit(nextStatus) &&
    (previousStatus === null ||
      !countsTowardActiveCaseLimit(previousStatus) ||
      previousOrganizationId !== nextOrganizationId);
}
