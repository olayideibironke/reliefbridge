import Link from "next/link";
import { getRequestLocale } from "@/lib/request-locale";
import { t } from "@/lib/i18n";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export async function OrganizationDashboard() {
  const supabase = await createSupabaseServerClient();
  const profile = await requireProfile();
  const locale = await getRequestLocale();
  const tr = (key: Parameters<typeof t>[1]) => t(locale, key);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const orgId = profile.organization_id;
  const email = user?.email ?? "";
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo =
    Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);

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
    const partnersQuery = supabase
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .neq("id", orgId)
      .eq("status", "active");


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
        .eq("status", "open"),

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

      partnersQuery,
    ]);

    activeSurvivorCount = activeSurvivorsResult.count ?? 0;
    activeCaseCount = activeCasesResult.count ?? 0;
    pendingReferralCount = pendingReferralsResult.count ?? 0;
    openNeedCount = openNeedsResult.count ?? 0;
    partnerCount = partnersResult.count ?? 0;
  }

  const metrics = [
    {
      label: tr("activeSurvivors"),
      value: activeSurvivorCount,
      detail:
        activeSurvivorCount === 1
          ? `1 ${tr("survivorsReceivingSupport")}`
          : `${activeSurvivorCount} ${tr("survivorsReceivingSupport")}`,
      icon: Icons.Survivors,
    },
    {
      label: tr("activeRecoveryCases"),
      value: activeCaseCount,
      detail:
        activeCaseCount === 1
          ? `1 ${tr("recoveryCasesOpen")}`
          : `${activeCaseCount} ${tr("recoveryCasesOpen")}`,
      icon: Icons.Cases,
    },
    {
      label: tr("pendingReferrals"),
      value: pendingReferralCount,
      detail:
        pendingReferralCount === 1
          ? `1 ${tr("referralsAwaitingAction")}`
          : `${pendingReferralCount} ${tr("referralsAwaitingAction")}`,
      icon: Icons.Referrals,
    },
    {
      label: tr("openUnmetNeeds"),
      value: openNeedCount,
      detail:
        openNeedCount === 1
          ? `1 ${tr("needsRequiringCoordination")}`
          : `${openNeedCount} ${tr("needsRequiringCoordination")}`,
      icon: Icons.Needs,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={tr("commandCenter")}
        title={`${tr("goodDay")}, ${firstName}.`}
        subtitle={tr("orgDashboardSubtitle")}
        actions={
          isManagedDemo ? undefined : (
            <>
              <LinkButton
                href="/app/survivors/new"
                variant="outline"
                size="md"
              >
                <Icons.Plus className="h-4 w-4" />
                {tr("newSurvivor")}
              </LinkButton>

              <LinkButton href="/app/referrals/new" size="md">
                <Icons.Referrals className="h-4 w-4" />
                {tr("sendReferral")}
              </LinkButton>
            </>
          )
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
                  {tr("operationalOverview")}
                </div>

                <h2 className="mt-2 text-[28px] font-black tracking-tight text-navy">
                  {tr("workspaceLive")}
                </h2>

                <p className="mt-3 max-w-2xl text-[15.5px] leading-7 text-ink-2">
                  {tr("orgWorkspaceDescription")}
                </p>
              </div>

              <div className="rounded-sm border border-line bg-surface-2 px-5 py-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  {tr("signedInAccount")}
                </div>

                <div className="mt-2 text-[15px] font-bold text-navy">
                  {email}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isManagedDemo && (
                  <LinkButton href="/app/survivors/new">
                    <Icons.Plus className="h-4 w-4" />
                    {tr("addSurvivor")}
                  </LinkButton>
                )}

                <LinkButton href="/app/cases" variant="outline">
                  {tr("viewRecoveryCases")}
                </LinkButton>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
                {tr("recoveryNetwork")}
              </div>

              <div>
                <div className="rb-numerals text-[38px] font-black leading-none tracking-tight text-navy">
                  {partnerCount.toLocaleString()}
                </div>

                <div className="mt-2 text-[14.5px] leading-6 text-ink-2">
                  {partnerCount === 1
                    ? tr("activePartnerOrganizations")
                    : tr("activePartnerOrganizations")}
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4 text-[14px] leading-6 text-ink-2">
                <div>{tr("reviewActiveCases")}</div>
                <div>{tr("followPendingReferrals")}</div>
                <div>{tr("prioritizeOpenNeeds")}</div>
                <div>{tr("keepRecordsCurrent")}</div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/app/partners"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  {tr("viewPartnerNetwork")} →
                </Link>

                <Link
                  href="/app/reports"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  {tr("viewReportingWorkspace")} →
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}