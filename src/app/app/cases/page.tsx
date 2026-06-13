import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import {
  CASE_STATUSES,
  LABELS,
  PRIORITIES,
} from "@/lib/constants";
import type {
  CaseStatus,
  Priority,
  RecoveryCase,
  Survivor,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Pick<
  RecoveryCase,
  "id" | "priority" | "status" | "primary_need" | "disaster_type" | "opened_at"
> & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name" | "state"> | null;
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = CASE_STATUSES.includes(sp.status as CaseStatus) ? (sp.status as CaseStatus) : "";
  const priority = PRIORITIES.includes(sp.priority as Priority) ? (sp.priority as Priority) : "";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )"
    )
    .order("opened_at", { ascending: false })
    .limit(250);

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  } else {
    query = query.eq("organization_id", "00000000-0000-0000-0000-000000000000");
  }
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, error } = await query;
  let rows = ((data ?? []) as unknown) as Row[];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) =>
      fullName(r.survivors?.first_name, r.survivors?.last_name)
        .toLowerCase()
        .includes(needle) ||
      (r.primary_need ?? "").toLowerCase().includes(needle) ||
      (r.disaster_type ?? "").toLowerCase().includes(needle)
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Recovery cases"
        subtitle="Every active and closed recovery case across your organization."
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Recovery cases" }]}
        actions={
          <LinkButton href="/app/cases/new">
            <Icons.Plus className="h-4 w-4" />
            New case
          </LinkButton>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[1fr_180px_160px_auto]"
              action="/app/cases"
              method="get"
            >
              <Input
                label="Search"
                name="q"
                placeholder="Survivor name, event, or need"
                defaultValue={q}
              />
              <Select label="Status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.caseStatus[s]}
                  </option>
                ))}
              </Select>
              <Select label="Priority" name="priority" defaultValue={priority}>
                <option value="">All priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {LABELS.priority[p]}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-semibold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  Filter
                </button>
                <Link
                  href="/app/cases"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink-2 hover:border-blue hover:text-blue hover:no-underline"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {error ? (
          <Card>
            <CardBody>
              <div className="text-red">Could not load cases. {error.message}</div>
            </CardBody>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icons.Cases className="h-7 w-7" />}
            title="No recovery cases yet"
            description={
              q || status || priority
                ? "No cases match those filters. Try clearing them."
                : "Open a recovery case for a survivor to start tracking lifecycle, priority, and outcomes."
            }
            action={
              <LinkButton href="/app/cases/new">
                <Icons.Plus className="h-4 w-4" />
                Open first case
              </LinkButton>
            }
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
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
                {rows.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(c.survivors?.first_name, c.survivors?.last_name)}
                      </Link>
                      {c.survivors?.state && (
                        <div className="text-[11.5px] text-ink-3">{c.survivors.state}</div>
                      )}
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
                      {relativeDate(c.opened_at)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}
