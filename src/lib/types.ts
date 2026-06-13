export type OrgType =
  | "LTRG"
  | "VOAD"
  | "Nonprofit"
  | "Church"
  | "County"
  | "State"
  | "Housing Partner"
  | "Legal Aid"
  | "Mental Health"
  | "Volunteer Group";

export type NeedCategory =
  | "Housing"
  | "Repair"
  | "Transportation"
  | "Food"
  | "Mental Health"
  | "Legal Aid"
  | "Child Care"
  | "Medical"
  | "Utilities";

export type Priority = "low" | "medium" | "high";

export type SurvivorStatus = "active" | "closed" | "referred_out" | "duplicate";

export type CaseStatus = "open" | "in_review" | "follow_up" | "on_hold" | "closed";

export type NeedStatus = "open" | "in_progress" | "met" | "unable_to_meet";

export type ReferralStatus =
  | "Pending"
  | "Accepted"
  | "In Progress"
  | "Completed"
  | "Declined";

export type ProfileRole = "owner" | "admin" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  city: string | null;
  state: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  title: string | null;
  role: ProfileRole;
  phone: string | null;
  notification_settings: {
    new_case: boolean;
    new_referral: boolean;
    referral_status_change: boolean;
    weekly_digest: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Survivor {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  disaster_event: string | null;
  county: string | null;
  state: string | null;
  status: SurvivorStatus;
  assigned_case_manager: string | null;
  household_size: number | null;
  notes: string | null;
  consent_given: boolean;
  consent_given_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryCase {
  id: string;
  organization_id: string;
  survivor_id: string;
  case_manager: string | null;
  disaster_type: string | null;
  priority: Priority;
  status: CaseStatus;
  primary_need: string | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseNote {
  id: string;
  organization_id: string;
  case_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface UnmetNeed {
  id: string;
  organization_id: string;
  survivor_id: string;
  category: NeedCategory;
  description: string;
  priority: Priority;
  status: NeedStatus;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  survivor_id: string;
  sending_org: string;
  receiving_org: string;
  category: NeedCategory;
  status: ReferralStatus;
  notes: string | null;
  responded_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
