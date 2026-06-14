import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { fullName, formatDate } from "@/lib/format";
import type {
  CaseStatus,
  Priority,
  Survivor,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Closed cases report — ReliefBridge",
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type RawCaseRow = {
  id: string;
  priority: string | null;
  status: string | null;
  primary_need: string | null;
  disaster_type: string | null;
  opened_at: string | null;
  closed_at: string | null;
  survivors: Pick<
    Survivor,
    "id" | "first_name" | "last_name" | "state"
  > | null;
};

type ClosedCaseRow = RawCaseRow & {
  normalizedPriority: Priority;
  normalizedStatus: CaseStatus;
};

function normalizeCaseStatus(value: string | null): CaseStatus {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "closed") {
    return "closed";
  }

  if (normalized === "in_review") {
    return "in_review";
  }

  if (normalized === "follow_up") {
    return "follow_up";
  }

  if (normalized === "on_hold") {
    return "on_hold";
  }

  return "open";
}

function normalizePriority(value: string | null): Priority {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "low") {
    return "low";
  }

  return "medium";
}

function countClosedInLast30Days(
  rows: Array<{ closed_at: string | null }>,
): number {
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  return rows.filter((row) => {
    if (!row.closed_at) {
      return false;
    }

    const closedTime = new Date(row.closed_at).getTime();

    return Number.isFinite(closedTime) && closedTime >= cutoff;
  }).length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round(
      (sorted[middle - 1] + sorted[middle]) / 2,
    );
  }

  return Math.round(sorted[middle]);
}

export default async function ClosedCasesReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const orgId =
    profile.organization_id ??
    "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, closed_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )",
    )
    .eq("organization_id", orgId)
    .order("closed_at", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(500);

  if (error) {
    throw new Error(
      `Could not load closed cases report: ${error.message}`,
    );
  }

  const rows: ClosedCaseRow[] = (
    (data ?? []) as unknown as RawCaseRow[]
  )
    .map((caseRow) => ({
      ...caseRow,
      normalizedPriority: normalizePriority(caseRow.priority),
      normalizedStatus: normalizeCaseStatus(caseRow.status),
    }))
    .filter(
      (caseRow) => caseRow.normalizedStatus === "closed",
    );

  const total = rows.length;

  const durations = rows
    .filter(
      (caseRow) =>
        Boolean(caseRow.opened_at) &&
        Boolean(caseRow.closed_at),
    )
    .map((caseRow) => {
      const openedTime = new Date(
        caseRow.opened_at as string,
      ).getTime();

      const closedTime = new Date(
        caseRow.closed_at as string,
      ).getTime();

      return (closedTime - openedTime) / ONE_DAY_MS;
    })
    .filter(
      (duration) =>
        Number.isFinite(duration) && duration >= 0,
    );

  const averageDays =
    durations.length > 0
      ? Math.round(
          durations.reduce(
            (totalDays, duration) =>
              totalDays + duration,
            0,
          ) / durations.length,
        )
      : 0;

  const medianDays = calculateMedian(durations);
  const closedLast30Days = countClosedInLast30Days(rows);

  return (
    <>
      <PageHeader
        eyebrow="Reports · Outcomes"
        title="Closed recovery cases"
        subtitle="Outcomes and time-to-close for resolved cases."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Closed cases" },
        ]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total closed"
            value={total}
            hint="Across all time"
          />

          <KpiCard
            label="Closed in last 30 days"
            value={closedLast30Days}
            hint="Recent throughput"
          />

          <KpiCard
            label="Avg time to close"
            value={`${averageDays} d`}
            hint="Open to closed"
          />

          <KpiCard
            label="Median time to close"
            value={`${medianDays} d`}
            hint="Resilient to outliers"
          />
        </div>

        <Card>
          <CardHeader
            title="Closed cases"
            subtitle="Most recently closed first"
          />

          {rows.length === 0 ? (
            <EmptyState
              className="m-5"
              icon={
                <Icons.CircleCheck className="h-7 w-7" />
              }
              title="No closed cases yet"
              description="Once you close a recovery case, it shows up here for reporting."
            />
          ) : (
            <DataTable className="rounded-none border-0">
              <THead>
                <Tr>
                  <Th>Survivor</Th>
                  <Th>Event</Th>
                  <Th>Primary need</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th align="right">Closed</Th>
                </Tr>
              </THead>

              <tbody>
                {rows.slice(0, 60).map((caseRow) => (
                  <Tr key={caseRow.id}>
                    <Td>
                      <Link
                        href={`/app/cases/${caseRow.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(
                          caseRow.survivors?.first_name,
                          caseRow.survivors?.last_name,
                        )}
                      </Link>
                    </Td>

                    <Td>
                      {caseRow.disaster_type ?? "—"}
                    </Td>

                    <Td>
                      {caseRow.primary_need ?? "—"}
                    </Td>

                    <Td>
                      <PriorityBadge
                        priority={
                          caseRow.normalizedPriority
                        }
                      />
                    </Td>

                    <Td>
                      <CaseStatusBadge status="closed" />
                    </Td>

                    <Td
                      align="right"
                      className="rb-numerals text-[12.5px] text-ink-3"
                    >
                      {formatDate(caseRow.closed_at)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-[12px] font-semibold text-ink-3">
          {label}
        </div>

        <div className="rb-numerals mt-2 text-[34px] font-black tracking-tight text-navy">
          {value}
        </div>

        {hint && (
          <div className="mt-1 text-[12px] text-ink-3">
            {hint}
          </div>
        )}
      </CardBody>
    </Card>
  );
}