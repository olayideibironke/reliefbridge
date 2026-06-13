import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ReferralStatusBadge } from "@/components/ui/Badge";
import { fullName, formatDateTime } from "@/lib/format";
import type { Organization, Referral, Survivor } from "@/lib/types";
import {
  ReferralStatusControl,
  ReferralNotesEdit,
} from "./ReferralControls";

export const dynamic = "force-dynamic";

type Row = Referral & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name"> | null;
  sender: Pick<Organization, "id" | "name" | "type"> | null;
  receiver: Pick<Organization, "id" | "name" | "type"> | null;
};

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("referrals")
    .select(
      "*, survivors:survivors!referrals_survivor_id_fkey ( id, first_name, last_name ), sender:organizations!referrals_sending_org_fkey ( id, name, type ), receiver:organizations!referrals_receiving_org_fkey ( id, name, type )"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = (data as unknown) as Row;

  const isSender = profile.organization_id === r.sending_org;
  const isReceiver = profile.organization_id === r.receiving_org;

  return (
    <>
      <PageHeader
        eyebrow="Referral"
        title={`${r.category} referral`}
        subtitle={
          r.survivors
            ? `For ${fullName(r.survivors.first_name, r.survivors.last_name)}`
            : "Referral"
        }
        breadcrumbs={[
          { label: "Network", href: "/app" },
          { label: "Referral exchange", href: "/app/referrals" },
          { label: r.category },
        ]}
        actions={<ReferralStatusBadge status={r.status} />}
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Referral details" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field
                  label="Survivor"
                  node={
                    r.survivors ? (
                      <Link
                        href={`/app/survivors/${r.survivors.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(r.survivors.first_name, r.survivors.last_name)}
                      </Link>
                    ) : (
                      "—"
                    )
                  }
                />
                <Field label="Category" node={<span className="font-semibold text-navy">{r.category}</span>} />
                <Field label="Sending organization" value={r.sender?.name ?? "—"} />
                <Field label="Receiving organization" value={r.receiver?.name ?? "—"} />
                <Field label="Created" value={formatDateTime(r.created_at)} />
                {r.responded_at && <Field label="Responded" value={formatDateTime(r.responded_at)} />}
                {r.completed_at && <Field label="Completed" value={formatDateTime(r.completed_at)} />}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notes shared with partner" />
            <CardBody>
              {r.notes ? (
                <div className="whitespace-pre-line rounded-sm border border-line bg-surface-2 px-4 py-3 text-[14px] leading-6 text-ink">
                  {r.notes}
                </div>
              ) : (
                <div className="rounded-sm border border-dashed border-line bg-surface-2 px-4 py-6 text-center text-[13px] text-ink-3">
                  No notes were sent with this referral.
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {(isSender || isReceiver) && (
            <ReferralStatusControl
              id={r.id}
              current={r.status}
              side={isReceiver ? "receiver" : "sender"}
            />
          )}
          {isSender && <ReferralNotesEdit id={r.id} notes={r.notes} />}
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
      <dd className="mt-1 text-[14px] text-ink">{node ?? value ?? "—"}</dd>
    </div>
  );
}
