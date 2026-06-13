import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { fullName, formatDate, formatDateTime } from "@/lib/format";
import type {
  CaseNote,
  Profile,
  RecoveryCase,
  Survivor,
} from "@/lib/types";
import { CaseEdit, CaseNoteForm } from "./CaseEdit";

export const dynamic = "force-dynamic";

type CaseWithSurvivor = RecoveryCase & {
  survivors: Survivor | null;
};

type NoteRow = CaseNote & {
  author: Pick<Profile, "first_name" | "last_name" | "email"> | null;
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: caseRow } = await supabase
    .from("recovery_cases")
    .select(
      "*, survivors:survivors!recovery_cases_survivor_id_fkey ( * )"
    )
    .eq("id", id)
    .maybeSingle();
  if (!caseRow) notFound();
  const recoveryCase = caseRow as unknown as CaseWithSurvivor;

  const [{ data: notes }, { data: members }] = await Promise.all([
    supabase
      .from("case_notes")
      .select(
        "id, organization_id, case_id, author_id, body, created_at, author:profiles!case_notes_author_id_fkey ( first_name, last_name, email )"
      )
      .eq("case_id", id)
      .order("created_at", { ascending: false }),
    profile.organization_id
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("organization_id", profile.organization_id)
      : Promise.resolve({ data: [] }),
  ]);

  const noteList = ((notes ?? []) as unknown) as NoteRow[];
  const memberList = (members ?? []) as Pick<
    Profile,
    "id" | "first_name" | "last_name" | "email"
  >[];
  const managerOptions = memberList.map((m) => ({
    id: m.id,
    label:
      fullName(m.first_name, m.last_name) === "Unnamed"
        ? m.email ?? "Member"
        : fullName(m.first_name, m.last_name),
  }));

  const survivor = recoveryCase.survivors;

  return (
    <>
      <PageHeader
        eyebrow="Recovery case"
        title={recoveryCase.primary_need ?? recoveryCase.disaster_type ?? "Case"}
        subtitle={
          survivor
            ? `For ${fullName(survivor.first_name, survivor.last_name)}${
                survivor.state ? ` · ${survivor.state}` : ""
              }`
            : "Recovery case"
        }
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Recovery cases", href: "/app/cases" },
          { label: recoveryCase.primary_need ?? "Case" },
        ]}
        actions={
          survivor ? (
            <LinkButton href={`/app/survivors/${survivor.id}`} variant="outline">
              <Icons.Survivors className="h-4 w-4" />
              Open survivor
            </LinkButton>
          ) : null
        }
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Case at a glance" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field label="Survivor" value={survivor ? fullName(survivor.first_name, survivor.last_name) : "—"} />
                <Field label="Disaster type" value={recoveryCase.disaster_type} />
                <Field label="Primary need" value={recoveryCase.primary_need} />
                <FieldNode label="Priority">
                  <PriorityBadge priority={recoveryCase.priority} />
                </FieldNode>
                <FieldNode label="Status">
                  <CaseStatusBadge status={recoveryCase.status} />
                </FieldNode>
                <Field label="Opened" value={formatDate(recoveryCase.opened_at)} />
                {recoveryCase.status === "closed" && (
                  <Field label="Closed" value={formatDate(recoveryCase.closed_at)} />
                )}
              </dl>
              {recoveryCase.notes && (
                <div className="mt-6 rounded-sm border border-line bg-surface-2 px-4 py-3 text-[13.5px] leading-6 text-ink-2">
                  {recoveryCase.notes}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity timeline" subtitle="Case notes, newest first" />
            <CardBody className="space-y-5">
              <CaseNoteForm caseId={recoveryCase.id} />
              {noteList.length === 0 ? (
                <div className="rounded-sm border border-dashed border-line bg-surface-2 px-4 py-8 text-center text-[13px] text-ink-3">
                  No notes yet. Add the first update above.
                </div>
              ) : (
                <ul className="space-y-3 border-t border-line pt-4">
                  {noteList.map((n) => (
                    <li key={n.id} className="rounded-sm border border-line bg-surface px-4 py-3">
                      <div className="flex items-center justify-between text-[12px] text-ink-3">
                        <span className="font-semibold text-navy">
                          {fullName(n.author?.first_name, n.author?.last_name) === "Unnamed"
                            ? n.author?.email ?? "Member"
                            : fullName(n.author?.first_name, n.author?.last_name)}
                        </span>
                        <span className="rb-numerals">{formatDateTime(n.created_at)}</span>
                      </div>
                      <div className="mt-2 whitespace-pre-line text-[14px] leading-6 text-ink">
                        {n.body}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column: edit */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Update case" />
            <CardBody padded={false}>
              <CaseEdit
                id={recoveryCase.id}
                defaults={{
                  case_manager: recoveryCase.case_manager,
                  priority: recoveryCase.priority,
                  status: recoveryCase.status,
                  primary_need: recoveryCase.primary_need,
                  notes: recoveryCase.notes,
                }}
                managers={managerOptions}
              />
            </CardBody>
          </Card>

          {survivor && (
            <Card>
              <CardHeader title="Linked survivor" />
              <CardBody>
                <div className="space-y-3 text-[13.5px]">
                  <div>
                    <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                      Name
                    </div>
                    <Link
                      href={`/app/survivors/${survivor.id}`}
                      className="text-[14px] font-semibold text-navy hover:text-blue hover:no-underline"
                    >
                      {fullName(survivor.first_name, survivor.last_name)}
                    </Link>
                  </div>
                  <div>
                    <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                      Contact
                    </div>
                    <div className="text-ink-2">{survivor.email ?? "—"}</div>
                    <div className="text-ink-3">{survivor.phone ?? ""}</div>
                  </div>
                  <div>
                    <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                      Location
                    </div>
                    <div className="text-ink-2">
                      {[survivor.county, survivor.state].filter(Boolean).join(", ") || "—"}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-ink">{value || "—"}</dd>
    </div>
  );
}

function FieldNode({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
