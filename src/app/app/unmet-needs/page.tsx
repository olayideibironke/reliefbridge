import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import {
  NeedStatusBadge,
  PriorityBadge,
} from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import {
  LABELS,
  NEED_CATEGORIES,
  NEED_STATUSES,
} from "@/lib/constants";
import type {
  NeedCategory,
  NeedStatus,
  Survivor,
  UnmetNeed,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = UnmetNeed & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name"> | null;
};

export default async function UnmetNeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const category = NEED_CATEGORIES.includes(sp.category as NeedCategory)
    ? (sp.category as NeedCategory)
    : "";
  const status = NEED_STATUSES.includes(sp.status as NeedStatus)
    ? (sp.status as NeedStatus)
    : "";

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("unmet_needs")
    .select(
      "*, survivors:survivors!unmet_needs_survivor_id_fkey ( id, first_name, last_name )"
    )
    .order("created_at", { ascending: false })
    .limit(250);

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  } else {
    query = query.eq("organization_id", "00000000-0000-0000-0000-000000000000");
  }
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data } = await query;
  const rows = ((data ?? []) as unknown) as Row[];

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Unmet needs"
        subtitle="Captured survivor needs across housing, repair, legal aid, mental health, transportation, and more."
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Unmet needs" }]}
        actions={
          <LinkButton href="/app/unmet-needs/new">
            <Icons.Plus className="h-4 w-4" />
            Add need
          </LinkButton>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[200px_180px_auto]"
              action="/app/unmet-needs"
              method="get"
            >
              <Select label="Category" name="category" defaultValue={category}>
                <option value="">All categories</option>
                {NEED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select label="Status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                {NEED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.needStatus[s]}
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
                  href="/app/unmet-needs"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink-2 hover:border-blue hover:text-blue hover:no-underline"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icons.Needs className="h-7 w-7" />}
            title="No unmet needs captured"
            description={
              category || status
                ? "No needs match those filters. Try clearing them."
                : "Add unmet needs against survivor records to coordinate referrals and partner outreach."
            }
            action={
              <LinkButton href="/app/unmet-needs/new">
                <Icons.Plus className="h-4 w-4" />
                Capture first need
              </LinkButton>
            }
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
              <THead>
                <Tr>
                  <Th>Survivor</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th align="right">Captured</Th>
                </Tr>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      {r.survivors ? (
                        <Link
                          href={`/app/survivors/${r.survivors.id}`}
                          className="font-semibold text-navy hover:text-blue hover:no-underline"
                        >
                          {fullName(r.survivors.first_name, r.survivors.last_name)}
                        </Link>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-semibold text-navy">{r.category}</span>
                    </Td>
                    <Td className="max-w-md">
                      <div className="truncate">{r.description}</div>
                    </Td>
                    <Td>
                      <PriorityBadge priority={r.priority} />
                    </Td>
                    <Td>
                      <NeedStatusBadge status={r.status} />
                    </Td>
                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {relativeDate(r.created_at)}
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
