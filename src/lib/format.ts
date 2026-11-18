import type { ReliefBridgeLocale } from "@/lib/i18n";
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

export function formatDate(value: string | null | undefined, locale: ReliefBridgeLocale = "en") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return locale === "en" ? dateFmt.format(d) : new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

export function formatDateTime(value: string | null | undefined, locale: ReliefBridgeLocale = "en") {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return locale === "en" ? dateTimeFmt.format(d) : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function relativeDate(value: string | null | undefined, locale: ReliefBridgeLocale = "en"): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (locale !== "en") {
    const relative = new Intl.RelativeTimeFormat(locale);
    if (diff < hour) return relative.format(-Math.max(1, Math.round(diff / min)), "minute");
    if (diff < day) return relative.format(-Math.round(diff / hour), "hour");
    if (diff < 7 * day) return relative.format(-Math.round(diff / day), "day");
    if (diff < 30 * day) return relative.format(-Math.round(diff / (7 * day)), "week");
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
  }
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
