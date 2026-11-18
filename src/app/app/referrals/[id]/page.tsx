import { getRequestLocale } from "@/lib/request-locale";
import { t, workspaceLabel } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ReferralStatusBadge } from "@/components/ui/Badge";
import { fullName, formatDateTime } from "@/lib/format";
import type { Referral, Survivor } from "@/lib/types";

import {
  ReferralStatusControl,
  ReferralNotesEdit,
} from "./ReferralControls";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic = "force-dynamic";

type RelatedOrganization = {
  id: string;
  name: string;
};

type Row = Referral & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name"> | null;
  sender: RelatedOrganization | null;
  receiver: RelatedOrganization | null;
};

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const isPlatformStaff = profile.organization_id === PLATFORM && ["manager", "staff"].includes(String(profile.role ?? "").toLowerCase());
  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo = Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);

  const { data, error } = await supabase
    .from("referrals")
    .select(
      "*, survivors:survivors!referrals_survivor_id_fkey ( id, first_name, last_name ), sender:organizations!referrals_sending_org_fkey ( id, name ), receiver:organizations!referrals_receiving_org_fkey ( id, name )",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load referral: ${error.message}`);
  }

  if (!data) {
    notFound();
  }

  const r = data as unknown as Row;

  const isSender = profile.organization_id === r.sending_org;
  const isReceiver = profile.organization_id === r.receiving_org;

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "referral")}
        title={locale === "en" ? `${r.category} referral` : `${t(locale, "referral")} · ${workspaceLabel(locale, r.category)}`}
        subtitle={
          r.survivors
            ? `${t(locale, "forPerson")} ${fullName(
                r.survivors.first_name,
                r.survivors.last_name,
              )}`
            : t(locale, "referral")
        }
        breadcrumbs={[
          { label: t(locale, "network"), href: "/app" },
          { label: t(locale, "referralExchange"), href: "/app/referrals" },
          { label: workspaceLabel(locale, r.category) },
        ]}
        actions={<ReferralStatusBadge locale={locale} status={r.status} />}
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t(locale, "referralDetails")} />

            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field
                  label={t(locale, "survivor")}
                  node={
                    r.survivors ? (
                      <Link
                        href={`/app/survivors/${r.survivors.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(
                          r.survivors.first_name,
                          r.survivors.last_name,
                        )}
                      </Link>
                    ) : (
                      "—"
                    )
                  }
                />

                <Field
                  label={t(locale, "category")}
                  node={
                    <span className="font-semibold text-navy">
                      {workspaceLabel(locale, r.category)}
                    </span>
                  }
                />

                <Field
                  label={t(locale, "sendingOrganization")}
                  value={r.sender?.name ?? "—"}
                />

                <Field
                  label={t(locale, "receivingOrganization")}
                  value={r.receiver?.name ?? "—"}
                />

                <Field
                  label={t(locale, "created")}
                  value={formatDateTime(r.created_at, locale)}
                />

                {r.responded_at && (
                  <Field
                    label={t(locale, "respondedDate")}
                    value={formatDateTime(r.responded_at, locale)}
                  />
                )}

                {r.completed_at && (
                  <Field
                    label={t(locale, "completedDate")}
                    value={formatDateTime(r.completed_at, locale)}
                  />
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t(locale, "partnerNotes")} />

            <CardBody>
              {r.notes ? (
                <div className="whitespace-pre-line rounded-sm border border-line bg-surface-2 px-4 py-3 text-[14px] leading-6 text-ink">
                  {r.notes}
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-line bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">
                  {t(locale, "noPartnerNotes")}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {!isManagedDemo && !isPlatformStaff && (isSender || isReceiver) && (
            <ReferralStatusControl
              id={r.id}
              current={r.status}
              side={isReceiver ? "receiver" : "sender"}
            />
          )}

          {!isManagedDemo && !isPlatformStaff && isSender && (
            <ReferralNotesEdit id={r.id} notes={r.notes} />
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  node,
}: {
  label: string;
  value?: string | null;
  node?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>

      <dd className="mt-1 text-[14px] text-ink">
        {node ?? value ?? "—"}
      </dd>
    </div>
  );
}