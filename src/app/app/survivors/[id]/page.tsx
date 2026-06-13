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

export const dynamic = "force-dynamic";

export default async function SurvivorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

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

  const managerOptions = memberList.map((m) => ({
    id: m.id,
    label: fullName(m.first_name, m.last_name) === "Unnamed" ? (m.email ?? "Member") : fullName(m.first_name, m.last_name),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Survivor record"
        title={fullName(survivor.first_name, survivor.last_name)}
        subtitle={
          [survivor.disaster_event, survivor.county, survivor.state]
            .filter(Boolean)
            .join(" · ") || "Survivor coordinated by your organization."
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Survivors", href: "/app/survivors" },
          { label: fullName(survivor.first_name, survivor.last_name) },
        ]}
        actions={
          <>
            <LinkButton
              href={`/app/cases/new?survivor=${survivor.id}`}
              variant="outline"
              size="md"
            >
              <Icons.Cases className="h-4 w-4" />
              New case
            </LinkButton>
            <LinkButton
              href={`/app/referrals/new?survivor=${survivor.id}`}
              size="md"
            >
              <Icons.Referrals className="h-4 w-4" />
              Send referral
            </LinkButton>
          </>
        }
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        {/* Left: details */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Contact & event" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field label="Phone" value={survivor.phone} />
                <Field label="Email" value={survivor.email} />
                <Field label="Disaster event" value={survivor.disaster_event} />
                <Field label="Household size" value={survivor.household_size?.toString() ?? null} />
                <Field
                  label="Location"
                  value={
                    survivor.county
                      ? `${survivor.county}${survivor.state ? `, ${survivor.state}` : ""}`
                      : survivor.state
                  }
                />
                <Field
                  label="Consent"
                  value={
                    survivor.consent_given
                      ? `Granted ${formatDate(survivor.consent_given_at)}`
                      : "Not granted"
                  }
                />
                <Field label="Added" value={formatDate(survivor.created_at)} />
                <Field label="Updated" value={formatDate(survivor.updated_at)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recovery cases"
              actions={
                <Link
                  href={`/app/cases/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + New case
                </Link>
              }
            />
            {caseList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Cases className="h-6 w-6" />}
                title="No cases open for this survivor"
                description="Open a recovery case to track lifecycle, status, and notes."
                action={
                  <LinkButton href={`/app/cases/new?survivor=${survivor.id}`}>
                    Open first case
                  </LinkButton>
                }
              />
            ) : (
              <DataTable className="rounded-none border-0">
                <THead>
                  <Tr>
                    <Th>Case</Th>
                    <Th>Priority</Th>
                    <Th>Status</Th>
                    <Th align="right">Opened</Th>
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
                          {c.primary_need ?? c.disaster_type ?? "Case"}
                        </Link>
                      </Td>
                      <Td>
                        <PriorityBadge priority={c.priority} />
                      </Td>
                      <Td>
                        <CaseStatusBadge status={c.status} />
                      </Td>
                      <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                        {relativeDate(c.opened_at)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Unmet needs"
              actions={
                <Link
                  href={`/app/unmet-needs/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + Add need
                </Link>
              }
            />
            {needList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Needs className="h-6 w-6" />}
                title="No needs captured"
                description="Capture unmet needs to coordinate referrals across partner organizations."
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
                        {n.category}
                      </div>
                      <div className="mt-0.5 text-[13.5px] text-ink-2">
                        {n.description}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={n.priority} />
                      <NeedStatusBadge status={n.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Referrals"
              actions={
                <Link
                  href={`/app/referrals/new?survivor=${survivor.id}`}
                  className="text-[12.5px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  + Send referral
                </Link>
              }
            />
            {referralList.length === 0 ? (
              <EmptyState
                className="m-5"
                icon={<Icons.Referrals className="h-6 w-6" />}
                title="No referrals yet"
                description="Send a referral to a partner organization for housing, repair, legal aid, or other needs."
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
                        {r.category}
                      </Link>
                      <div className="text-[12px] text-ink-3">
                        {relativeDate(r.created_at)}
                      </div>
                    </div>
                    <ReferralStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right column: edit */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Coordination" />
            <CardBody padded={false}>
              <SurvivorEdit
                id={survivor.id}
                defaults={{
                  status: survivor.status,
                  assigned_case_manager: survivor.assigned_case_manager,
                  notes: survivor.notes,
                }}
                managers={managerOptions}
              />
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
