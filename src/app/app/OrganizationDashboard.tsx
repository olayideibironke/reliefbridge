import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, t } from "@/lib/i18n";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export async function OrganizationDashboard() {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const supabase = await createSupabaseServerClient();
  const profile = await requireProfile();

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
    let partnersQuery = supabase
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
      label: t(locale,"activeSurvivors"),
      value: activeSurvivorCount,
      detail: `${activeSurvivorCount} ${t(locale,"survivorsReceivingSupport")}`,
      icon: Icons.Survivors,
    },
    {
      label: t(locale,"activeRecoveryCases"),
      value: activeCaseCount,
      detail: `${activeCaseCount} ${t(locale,"recoveryCasesOpen")}`,
      icon: Icons.Cases,
    },
    {
      label: t(locale,"pendingReferrals"),
      value: pendingReferralCount,
      detail: `${pendingReferralCount} ${t(locale,"referralsAwaitingAction")}`,
      icon: Icons.Referrals,
    },
    {
      label: t(locale,"openUnmetNeeds"),
      value: openNeedCount,
      detail: `${openNeedCount} ${t(locale,"needsRequiringCoordination")}`,
      icon: Icons.Needs,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t(locale,"commandCenter")}
        title={`${t(locale,"goodDay")}, ${firstName}.`}
        subtitle={t(locale,"orgDashboardSubtitle")}
        actions={
          isManagedDemo ? undefined : (
            <>
              <LinkButton
                href="/app/survivors/new"
                variant="outline"
                size="md"
              >
                <Icons.Plus className="h-4 w-4" />
                {t(locale,"newSurvivor")}
              </LinkButton>

              <LinkButton href="/app/referrals/new" size="md">
                <Icons.Referrals className="h-4 w-4" />
                {t(locale,"sendReferral")}
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
                      {metric.value.toLocaleString(locale)}
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
                  {t(locale,"operationalOverview")}
                </div>

                <h2 className="mt-2 text-[28px] font-black tracking-tight text-navy">
                  {t(locale,"workspaceLive")}
                </h2>

                <p className="mt-3 max-w-2xl text-[15.5px] leading-7 text-ink-2">
                  {t(locale,"orgWorkspaceDescription")}
                </p>
              </div>

              <div className="rounded-sm border border-line bg-surface-2 px-5 py-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  {t(locale,"signedInAccount")}
                </div>

                <div className="mt-2 text-[15px] font-bold text-navy">
                  {email}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isManagedDemo && (
                  <LinkButton href="/app/survivors/new">
                    <Icons.Plus className="h-4 w-4" />
                    {t(locale,"addSurvivor")}
                  </LinkButton>
                )}

                <LinkButton href="/app/cases" variant="outline">
                  {t(locale,"viewRecoveryCases")}
                </LinkButton>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
                {t(locale,"recoveryNetwork")}
              </div>

              <div>
                <div className="rb-numerals text-[38px] font-black leading-none tracking-tight text-navy">
                  {partnerCount.toLocaleString(locale)}
                </div>

                <div className="mt-2 text-[14.5px] leading-6 text-ink-2">
                  {t(locale,"activePartnerOrganizations")}
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4 text-[14px] leading-6 text-ink-2">
                <div>{t(locale,"reviewActiveCases")}</div>
                <div>{t(locale,"followPendingReferrals")}</div>
                <div>{t(locale,"prioritizeOpenNeeds")}</div>
                <div>{t(locale,"keepRecordsCurrent")}</div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/app/partners"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  {t(locale,"viewPartnerNetwork")} →
                </Link>

                <Link
                  href="/app/reports"
                  className="inline-flex text-[14px] font-bold text-blue hover:text-navy hover:no-underline"
                >
                  {t(locale,"viewReportingWorkspace")} →
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}