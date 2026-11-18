import { getRequestLocale } from "@/lib/request-locale";
import { t, workspaceLabel } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import {
  CaseStatusBadge,
  NeedStatusBadge,
  PriorityBadge,
  ReferralStatusBadge,
} from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { fullName, formatDate, relativeDate } from "@/lib/format";
import type {
  Profile,
  RecoveryCase,
  Referral,
  Survivor,
  UnmetNeed,
} from "@/lib/types";
import { SurvivorEdit } from "./SurvivorEdit";
import { SurvivorMessageComposer } from "./SurvivorMessageComposer";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic = "force-dynamic";

export default async function SurvivorDetailPage({
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
  const { data: capability } = profile.organization_id ? await supabase.from("organization_capabilities").select("communications_mode").eq("organization_id", profile.organization_id).maybeSingle() : { data: null };
  const survivorMessagingEnabled = capability?.communications_mode === "staff_survivor";

  const { data: survivorRow } = await supabase
    .from("survivors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!survivorRow) notFound();
  const survivor = survivorRow as Survivor;

  const [
    { data: cases },
    { data: needs },
    { data: referrals },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("recovery_cases")
      .select("*")
      .eq("survivor_id", id)
      .order("opened_at", { ascending: false }),
    supabase
      .from("unmet_needs")
      .select("*")
      .eq("survivor_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("referrals")
      .select("id, category, status, created_at, sending_org, receiving_org")
      .eq("survivor_id", id)
      .order("created_at", { ascending: false }),
    profile.organization_id
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("organization_id", profile.organization_id)
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  const caseList = (cases ?? []) as RecoveryCase[];
  const needList = (needs ?? []) as UnmetNeed[];
  const referralList = (referrals ?? []) as Pick<
    Referral,
    "id" | "category" | "status" | "created_at" | "sending_org" | "receiving_org"
  >[];
  const memberList = (members ?? []) as Pick<
    Profile,
    "id" | "first_name" | "last_name" | "email"
  >[];

  const { data: communicationRows } = survivorMessagingEnabled ? await supabase.from("survivor_communications").select("id,subject,body,status,sent_at,created_at").eq("survivor_id", id).order("created_at", { ascending: false }).limit(25) : { data: [] };
  const communications = communicationRows ?? [];

  const managerOptions = memberList.map((m) => ({
    id: m.id,
    label: fullName(m.first_name, m.last_name) === "Unnamed" ? (m.email ?? "Member") : fullName(m.first_name, m.last_name),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "survivorRecord")}
        title={fullName(survivor.first_name, survivor.last_name)}
        subtitle={
          [survivor.disaster_event, survivor.county, survivor.state]
            .filter(Boolean)
            .join(" · ") || t(locale, "survivorRecordSubtitle")
        }
        breadcrumbs={[
          { label: t(locale, "workspace"), href: "/app" },
          { label: t(locale, "survivors"), href: "/app/survivors" },
          { label: fullName(survivor.first_name, survivor.last_name) },
        ]}
        actions={!isManagedDemo && !isPlatformStaff ? (
          <>
            <LinkButton
              href={`/app/cases/new?survivor=${survivor.id}`}
              variant="outline"
              size="md"
            >
              <Icons.Cases className="h-4 w-4" />
              {t(locale, "newCase")}
            </LinkButton>
            <LinkButton
              href={`/app/referrals/new?survivor=${survivor.id}`}
              size="md"
            >
              <Icons.Referrals className="h-4 w-4" />
              {t(locale, "sendReferral")}
            </LinkButton>
          </>
        ) : undefined}
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t(locale, "contactAndEvent")} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field label={t(locale, "phone")} value={survivor.phone} />
                <Field label={t(locale, "email")} value={survivor.email} />
                <Field label={t(locale, "disasterEvent")} value={survivor.disaster_event} />
                <Field label={t(locale, "householdSize")} value={survivor.household_size?.toString() ?? null} />
                <Field
                  label={t(locale, "location")}
                  value={
                    survivor.county
                      ? `${survivor.county}${survivor.state ? `, ${survivor.state}` : ""}`
                      : survivor.state
                  }
                />
                <Field
                  label={t(locale, "consent")}
                  value={
                    survivor.consent_given
                      ? `${t(locale, "consentGranted")} ${formatDate(survivor.consent_given_at, locale)}`
                      : t(locale, "consentNotGranted")
                  }
                />
                <Field label={t(locale, "added")} value={formatDate(survivor.created_at, locale)} />
                <Field label={t(locale, "updated")} value={formatDate(survivor.updated_at, locale)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t(locale, "recoveryCases")}
              actions={!isManagedDemo && !isPlatformStaff ? (
                <Link
                  href={`/app/cases/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + {t(locale, "newCase")}
                </Link>
              ) : undefined}
            />
            {caseList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Cases className="h-6 w-6" />}
                title={t(locale, "noSurvivorCases")}
                description={t(locale, "noSurvivorCasesHelp")}
                action={!isManagedDemo && !isPlatformStaff ? (
                  <LinkButton href={`/app/cases/new?survivor=${survivor.id}`}>
                    {t(locale, "openFirstCase")}
                  </LinkButton>
                ) : undefined}
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <Tr>
                    <Th>{t(locale, "case")}</Th>
                    <Th>{t(locale, "priority")}</Th>
                    <Th>{t(locale, "status")}</Th>
                    <Th align="right">{t(locale, "opened")}</Th>
                  </Tr>
                </THead>
                <tbody>
                  {caseList.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <Link
                          href={`/app/cases/${c.id}`}
                          className="font-semibold text-navy hover:text-blue hover:no-underline"
                        >
                          {c.primary_need ?? c.disaster_type ?? t(locale, "case")}
                        </Link>
                      </Td>
                      <Td>
                        <PriorityBadge locale={locale} priority={c.priority} />
                      </Td>
                      <Td>
                        <CaseStatusBadge locale={locale} status={c.status} />
                      </Td>
                      <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                        {relativeDate(c.opened_at, locale)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>

          <Card>
            <CardHeader
              title={t(locale, "unmetNeeds")}
              actions={!isManagedDemo && !isPlatformStaff ? (
                <Link
                  href={`/app/unmet-needs/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + {t(locale, "addNeed")}
                </Link>
              ) : undefined}
            />
            {needList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Needs className="h-6 w-6" />}
                title={t(locale, "noSurvivorNeeds")}
                description={t(locale, "noSurvivorNeedsHelp")}
              />
            ) : (
              <ul className="divide-y divide-line">
                {needList.map((n) => (
                  <li
                    key={n.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-navy">
                        {workspaceLabel(locale, n.category)}
                      </div>
                      <div className="mt-0.5 text-[13.5px] text-ink-2">
                        {n.description}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge locale={locale} priority={n.priority} />
                      <NeedStatusBadge locale={locale} status={n.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title={t(locale, "referrals")}
              actions={!isManagedDemo && !isPlatformStaff ? (
                <Link
                  href={`/app/referrals/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + {t(locale, "sendReferral")}
                </Link>
              ) : undefined}
            />
            {referralList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Referrals className="h-6 w-6" />}
                title={t(locale, "noSurvivorReferrals")}
                description={t(locale, "noSurvivorReferralsHelp")}
              />
            ) : (
              <ul className="divide-y divide-line">
                {referralList.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/app/referrals/${r.id}`}
                        className="text-[13.5px] font-bold text-navy hover:text-blue hover:no-underline"
                      >
                        {workspaceLabel(locale, r.category)}
                      </Link>
                      <div className="text-[12px] text-ink-3">
                        {relativeDate(r.created_at, locale)}
                      </div>
                    </div>
                    <ReferralStatusBadge locale={locale} status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column: edit */}
        <div className="space-y-6">
          {survivorMessagingEnabled ? <Card>
            <CardHeader title={t(locale, "survivorCommunication")} />
            <CardBody>
              {!isManagedDemo ? <SurvivorMessageComposer survivorId={survivor.id} survivorEmail={survivor.email} consentGiven={Boolean(survivor.consent_given)} /> : <div className="mb-4 rounded-sm border border-line bg-surface px-3 py-2 text-[12px] text-ink-3">{t(locale, "demoCommunicationReadOnly")}</div>}
              <div className="mt-5 border-t border-line pt-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[.12em] text-ink-3">{t(locale, "communicationHistory")}</div>
                {communications.length ? <div className="space-y-3">{communications.map((c) => <div key={c.id} className="rounded-sm border border-line p-3"><div className="flex items-start justify-between gap-3"><div className="text-[13px] font-bold text-navy">{c.subject}</div><span className="text-[10px] font-bold uppercase tracking-wide text-ink-3">{workspaceLabel(locale, c.status)}</span></div><div className="mt-1 line-clamp-3 whitespace-pre-wrap text-[12.5px] leading-5 text-ink-2">{c.body}</div><div className="mt-2 text-[11px] text-ink-3">{relativeDate(c.sent_at ?? c.created_at, locale)}</div></div>)}</div> : <div className="text-[12.5px] text-ink-3">{t(locale, "noSurvivorCommunications")}</div>}
              </div>
            </CardBody>
          </Card> : null}
          <Card>
            <CardHeader title={t(locale, "coordination")} />
            <CardBody padded={false}>
              {!isManagedDemo && !isPlatformStaff ? <SurvivorEdit
                id={survivor.id}
                defaults={{
                  status: survivor.status,
                  assigned_case_manager: survivor.assigned_case_manager,
                  notes: survivor.notes,
                }}
                managers={managerOptions}
              /> : <div className="p-5 text-[13px] text-ink-3">{t(locale, "demoCoordinationReadOnly")}</div>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-ink">{value || "—"}</dd>
    </div>
  );
}
