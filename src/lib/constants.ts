import type {
  CaseStatus,
  NeedCategory,
  NeedStatus,
  OrgType,
  Priority,
  ProfileRole,
  ReferralStatus,
  SurvivorStatus,
} from "@/lib/types";

export const ORG_TYPES: OrgType[] = [
  "LTRG",
  "VOAD",
  "Nonprofit",
  "Church",
  "County",
  "State",
  "Housing Partner",
  "Legal Aid",
  "Mental Health",
  "Volunteer Group",
];

export const NEED_CATEGORIES: NeedCategory[] = [
  "Housing",
  "Repair",
  "Transportation",
  "Food",
  "Mental Health",
  "Legal Aid",
  "Child Care",
  "Medical",
  "Utilities",
];

export const PRIORITIES: Priority[] = ["low", "medium", "high"];

export const SURVIVOR_STATUSES: SurvivorStatus[] = [
  "active",
  "closed",
  "referred_out",
  "duplicate",
];

export const CASE_STATUSES: CaseStatus[] = [
  "open",
  "in_review",
  "follow_up",
  "on_hold",
  "closed",
];

export const NEED_STATUSES: NeedStatus[] = [
  "open",
  "in_progress",
  "met",
  "unable_to_meet",
];

export const REFERRAL_STATUSES: ReferralStatus[] = [
  "Pending",
  "Accepted",
  "In Progress",
  "Completed",
  "Declined",
];

export const PROFILE_ROLES: ProfileRole[] = ["owner", "admin", "member", "viewer"];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR",
];

export const LABELS = {
  priority: {
    low: "Low",
    medium: "Medium",
    high: "High",
  } as const,
  caseStatus: {
    open: "Open",
    in_review: "In Review",
    follow_up: "Follow-up",
    on_hold: "On Hold",
    closed: "Closed",
  } as const,
  survivorStatus: {
    active: "Active",
    closed: "Closed",
    referred_out: "Referred out",
    duplicate: "Duplicate",
  } as const,
  needStatus: {
    open: "Open",
    in_progress: "In Progress",
    met: "Met",
    unable_to_meet: "Unable to meet",
  } as const,
  role: {
    owner: "Owner",
    admin: "Administrator",
    member: "Member",
    viewer: "Viewer",
  } as const,
};
