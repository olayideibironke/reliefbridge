import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization activity — ReliefBridge" };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function OrgActivityReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000000";

  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromIso = from.toISOString();

  const [{ data: cases }, { data: refs }, { data: needs }, { data: survivors }] =
    await Promise.all([
      supabase
        .from("recovery_cases")
        .select("id, created_at, status")
        .eq("organization_id", orgId)
        .gte("created_at", fromIso),
      supabase
        .from("referrals")
        .select("id, created_at, status, sending_org, receiving_org")
        .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`)
        .gte("created_at", fromIso),
      supabase
        .from("unmet_needs")
        .select("id, created_at, status")
        .eq("organization_id", orgId)
        .gte("created_at", fromIso),
      supabase
        .from("survivors")
        .select("id, created_at")
        .eq("organization_id", orgId)
        .gte("created_at", fromIso),
    ]);

  type Row = { created_at: string };
  const groupByDay = (rows: Row[] | null | undefined) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) {
      const k = startOfDay(new Date(r.created_at)).toISOString().slice(0, 10);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };

  const dailySeries = (m: Map<string, number>) => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, count: m.get(key) ?? 0, date: d };
    });
  };

  const casesSeries = dailySeries(groupByDay(cases as Row[] | undefined));
  const refsSeries = dailySeries(groupByDay(refs as Row[] | undefined));
  const needsSeries = dailySeries(groupByDay(needs as Row[] | undefined));
  const survivorsSeries = dailySeries(groupByDay(survivors as Row[] | undefined));

  const totals = {
    cases: (cases ?? []).length,
    refs: (refs ?? []).length,
    needs: (needs ?? []).length,
    survivors: (survivors ?? []).length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Reports · Activity"
        title="Organization activity"
        subtitle="Last 30 days of activity across cases, referrals, unmet needs, and survivors."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Organization activity" },
        ]}
      />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="New survivors" value={totals.survivors} hint="Last 30 days" />
          <Kpi label="New recovery cases" value={totals.cases} hint="Last 30 days" />
          <Kpi label="New referrals" value={totals.refs} hint="Sent or received" />
          <Kpi label="New unmet needs" value={totals.needs} hint="Captured" />
        </div>

        <Card>
          <CardHeader
            title="Daily activity"
            subtitle="Bars reflect new entries created each day for the past 30 days."
          />
          <CardBody className="space-y-6">
            <SeriesChart label="Recovery cases" series={casesSeries} tone="navy" />
            <SeriesChart label="Referrals" series={refsSeries} tone="blue" />
            <SeriesChart label="Unmet needs" series={needsSeries} tone="amber" />
            <SeriesChart label="Survivors" series={survivorsSeries} tone="green" />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-2 text-[13px] text-ink-2">
            <Icons.CircleCheck className="h-4 w-4 text-green" />
            All counts are scoped to your organization and respect
            ReliefBridge&apos;s row-level security policies.
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
  value: number;
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

function SeriesChart({
  label,
  series,
  tone,
}: {
  label: string;
  series: { key: string; count: number; date: Date }[];
  tone: "navy" | "blue" | "amber" | "green";
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const bar = {
    navy: "bg-navy",
    blue: "bg-blue",
    amber: "bg-[#C2850C]",
    green: "bg-green",
  }[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-navy">{label}</div>
        <div className="rb-numerals text-[12px] text-ink-3">
          peak {max} · last 30 days
        </div>
      </div>
      <div className="flex h-24 items-end gap-[3px]">
        {series.map((s) => {
          const h = Math.round((s.count / max) * 100);
          return (
            <div
              key={s.key}
              className="flex-1 rounded-t-sm bg-surface-3"
              title={`${s.date.toLocaleDateString()} · ${s.count}`}
            >
              <div
                className={`mx-auto rounded-t-sm ${bar}`}
                style={{ height: `${Math.max(2, h)}%`, width: "70%" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
