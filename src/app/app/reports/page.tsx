import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import type { ComponentType, SVGProps } from "react";

export const metadata = { title: "Reports — ReliefBridge" };

const reports: Array<{
  href: string;
  title: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  band: string;
}> = [
  {
    href: "/app/reports/open-cases",
    title: "Open recovery cases",
    blurb: "Active workload by priority, status, and disaster event.",
    icon: Icons.Cases,
    band: "Operations",
  },
  {
    href: "/app/reports/closed-cases",
    title: "Closed cases",
    blurb: "Outcomes and time-to-close across resolved recovery cases.",
    icon: Icons.CircleCheck,
    band: "Outcomes",
  },
  {
    href: "/app/reports/referral-outcomes",
    title: "Referral outcomes",
    blurb: "Acceptance rate, response time, and completed handoffs across partners.",
    icon: Icons.Referrals,
    band: "Network",
  },
  {
    href: "/app/reports/unmet-needs",
    title: "Unmet needs dashboard",
    blurb: "Distribution and aging of open needs across categories.",
    icon: Icons.Needs,
    band: "Needs",
  },
  {
    href: "/app/reports/org-activity",
    title: "Organization activity",
    blurb: "Cases, referrals, and needs activity over the last 30 days.",
    icon: Icons.Reports,
    band: "Activity",
  },
];

export default function ReportsIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Funder-ready reporting on cases, referrals, unmet needs, and network activity."
        breadcrumbs={[{ label: "Insights", href: "/app" }, { label: "Reports" }]}
      />
      <div className="px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => {
            const Ico = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                className="group block hover:no-underline"
              >
                <Card className="h-full transition group-hover:border-blue group-hover:shadow-md">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-sm bg-blue-soft text-navy">
                        <Ico className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                        {r.band}
                      </span>
                    </div>
                    <div className="mt-4 text-[16px] font-bold tracking-tight text-navy group-hover:text-blue">
                      {r.title}
                    </div>
                    <p className="mt-2 text-[13.5px] leading-5 text-ink-2">
                      {r.blurb}
                    </p>
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
