import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import { SurvivorStatusBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import { SURVIVOR_STATUSES, US_STATES } from "@/lib/constants";
import { LABELS } from "@/lib/constants";
import type { Survivor, SurvivorStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SurvivorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = SURVIVOR_STATUSES.includes(sp.status as SurvivorStatus)
    ? (sp.status as SurvivorStatus)
    : "";
  const state = sp.state && US_STATES.includes(sp.state) ? sp.state : "";

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("survivors")
    .select("id, first_name, last_name, status, disaster_event, state, county, created_at, phone, email")
    .order("created_at", { ascending: false })
    .limit(200);

  if (profile.organization_id) {
    query = query.eq("organization_id", profile.organization_id);
  } else {
    query = query.eq("organization_id", "00000000-0000-0000-0000-000000000000");
  }
  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }
  if (status) query = query.eq("status", status);
  if (state) query = query.eq("state", state);

  const { data, error } = await query;
  const survivors = (data ?? []) as Pick<
    Survivor,
    | "id"
    | "first_name"
    | "last_name"
    | "status"
    | "disaster_event"
    | "state"
    | "county"
    | "created_at"
    | "phone"
    | "email"
  >[];

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Survivors"
        subtitle="Every survivor coordinated by your organization. Search, filter, and open any record."
        breadcrumbs={[{ label: "Workspace", href: "/app" }, { label: "Survivors" }]}
        actions={
          <LinkButton href="/app/survivors/new">
            <Icons.Plus className="h-4 w-4" />
            Add survivor
          </LinkButton>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[1fr_180px_160px_auto]"
              action="/app/survivors"
              method="get"
            >
              <Input
                label="Search"
                name="q"
                placeholder="Search by name, email, or phone"
                defaultValue={q}
              />
              <Select
                label="Status"
                name="status"
                defaultValue={status}
              >
                <option value="">All statuses</option>
                {SURVIVOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LABELS.survivorStatus[s]}
                  </option>
                ))}
              </Select>
              <Select label="State" name="state" defaultValue={state}>
                <option value="">All states</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                  href="/app/survivors"
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
              <div className="text-red">Could not load survivors. {error.message}</div>
            </CardBody>
          </Card>
        ) : survivors.length === 0 ? (
          <EmptyState
            icon={<Icons.Survivors className="h-7 w-7" />}
            title="No survivors yet"
            description={
              q || status || state
                ? "No survivors match those filters. Try clearing them."
                : "Add the first survivor your organization is coordinating to begin tracking cases, needs, and referrals."
            }
            action={
              <LinkButton href="/app/survivors/new">
                <Icons.Plus className="h-4 w-4" />
                Add first survivor
              </LinkButton>
            }
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
              <THead>
                <Tr>
                  <Th>Survivor</Th>
                  <Th>Disaster event</Th>
                  <Th>Location</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th align="right">Added</Th>
                </Tr>
              </THead>
              <tbody>
                {survivors.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <Link
                        href={`/app/survivors/${s.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(s.first_name, s.last_name)}
                      </Link>
                    </Td>
                    <Td>{s.disaster_event ?? "—"}</Td>
                    <Td>
                      {s.county ? `${s.county}${s.state ? `, ${s.state}` : ""}` : s.state ?? "—"}
                    </Td>
                    <Td>
                      {s.email || s.phone ? (
                        <div className="space-y-0.5">
                          {s.email && <div className="text-[12.5px] text-ink-2">{s.email}</div>}
                          {s.phone && <div className="text-[12px] text-ink-3">{s.phone}</div>}
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <SurvivorStatusBadge status={s.status} />
                    </Td>
                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {relativeDate(s.created_at)}
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
