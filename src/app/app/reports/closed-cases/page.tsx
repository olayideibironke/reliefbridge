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
import type { RecoveryCase, Survivor } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Closed cases report — ReliefBridge" };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function countClosedInLast30Days(
  rows: Array<{ closed_at: string | null }>
): number {
  const cutoff = new Date().getTime() - THIRTY_DAYS_MS;
  let n = 0;
  for (const r of rows) {
    if (!r.closed_at) continue;
    if (new Date(r.closed_at).getTime() >= cutoff) n += 1;
  }
  return n;
}

export default async function ClosedCasesReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000000";

  const { data } = await supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, closed_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )"
    )
    .eq("organization_id", orgId)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(500);

  type Row = Pick<
    RecoveryCase,
    "id" | "priority" | "status" | "primary_need" | "disaster_type" | "opened_at" | "closed_at"
  > & {
    survivors: Pick<Survivor, "id" | "first_name" | "last_name" | "state"> | null;
  };
  const rows = ((data ?? []) as unknown) as Row[];

  const total = rows.length;
  const durations = rows
    .filter((r) => r.closed_at && r.opened_at)
    .map(
      (r) =>
        (new Date(r.closed_at!).getTime() - new Date(r.opened_at).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    .filter((n) => Number.isFinite(n) && n >= 0);
  const avgDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const medianDays = durations.length
    ? Math.round(
        [...durations].sort((a, b) => a - b)[Math.floor(durations.length / 2)]
      )
    : 0;

  const last30 = countClosedInLast30Days(rows);

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
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCard label="Total closed" value={total} hint="Across all time" />
          <KpiCard label="Closed in last 30 days" value={last30} hint="Recent throughput" />
          <KpiCard label="Avg time to close" value={`${avgDays} d`} hint="Open to closed" />
          <KpiCard label="Median time to close" value={`${medianDays} d`} hint="Resilient to outliers" />
        </div>

        <Card>
          <CardHeader title="Closed cases" subtitle="Most recently closed first" />
          {rows.length === 0 ? (
            <EmptyState
              className="m-5"
              icon={<Icons.CircleCheck className="h-7 w-7" />}
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
                {rows.slice(0, 60).map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(c.survivors?.first_name, c.survivors?.last_name)}
                      </Link>
                    </Td>
                    <Td>{c.disaster_type ?? "—"}</Td>
                    <Td>{c.primary_need ?? "—"}</Td>
                    <Td>
                      <PriorityBadge priority={c.priority} />
                    </Td>
                    <Td>
                      <CaseStatusBadge status={c.status} />
                    </Td>
                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {formatDate(c.closed_at)}
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
        <div className="text-[12px] font-semibold text-ink-3">{label}</div>
        <div className="rb-numerals mt-2 text-[34px] font-black tracking-tight text-navy">
          {value}
        </div>
        {hint && <div className="mt-1 text-[12px] text-ink-3">{hint}</div>}
      </CardBody>
    </Card>
  );
}
