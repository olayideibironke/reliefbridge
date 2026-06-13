import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import {
  CaseStatusBadge,
  NeedStatusBadge,
  PriorityBadge,
  ReferralStatusBadge,
} from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { fullName, relativeDate } from "@/lib/format";
import type {
  RecoveryCase,
  Referral,
  Survivor,
  UnmetNeed,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type CaseRow = Pick<
  RecoveryCase,
  "id" | "priority" | "status" | "primary_need" | "disaster_type" | "opened_at"
> & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name" | "state"> | null;
};

type ReferralRow = Pick<Referral, "id" | "category" | "status" | "created_at"> & {
  survivors: Pick<Survivor, "first_name" | "last_name"> | null;
};

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id;

  // Without an org, we can't query — gentle empty state.
  if (!orgId) {
    return (
      <>
        <PageHeader
          eyebrow="Command Center"
          title={`Welcome, ${fullName(profile.first_name, profile.last_name)}.`}
          subtitle="Finish setting up your organization to start coordinating recovery work."
        />
        <div className="px-6 py-10 md:px-10">
          <EmptyState
            icon={<Icons.Building className="h-7 w-7" />}
            title="No organization linked yet"
            description="Your profile isn't linked to an organization. Open Settings to create or join one."
            action={
              <LinkButton href="/app/settings/organization">
                <Icons.Building className="h-4 w-4" />
                Go to organization settings
              </LinkButton>
            }
          />
        </div>
      </>
    );
  }

  const [
    activeCasesRes,
    pendingReferralsRes,
    openNeedsRes,
    partnerCountRes,
    recentCasesRes,
    recentReferralsRes,
    needsByCategoryRes,
  ] = await Promise.all([
    supabase
      .from("recovery_cases")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .neq("status", "closed"),
    supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("sending_org", orgId)
      .in("status", ["Pending", "Accepted", "In Progress"]),
    supabase
      .from("unmet_needs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .neq("id", orgId),
    supabase
      .from("recovery_cases")
      .select(
        "id, priority, status, primary_need, disaster_type, opened_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )"
      )
      .eq("organization_id", orgId)
      .order("opened_at", { ascending: false })
      .limit(6),
    supabase
      .from("referrals")
      .select(
        "id, category, status, created_at, survivors:survivors!referrals_survivor_id_fkey ( first_name, last_name )"
      )
      .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("unmet_needs")
      .select("category, status")
      .eq("organization_id", orgId)
      .in("status", ["open", "in_progress"]),
  ]);

  const metrics = [
    {
      label: "Active recovery cases",
      value: activeCasesRes.count ?? 0,
      detail: "Open, in review, or in follow-up",
      icon: Icons.Cases,
    },
    {
      label: "Pending referrals",
      value: pendingReferralsRes.count ?? 0,
      detail: "Sent and awaiting partner response",
      icon: Icons.Referrals,
    },
    {
      label: "Open unmet needs",
      value: openNeedsRes.count ?? 0,
      detail: "Captured and not yet met",
      icon: Icons.Needs,
    },
    {
      label: "Partner organizations",
      value: partnerCountRes.count ?? 0,
      detail: "Directory across the network",
      icon: Icons.Partners,
    },
  ];

  const recentCases = (recentCasesRes.data ?? []) as unknown as CaseRow[];
  const recentReferrals = (recentReferralsRes.data ?? []) as unknown as ReferralRow[];

  const needsAgg = new Map<string, number>();
  for (const row of (needsByCategoryRes.data ?? []) as Array<Pick<UnmetNeed, "category">>) {
    needsAgg.set(row.category, (needsAgg.get(row.category) ?? 0) + 1);
  }
  const needsTotal = Array.from(needsAgg.values()).reduce((s, n) => s + n, 0);
  const needsTopFive = Array.from(needsAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Command Center"
        title={`Good day, ${fullName(profile.first_name, profile.last_name)}.`}
        subtitle="A live snapshot of survivor cases, referrals, and unmet needs across your organization."
        actions={
          <>
            <LinkButton href="/app/survivors/new" variant="outline" size="md">
              <Icons.Plus className="h-4 w-4" />
              New survivor
            </LinkButton>
            <LinkButton href="/app/referrals/new" size="md">
              <Icons.Referrals className="h-4 w-4" />
              Send referral
            </LinkButton>
          </>
        }
      />

      <div className="space-y-8 px-6 py-8 md:px-10">
        {/* Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Ico = m.icon;
            return (
              <Card key={m.label} className="overflow-hidden">
                <CardBody className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-ink-3">
                      {m.label}
                    </div>
                    <div className="rb-numerals mt-2 text-[34px] font-black leading-none tracking-tight text-navy">
                      {m.value.toLocaleString()}
                    </div>
                    <div className="mt-2 text-[12px] text-ink-3">{m.detail}</div>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-blue-soft text-blue">
                    <Ico className="h-5 w-5" />
                  </span>
                </CardBody>
              </Card>
            );
          })}
        </section>

        {/* Recent cases + right column */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent recovery cases"
              subtitle="Latest survivor cases by your team"
              actions={
                <Link
                  href="/app/cases"
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  View all →
                </Link>
              }
            />
            <CardBody padded={false}>
              {recentCases.length === 0 ? (
                <EmptyState
                  className="m-5"
                  icon={<Icons.Cases className="h-6 w-6" />}
                  title="No recovery cases yet"
                  description="Create your first survivor record to start tracking cases."
                  action={
                    <LinkButton href="/app/survivors/new">
                      <Icons.Plus className="h-4 w-4" />
                      Add first survivor
                    </LinkButton>
                  }
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
                    {recentCases.map((c) => (
                      <Tr key={c.id}>
                        <Td>
                          <Link
                            href={`/app/cases/${c.id}`}
                            className="font-semibold text-navy hover:text-blue hover:no-underline"
                          >
                            {fullName(
                              c.survivors?.first_name,
                              c.survivors?.last_name
                            )}
                          </Link>
                          {c.survivors?.state && (
                            <div className="text-[11.5px] text-ink-3">
                              {c.survivors.state}
                            </div>
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
              )}
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Referral exchange"
                subtitle="Recent partner handoffs"
                actions={
                  <Link
                    href="/app/referrals"
                    className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                  >
                    Open
                  </Link>
                }
              />
              {recentReferrals.length === 0 ? (
                <EmptyState
                  className="m-5"
                  icon={<Icons.Referrals className="h-6 w-6" />}
                  title="No referrals yet"
                  description="Send your first referral to connect a survivor with a partner."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {recentReferrals.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-navy">
                          {fullName(r.survivors?.first_name, r.survivors?.last_name)}
                        </div>
                        <div className="truncate text-[12px] text-ink-3">
                          {r.category} · {relativeDate(r.created_at)}
                        </div>
                      </div>
                      <ReferralStatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Unmet needs"
                subtitle="Top categories"
                actions={
                  <Link
                    href="/app/unmet-needs"
                    className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                  >
                    Open
                  </Link>
                }
              />
              {needsTopFive.length === 0 ? (
                <EmptyState
                  className="m-5"
                  icon={<Icons.Needs className="h-6 w-6" />}
                  title="No open needs"
                  description="When you capture survivor needs, they'll appear here ranked by frequency."
                />
              ) : (
                <CardBody>
                  <ul className="space-y-3.5">
                    {needsTopFive.map(([cat, count]) => {
                      const pct = needsTotal ? Math.round((count / needsTotal) * 100) : 0;
                      return (
                        <li key={cat}>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-semibold text-ink">{cat}</span>
                            <span className="rb-numerals text-ink-3">
                              {count}
                              <span className="ml-1 text-ink-4">· {pct}%</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                            <div
                              className="h-full rounded-full bg-blue"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardBody>
              )}
            </Card>
          </div>
        </section>

        {/* Reuse-ready status legend strip (one row, no real placeholder) */}
        <section>
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Coordination check
                </div>
                <div className="mt-1 text-[14px] text-ink-2">
                  Status reference for case and need pipelines.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CaseStatusBadge status="open" />
                <CaseStatusBadge status="in_review" />
                <CaseStatusBadge status="follow_up" />
                <CaseStatusBadge status="on_hold" />
                <CaseStatusBadge status="closed" />
                <span className="mx-2 h-4 w-px bg-line" />
                <NeedStatusBadge status="open" />
                <NeedStatusBadge status="in_progress" />
                <NeedStatusBadge status="met" />
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}
