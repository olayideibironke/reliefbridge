import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { BarRow } from "@/components/reports/BarRow";
import { Icons } from "@/components/ui/Icons";
import type { NeedCategory, NeedStatus, UnmetNeed } from "@/lib/types";
import { NEED_CATEGORIES, NEED_STATUSES, LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unmet needs dashboard — ReliefBridge" };

const DAY_MS = 1000 * 60 * 60 * 24;

function computeAgingBuckets(
  rows: Array<{ created_at: string; status: NeedStatus }>
): Record<"< 7 days" | "7–30 days" | "30–90 days" | "> 90 days", number> {
  const now = new Date().getTime();
  const out = {
    "< 7 days": 0,
    "7–30 days": 0,
    "30–90 days": 0,
    "> 90 days": 0,
  };
  for (const r of rows) {
    if (r.status !== "open" && r.status !== "in_progress") continue;
    const days = (now - new Date(r.created_at).getTime()) / DAY_MS;
    if (days < 7) out["< 7 days"] += 1;
    else if (days < 30) out["7–30 days"] += 1;
    else if (days < 90) out["30–90 days"] += 1;
    else out["> 90 days"] += 1;
  }
  return out;
}

export default async function UnmetNeedsReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000000";

  const { data } = await supabase
    .from("unmet_needs")
    .select("id, category, status, priority, created_at")
    .eq("organization_id", orgId)
    .limit(2000);

  const rows = (data ?? []) as Array<
    Pick<UnmetNeed, "id" | "category" | "status" | "priority" | "created_at">
  >;

  const total = rows.length;
  const totalOpen = rows.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const met = rows.filter((r) => r.status === "met").length;
  const unable = rows.filter((r) => r.status === "unable_to_meet").length;
  const fulfilmentRate = total ? Math.round((met / total) * 100) : 0;

  const byCategory = new Map<NeedCategory, number>();
  for (const r of rows) {
    if (r.status === "open" || r.status === "in_progress") {
      byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
    }
  }
  const sortedCategories = NEED_CATEGORIES.map((c) => ({
    cat: c,
    count: byCategory.get(c) ?? 0,
  }));
  const openTotal = sortedCategories.reduce((s, r) => s + r.count, 0);
  const pctOf = (n: number) => (openTotal ? Math.round((n / openTotal) * 100) : 0);

  const byStatus = new Map<NeedStatus, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  const pctOfTotal = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const buckets = computeAgingBuckets(rows);
  const agingTotal = Object.values(buckets).reduce((a, b) => a + b, 0);
  const pctOfAging = (n: number) => (agingTotal ? Math.round((n / agingTotal) * 100) : 0);

  return (
    <>
      <PageHeader
        eyebrow="Reports · Needs"
        title="Unmet needs dashboard"
        subtitle="Distribution and aging of open needs across categories."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Unmet needs" },
        ]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total captured" value={total} hint="All-time, all statuses" />
          <Kpi label="Currently open" value={totalOpen} hint="Open or in progress" />
          <Kpi label="Met" value={met} hint={`Fulfilment rate ${fulfilmentRate}%`} />
          <Kpi label="Unable to meet" value={unable} hint="Network gaps to address" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Open needs by category" subtitle="What survivors need most right now" />
            <CardBody>
              {openTotal === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-3.5">
                  {sortedCategories
                    .sort((a, b) => b.count - a.count)
                    .map((r) => (
                      <li key={r.cat}>
                        <BarRow label={r.cat} count={r.count} pct={pctOf(r.count)} />
                      </li>
                    ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="By status" subtitle="Lifecycle distribution" />
            <CardBody>
              {total === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-3.5">
                  {NEED_STATUSES.map((s) => (
                    <li key={s}>
                      <BarRow
                        label={LABELS.needStatus[s]}
                        count={byStatus.get(s) ?? 0}
                        pct={pctOfTotal(byStatus.get(s) ?? 0)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Aging of open needs" subtitle="Days since capture" />
          <CardBody>
            {agingTotal === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-3.5">
                {Object.entries(buckets).map(([label, count]) => (
                  <li key={label}>
                    <BarRow label={label} count={count} pct={pctOfAging(count)} />
                  </li>
                ))}
              </ul>
            )}
            {buckets["> 90 days"] > 0 && (
              <div className="mt-5 flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-ink-2">
                <Icons.AlertTriangle className="h-4 w-4 text-gold" />
                {buckets["> 90 days"]} needs have been open for more than 90 days
                — consider partner outreach or status updates.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Kpi({
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

function Empty() {
  return <div className="text-[13px] text-ink-3">No data yet.</div>;
}
