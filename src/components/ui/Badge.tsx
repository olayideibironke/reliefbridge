import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type {
  CaseStatus,
  NeedStatus,
  Priority,
  ReferralStatus,
  SurvivorStatus,
} from "@/lib/types";

type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "navy";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-3 text-ink-2",
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  amber: "bg-[#FBF1D8] text-gold-dark",
  red: "bg-red-soft text-red",
  navy: "bg-navy text-white",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-[11.5px] font-semibold",
        toneClasses[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

const caseTone: Record<CaseStatus, Tone> = {
  open: "green",
  in_review: "blue",
  follow_up: "amber",
  on_hold: "neutral",
  closed: "neutral",
};

const survivorTone: Record<SurvivorStatus, Tone> = {
  active: "green",
  closed: "neutral",
  referred_out: "blue",
  duplicate: "amber",
};

const needTone: Record<NeedStatus, Tone> = {
  open: "amber",
  in_progress: "blue",
  met: "green",
  unable_to_meet: "red",
};

const referralTone: Record<ReferralStatus, Tone> = {
  Pending: "amber",
  Accepted: "blue",
  "In Progress": "blue",
  Completed: "green",
  Declined: "red",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const label = {
    open: "Open",
    in_review: "In Review",
    follow_up: "Follow-up",
    on_hold: "On Hold",
    closed: "Closed",
  }[status];
  return (
    <Badge tone={caseTone[status]} dot>
      {label}
    </Badge>
  );
}

export function SurvivorStatusBadge({ status }: { status: SurvivorStatus }) {
  const label = {
    active: "Active",
    closed: "Closed",
    referred_out: "Referred out",
    duplicate: "Duplicate",
  }[status];
  return (
    <Badge tone={survivorTone[status]} dot>
      {label}
    </Badge>
  );
}

export function NeedStatusBadge({ status }: { status: NeedStatus }) {
  const label = {
    open: "Open",
    in_progress: "In Progress",
    met: "Met",
    unable_to_meet: "Unable to meet",
  }[status];
  return (
    <Badge tone={needTone[status]} dot>
      {label}
    </Badge>
  );
}

export function ReferralStatusBadge({ status }: { status: ReferralStatus }) {
  return (
    <Badge tone={referralTone[status]} dot>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const label = { low: "Low", medium: "Medium", high: "High" }[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-semibold",
        priority === "high"
          ? "text-red"
          : priority === "medium"
          ? "text-gold-dark"
          : "text-ink-3"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
