import { LABELS } from "@/lib/constants";
import type {
  CaseStatus,
  NeedStatus,
  Priority,
  ProfileRole,
  SurvivorStatus,
} from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFmt.format(d);
}

export function relativeDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < hour) return `${Math.max(1, Math.round(diff / min))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.round(diff / day)}d ago`;
  if (diff < 30 * day) return `${Math.round(diff / (7 * day))}w ago`;
  return formatDate(value);
}

export function labelPriority(p: Priority | null | undefined) {
  return p ? LABELS.priority[p] : "—";
}

export function labelCaseStatus(s: CaseStatus | null | undefined) {
  return s ? LABELS.caseStatus[s] : "—";
}

export function labelSurvivorStatus(s: SurvivorStatus | null | undefined) {
  return s ? LABELS.survivorStatus[s] : "—";
}

export function labelNeedStatus(s: NeedStatus | null | undefined) {
  return s ? LABELS.needStatus[s] : "—";
}

export function labelRole(r: ProfileRole | null | undefined) {
  return r ? LABELS.role[r] : "—";
}

export function fullName(
  first: string | null | undefined,
  last: string | null | undefined
) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  return [f, l].filter(Boolean).join(" ") || "Unnamed";
}
