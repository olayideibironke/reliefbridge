import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const profile = await requireProfile();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgId = profile.organization_id;
  const email = user?.email ?? "";

  const profileFirstName =
    typeof profile.first_name === "string"
      ? profile.first_name.trim()
      : "";

  const metadataFirstName =
    typeof user?.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name.trim()
      : "";

  const firstName =
    profileFirstName ||
    metadataFirstName ||
    email.split("@")[0] ||
    "there";

  let activeSurvivorCount = 0;
  let activeCaseCount = 0;
  let pendingReferralCount = 0;
  let openNeedCount = 0;
  let partnerCount = 0;

  if (orgId) {
    const [
      activeSurvivorsResult,
      activeCasesResult,
      pendingReferralsResult,
      openNeedsResult,
      partnersResult,
    ] = await Promise.all([
      supabase
        .from("survivors")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "active"),

      supabase
        .from("recovery_cases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .neq("status", "Closed"),

      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending")
        .or(`sending_org.eq.${orgId},receiving_org.eq.${orgId}`),

      supabase
        .from("unmet_needs")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "open"),

      supabase
        .from("organizations")
        .select("id", { count: "exact", head: true })
        .neq("id", orgId)
        .eq("status", "active"),
    ]);

    activeSurvivorCount = activeSurvivorsResult.count ?? 0;
    activeCaseCount = activeCasesResult.count ?? 0;
    pendingReferralCount = pendingReferralsResult.count ?? 0;
    openNeedCount = openNeedsResult.count ?? 0;
    partnerCount = partnersResult.count ?? 0;
  }

  const metrics = [
    {
      label: "Active survivors",
      value: activeSurvivorCount,
      detail:
        activeSurvivorCount === 1
          ? "1 survivor currently receiving support"
          : `${activeSurvivorCount} survivors currently receiving support`,
      icon: Icons.Survivors,
    },
    {
      label: "Active recovery cases",
      value: activeCaseCount,
      detail:
        activeCaseCount === 1
          ? "1 recovery case currently open"
          : `${activeCaseCount} recovery cases currently open`,
      icon: Icons.Cases,
    },
    {
      label: "Pending referrals",
      value: pendingReferralCount,
      detail:
        pendingReferralCount === 1
          ? "1 partner referral awaiting action"
          : `${pendingReferralCount} partner referrals awaiting action`,
      icon: Icons.Referrals,
    },
    {
      label: "Open unmet needs",
      value: openNeedCount,
      detail:
        openNeedCount === 1
          ? "1 unmet need requiring coordination"
          : `${openNeedCount} unmet needs requiring coordination`,
      icon: Icons.Needs,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Command Center"
        title={`Good day, ${firstName}.`}
        subtitle="Monitor survivor recovery cases, partner referrals, unmet needs, and coordination activity across your ReliefBridge workspace."
        actions={
          <>
            <LinkButton
              href="/app/survivors/new"
              variant="outline"
              size="md"
            >
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <Card key={metric.label} className="overflow-hidden">
                <CardBody className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13.5px] font-bold text-ink-2">
                      {metric.label}
                    </div>

                    <div className="rb-numerals mt-2 text-[38px] font-black leading-none tracking-tight text-navy">
                      {metric.value.toLocaleString()}
                    </div>

                    <div className="mt-2 text-[13px] leading-5 text-ink-3">
                      {metric.detail}
                    </div>
                  </div>

                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-blue-soft text-blue">
                    <Icon className="h-5 w-5" />
                  </span>
                </CardBody>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardBody className="space-y-5">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
                  Operational overview
                </div>

                <h2 className="mt-2 text-[28px] font-black tracking-tight text-navy">
                  Your recovery coordination workspace is live.
                </h2>

                <p className="mt-3 max-w-2xl text-[15.5px] leading-7 text-ink-2">
                  Use ReliefBridge to coordinate survivor records, recovery
                  cases, unmet needs, and partner referrals from one secure
                  workspace. The figures above are loaded directly from your
                  organization&apos;s current Supabase records.
                </p>
              </div>

              <div className="rounded-sm border border-line bg-surface-2 px-5 py-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  Signed-in account
                </div>

                <div className="mt-2 text-[15px] font-bold text-navy">
                  {email}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <LinkButton href="/app/survivors/new">
                  <Icons.Plus className="h-4 w-4" />
                  Add survivor
                </LinkButton>

                <LinkButton href="/app/cases" variant="outline">
                  View recovery cases
                </LinkButton>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
                Recovery network
              </div>

              <div>
                <div className="rb-numerals text-[38px] font-black leading-none tracking-tight text-navy">
                  {partnerCount.toLocaleString()}
                </div>

                <div className="mt-2 text-[14.5px] leading-6 text-ink-2">
                  {partnerCount === 1
                    ? "Active partner organization available for coordinated referrals."
                    : "Active partner organizations available for coordinated referrals."}
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4 text-[14px] leading-6 text-ink-2">
                <div>Review active recovery cases.</div>
                <div>Follow up on pending referrals.</div>
                <div>Prioritize open unmet needs.</div>
                <div>Keep survivor records current.</div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/app/partners"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  View partner network →
                </Link>

                <Link
                  href="/app/reports"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  View reporting workspace →
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}