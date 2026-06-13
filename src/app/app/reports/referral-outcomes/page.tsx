import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { BarRow } from "@/components/reports/BarRow";
import { Icons } from "@/components/ui/Icons";
import type { Referral, ReferralStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referral outcomes — ReliefBridge" };

export default async function ReferralOutcomesReport() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000000";

  const { data } = await supabase
    .from("referrals")
    .select("id, status, created_at, responded_at, completed_at, sending_org, receiving_org")
    .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`)
    .limit(1000);

  const rows = (data ?? []) as Array<
    Pick<
      Referral,
      | "id"
      | "status"
      | "created_at"
      | "responded_at"
      | "completed_at"
      | "sending_org"
      | "receiving_org"
    >
  >;

  const outgoing = rows.filter((r) => r.sending_org === orgId);
  const incoming = rows.filter((r) => r.receiving_org === orgId);

  const accepted = outgoing.filter(
    (r) => r.status === "Accepted" || r.status === "In Progress" || r.status === "Completed"
  ).length;
  const completed = outgoing.filter((r) => r.status === "Completed").length;
  const declined = outgoing.filter((r) => r.status === "Declined").length;
  const pending = outgoing.filter((r) => r.status === "Pending").length;
  const totalOutgoing = outgoing.length;

  const responseTimes = outgoing
    .filter((r) => r.responded_at)
    .map(
      (r) =>
        (new Date(r.responded_at!).getTime() - new Date(r.created_at).getTime()) /
        (1000 * 60 * 60)
    )
    .filter((n) => Number.isFinite(n) && n >= 0);
  const avgResponseHrs = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  const acceptanceRate = totalOutgoing
    ? Math.round((accepted / totalOutgoing) * 100)
    : 0;
  const completionRate = totalOutgoing
    ? Math.round((completed / totalOutgoing) * 100)
    : 0;

  const byStatus = new Map<ReferralStatus, number>();
  for (const r of outgoing) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);

  const pct = (n: number) =>
    totalOutgoing ? Math.round((n / totalOutgoing) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Reports · Network"
        title="Referral outcomes"
        subtitle="Acceptance, response time, and completion across your outgoing referrals."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports", href: "/app/reports" },
          { label: "Referral outcomes" },
        ]}
      />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total outgoing" value={totalOutgoing} hint="All-time" />
          <Kpi label="Acceptance rate" value={`${acceptanceRate}%`} hint="Accepted or further" />
          <Kpi label="Completion rate" value={`${completionRate}%`} hint="Closed-loop outcomes" />
          <Kpi label="Avg response time" value={`${avgResponseHrs} h`} hint="To accept or decline" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Outgoing referrals by status" />
            <CardBody>
              {totalOutgoing === 0 ? (
                <Empty />
              ) : (
                <ul className="space-y-3.5">
                  {(["Pending", "Accepted", "In Progress", "Completed", "Declined"] as ReferralStatus[]).map(
                    (s) => (
                      <li key={s}>
                        <BarRow label={s} count={byStatus.get(s) ?? 0} pct={pct(byStatus.get(s) ?? 0)} />
                      </li>
                    )
                  )}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Incoming referrals" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 text-[13.5px]">
                <Stat label="Total received" value={incoming.length} />
                <Stat
                  label="Awaiting response"
                  value={incoming.filter((r) => r.status === "Pending").length}
                />
                <Stat
                  label="Accepted by you"
                  value={
                    incoming.filter(
                      (r) =>
                        r.status === "Accepted" ||
                        r.status === "In Progress" ||
                        r.status === "Completed"
                    ).length
                  }
                />
                <Stat
                  label="Completed by you"
                  value={incoming.filter((r) => r.status === "Completed").length}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[12.5px] text-ink-2">
                <Icons.CircleCheck className="h-4 w-4 text-green" />
                {pending} outgoing referrals are still awaiting partner response.
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-[13px] text-ink-2">
              <Icons.AlertTriangle className="h-4 w-4 text-gold" />
              {declined} outgoing referrals were declined — consider widening the
              partner network for those categories.
            </div>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </div>
      <div className="rb-numerals mt-1 text-[22px] font-bold tracking-tight text-navy">
        {value}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="text-[13px] text-ink-3">
      No outgoing referrals yet. Send your first referral from the Referral
      Exchange.
    </div>
  );
}
