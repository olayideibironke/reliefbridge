import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { BarRow } from "@/components/reports/BarRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { fullName, relativeDate } from "@/lib/format";
import { LABELS } from "@/lib/constants";
import type {
  CaseStatus,
  Priority,
  Survivor,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Open cases report — ReliefBridge",
};

type RawCaseRow = {
  id: string;
  priority: string | null;
  status: string | null;
  primary_need: string | null;
  disaster_type: string | null;
  opened_at: string;
  survivors: Pick<
    Survivor,
    "id" | "first_name" | "last_name" | "state"
  > | null;
};

type ReportCaseRow = RawCaseRow & {
  normalizedPriority: Priority;
  normalizedStatus: CaseStatus;
};

function normalizeCaseStatus(value: string | null): CaseStatus {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "in_review") {
    return "in_review";
  }

  if (normalized === "follow_up") {
    return "follow_up";
  }

  if (normalized === "on_hold") {
    return "on_hold";
  }

  if (normalized === "closed") {
    return "closed";
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

export default async function OpenCasesReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const orgId =
    profile.organization_id ??
    "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )",
    )
    .eq("organization_id", orgId)
    .order("opened_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Could not load open cases report: ${error.message}`);
  }

  const rows: ReportCaseRow[] = ((data ?? []) as unknown as RawCaseRow[])
    .map((caseRow) => ({
      ...caseRow,
      normalizedPriority: normalizePriority(caseRow.priority),
      normalizedStatus: normalizeCaseStatus(caseRow.status),
    }))
    .filter((caseRow) => caseRow.normalizedStatus !== "closed");

  const total = rows.length;

  const byStatus = new Map<CaseStatus, number>();
  const byPriority = new Map<Priority, number>();

  for (const caseRow of rows) {
    byStatus.set(
      caseRow.normalizedStatus,
      (byStatus.get(caseRow.normalizedStatus) ?? 0) + 1,
    );

    byPriority.set(
      caseRow.normalizedPriority,
      (byPriority.get(caseRow.normalizedPriority) ?? 0) + 1,
    );
  }

  const percentage = (count: number) =>
    total ? Math.round((count / total) * 100) : 0;

  const visibleStatuses: CaseStatus[] = [
    "open",
    "in_review",
    "follow_up",
    "on_hold",
  ];

  const visiblePriorities: Priority[] = [
    "high",
    "medium",
    "low",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reports · Operations"
        title="Open recovery cases"
        subtitle="Active workload distribution across your organization."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Open cases" },
        ]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                Total open
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {total}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                Excludes closed cases
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                High priority
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {byPriority.get("high") ?? 0}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                Survivors needing the most attention now
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                In review
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {byStatus.get("in_review") ?? 0}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                Cases under partner or program review
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="By status" />

            <CardBody>
              {total === 0 ? (
                <div className="text-[13px] text-ink-3">
                  No open cases.
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {visibleStatuses.map((status) => {
                    const count = byStatus.get(status) ?? 0;

                    return (
                      <li key={status}>
                        <BarRow
                          label={LABELS.caseStatus[status]}
                          count={count}
                          pct={percentage(count)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By priority" />

            <CardBody>
              {total === 0 ? (
                <div className="text-[13px] text-ink-3">
                  No open cases.
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {visiblePriorities.map((priority) => {
                    const count = byPriority.get(priority) ?? 0;

                    return (
                      <li key={priority}>
                        <BarRow
                          label={LABELS.priority[priority]}
                          count={count}
                          pct={percentage(count)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Open cases"
            subtitle="All non-closed cases"
          />

          {rows.length === 0 ? (
            <EmptyState
              className="m-5"
              icon={<Icons.Cases className="h-7 w-7" />}
              title="No open cases"
              description="No open recovery cases for this organization."
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
                  <Th align="right">Opened</Th>
                </Tr>
              </THead>

              <tbody>
                {rows.slice(0, 50).map((caseRow) => (
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

                    <Td>{caseRow.disaster_type ?? "—"}</Td>

                    <Td>{caseRow.primary_need ?? "—"}</Td>

                    <Td>
                      <PriorityBadge
                        priority={caseRow.normalizedPriority}
                      />
                    </Td>

                    <Td>
                      <CaseStatusBadge
                        status={caseRow.normalizedStatus}
                      />
                    </Td>

                    <Td
                      align="right"
                      className="rb-numerals text-[12.5px] text-ink-3"
                    >
                      {relativeDate(caseRow.opened_at)}
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