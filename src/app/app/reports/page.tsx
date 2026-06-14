import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

export const metadata = {
  title: "Reports — ReliefBridge",
};

export const dynamic = "force-dynamic";

type ReportCard = {
  href: string;
  title: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  band: string;
  value: number;
  valueLabel: string;
  secondary: string;
};

export default async function ReportsIndexPage() {
  const supabase = await createSupabaseServerClient();
  const profile = await requireProfile();
  const orgId = profile.organization_id;

  let totalCaseCount = 0;
  let closedCaseCount = 0;
  let totalReferralCount = 0;
  let completedReferralCount = 0;
  let openNeedCount = 0;
  let recentActivityCount = 0;

  if (orgId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const [
      totalCasesResult,
      closedCasesResult,
      totalReferralsResult,
      completedReferralsResult,
      openNeedsResult,
      recentCasesResult,
      recentReferralsResult,
      recentNeedsResult,
    ] = await Promise.all([
      supabase
        .from("recovery_cases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),

      supabase
        .from("recovery_cases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .ilike("status", "closed"),

      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`),

      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("status", "Completed")
        .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`),

      supabase
        .from("unmet_needs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .ilike("status", "open"),

      supabase
        .from("recovery_cases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("created_at", thirtyDaysAgoIso),

      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`)
        .gte("created_at", thirtyDaysAgoIso),

      supabase
        .from("unmet_needs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gte("created_at", thirtyDaysAgoIso),
    ]);

    totalCaseCount = totalCasesResult.count ?? 0;
    closedCaseCount = closedCasesResult.count ?? 0;
    totalReferralCount = totalReferralsResult.count ?? 0;
    completedReferralCount = completedReferralsResult.count ?? 0;
    openNeedCount = openNeedsResult.count ?? 0;

    recentActivityCount =
      (recentCasesResult.count ?? 0) +
      (recentReferralsResult.count ?? 0) +
      (recentNeedsResult.count ?? 0);
  }

  const openCaseCount = Math.max(
    totalCaseCount - closedCaseCount,
    0,
  );

  const referralCompletionRate =
    totalReferralCount > 0
      ? Math.round(
          (completedReferralCount / totalReferralCount) * 100,
        )
      : 0;

  const reports: ReportCard[] = [
    {
      href: "/app/reports/open-cases",
      title: "Open recovery cases",
      blurb: "Active workload by priority, status, and disaster event.",
      icon: Icons.Cases,
      band: "Operations",
      value: openCaseCount,
      valueLabel:
        openCaseCount === 1 ? "open case" : "open cases",
      secondary: `${totalCaseCount.toLocaleString()} total recovery ${
        totalCaseCount === 1 ? "case" : "cases"
      }`,
    },
    {
      href: "/app/reports/closed-cases",
      title: "Closed cases",
      blurb: "Outcomes and time-to-close across resolved recovery cases.",
      icon: Icons.CircleCheck,
      band: "Outcomes",
      value: closedCaseCount,
      valueLabel:
        closedCaseCount === 1 ? "closed case" : "closed cases",
      secondary: `${openCaseCount.toLocaleString()} still open`,
    },
    {
      href: "/app/reports/referral-outcomes",
      title: "Referral outcomes",
      blurb:
        "Acceptance rate, response time, and completed handoffs across partners.",
      icon: Icons.Referrals,
      band: "Network",
      value: totalReferralCount,
      valueLabel:
        totalReferralCount === 1
          ? "tracked referral"
          : "tracked referrals",
      secondary: `${referralCompletionRate}% completed`,
    },
    {
      href: "/app/reports/unmet-needs",
      title: "Unmet needs dashboard",
      blurb: "Distribution and aging of open needs across categories.",
      icon: Icons.Needs,
      band: "Needs",
      value: openNeedCount,
      valueLabel:
        openNeedCount === 1 ? "open unmet need" : "open unmet needs",
      secondary: "Requires continued coordination",
    },
    {
      href: "/app/reports/org-activity",
      title: "Organization activity",
      blurb: "Cases, referrals, and needs activity over the last 30 days.",
      icon: Icons.Reports,
      band: "Activity",
      value: recentActivityCount,
      valueLabel:
        recentActivityCount === 1
          ? "activity record"
          : "activity records",
      secondary: "Recorded during the last 30 days",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Funder-ready reporting on cases, referrals, unmet needs, and network activity."
        breadcrumbs={[
          { label: "Insights", href: "/app" },
          { label: "Reports" },
        ]}
      />

      <div className="px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                key={report.href}
                href={report.href}
                className="group block hover:no-underline"
              >
                <Card className="h-full transition group-hover:border-blue group-hover:shadow-md">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-sm bg-blue-soft text-navy">
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                        {report.band}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end gap-2">
                      <div className="rb-numerals text-[36px] font-black leading-none tracking-tight text-navy">
                        {report.value.toLocaleString()}
                      </div>

                      <div className="pb-1 text-[12.5px] font-semibold text-ink-3">
                        {report.valueLabel}
                      </div>
                    </div>

                    <div className="mt-4 text-[16px] font-bold tracking-tight text-navy group-hover:text-blue">
                      {report.title}
                    </div>

                    <p className="mt-2 text-[13.5px] leading-5 text-ink-2">
                      {report.blurb}
                    </p>

                    <div className="mt-3 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink-2">
                      {report.secondary}
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue">
                      Open report
                      <Icons.ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}