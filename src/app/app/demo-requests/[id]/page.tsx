import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui/Card";

import { updateDemoRequestAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo Request Details — ReliefBridge",
};

const PLATFORM_ORGANIZATION_ID =
  "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

const DEMO_REQUEST_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Demo Scheduled",
  "Closed",
] as const;

type DemoRequestStatus =
  (typeof DEMO_REQUEST_STATUSES)[number];

type DemoRequest = {
  id: string;
  first_name: string;
  last_name: string;
  work_email: string;
  phone: string | null;
  organization_name: string;
  organization_type: string;
  role_title: string;
  state: string | null;
  organization_size: string | null;
  recovery_focus: string | null;
  preferred_contact: string;
  message: string | null;
  status: DemoRequestStatus;
  source: string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  scheduled_at: string | null;
};

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClasses(
  status: DemoRequestStatus
): string {
  switch (status) {
    case "New":
      return "border-blue/20 bg-blue-soft text-blue";

    case "Contacted":
      return "border-gold/25 bg-gold/10 text-[#8A5A00]";

    case "Qualified":
      return "border-green/20 bg-green/10 text-green";

    case "Demo Scheduled":
      return "border-purple-300 bg-purple-50 text-purple-700";

    case "Closed":
      return "border-line bg-surface-2 text-ink-3";

    default:
      return "border-line bg-surface-2 text-ink-3";
  }
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-line py-4 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </div>

      <div className="min-w-0 text-[14px] leading-6 text-ink">
        {children ?? value ?? "Not provided"}
      </div>
    </div>
  );
}

export default async function DemoRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
}) {
  const profile = await requireProfile();

  const role =
    typeof profile.role === "string"
      ? profile.role.trim().toLowerCase()
      : "";

  const isPlatformAdmin =
    profile.organization_id === PLATFORM_ORGANIZATION_ID &&
    (role === "owner" || role === "admin");

  if (!isPlatformAdmin) {
    redirect("/app");
  }

  const { id } = await params;
  const queryParameters = await searchParams;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("demo_requests")
    .select(
      "id, first_name, last_name, work_email, phone, organization_name, organization_type, role_title, state, organization_size, recovery_focus, preferred_contact, message, status, source, internal_notes, created_at, updated_at, contacted_at, scheduled_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Could not load demo-request details:",
      error
    );
  }

  if (!data) {
    notFound();
  }

  const request =
    data as unknown as DemoRequest;

  const fullName =
    `${request.first_name} ${request.last_name}`.trim();

  return (
    <>
      <PageHeader
        eyebrow="Platform Administration"
        title={request.organization_name}
        subtitle={`Demo request from ${fullName}, ${request.role_title}.`}
        breadcrumbs={[
          {
            label: "Administration",
            href: "/app",
          },
          {
            label: "Demo requests",
            href: "/app/demo-requests",
          },
          {
            label: request.organization_name,
          },
        ]}
        actions={
          <Link
            href="/app/demo-requests"
            className="inline-flex h-11 items-center justify-center rounded-sm border border-line bg-white px-4 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
          >
            Back to inbox
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        {queryParameters.saved === "1" && (
          <div
            role="status"
            className="rounded-md border border-green/25 bg-green/10 px-5 py-4 text-[13.5px] font-semibold text-green"
          >
            Demo request updated successfully.
          </div>
        )}

        {queryParameters.error && (
          <div
            role="alert"
            className="rounded-md border border-red/25 bg-red/5 px-5 py-4 text-[13.5px] font-semibold text-red"
          >
            {queryParameters.error}
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Request overview"
                subtitle="Contact and organization information submitted through the ReliefBridge website."
              />

              <CardBody>
                <DetailRow label="Status">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[12px] font-bold ${statusClasses(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </DetailRow>

                <DetailRow
                  label="Contact name"
                  value={fullName}
                />

                <DetailRow label="Work email">
                  <a
                    href={`mailto:${request.work_email}`}
                    className="font-semibold text-blue hover:text-navy hover:no-underline"
                  >
                    {request.work_email}
                  </a>
                </DetailRow>

                <DetailRow label="Phone">
                  {request.phone ? (
                    <a
                      href={`tel:${request.phone}`}
                      className="font-semibold text-blue hover:text-navy hover:no-underline"
                    >
                      {request.phone}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </DetailRow>

                <DetailRow
                  label="Role or title"
                  value={request.role_title}
                />

                <DetailRow
                  label="Preferred contact"
                  value={request.preferred_contact}
                />

                <DetailRow
                  label="Organization"
                  value={request.organization_name}
                />

                <DetailRow
                  label="Organization type"
                  value={request.organization_type}
                />

                <DetailRow
                  label="State"
                  value={request.state}
                />

                <DetailRow
                  label="Organization size"
                  value={
                    request.organization_size
                      ? `${request.organization_size} employees`
                      : null
                  }
                />

                <DetailRow
                  label="Primary focus"
                  value={request.recovery_focus}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Organization message"
                subtitle="The recovery coordination needs described by the prospective organization."
              />

              <CardBody>
                <div className="whitespace-pre-wrap rounded-sm border border-line bg-surface-2 px-5 py-4 text-[14px] leading-7 text-ink-2">
                  {request.message ||
                    "No additional message was provided."}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Activity"
                subtitle="Key timestamps associated with this request."
              />

              <CardBody>
                <DetailRow
                  label="Submitted"
                  value={formatDateTime(
                    request.created_at
                  )}
                />

                <DetailRow
                  label="First contacted"
                  value={formatDateTime(
                    request.contacted_at
                  )}
                />

                <DetailRow
                  label="Last updated"
                  value={formatDateTime(
                    request.updated_at
                  )}
                />

                <DetailRow
                  label="Demo scheduled"
                  value={formatDateTime(
                    request.scheduled_at
                  )}
                />

                <DetailRow
                  label="Source"
                  value={request.source}
                />
              </CardBody>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader
                title="Manage request"
                subtitle="Update the opportunity status and keep private administrative notes."
              />

              <CardBody>
                <form
                  action={updateDemoRequestAction}
                  className="space-y-5"
                >
                  <input
                    type="hidden"
                    name="request_id"
                    value={request.id}
                  />

                  <div>
                    <label
                      htmlFor="status"
                      className="mb-2 block text-[13px] font-bold text-navy"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      name="status"
                      defaultValue={request.status}
                      className="h-11 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/10"
                    >
                      {DEMO_REQUEST_STATUSES.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-[12px] leading-5 text-ink-3">
                      The first move beyond New automatically
                      records the initial contact time.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="internal_notes"
                      className="mb-2 block text-[13px] font-bold text-navy"
                    >
                      Internal notes
                    </label>

                    <textarea
                      id="internal_notes"
                      name="internal_notes"
                      defaultValue={
                        request.internal_notes ?? ""
                      }
                      maxLength={5000}
                      rows={10}
                      placeholder="Record outreach, qualification details, follow-up commitments, decision makers, and next steps."
                      className="w-full resize-y rounded-sm border border-line bg-white px-3.5 py-3 text-[14px] leading-6 text-ink outline-none placeholder:text-ink-3 focus:border-blue focus:ring-2 focus:ring-blue/10"
                    />

                    <p className="mt-2 text-[12px] leading-5 text-ink-3">
                      These notes are visible only to authorized
                      ReliefBridge platform administrators.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-blue px-5 text-[14px] font-bold text-white hover:bg-navy-light"
                  >
                    Save request updates
                  </button>
                </form>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Contact actions"
                subtitle="Reach the requester directly."
              />

              <CardBody className="space-y-3">
                <a
                  href={`mailto:${request.work_email}?subject=${encodeURIComponent(
                    `Your ReliefBridge demo request — ${request.organization_name}`
                  )}`}
                  className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-navy px-4 text-[13.5px] font-bold text-white hover:bg-navy-light hover:no-underline"
                >
                  Email {request.first_name}
                </a>

                {request.phone && (
                  <a
                    href={`tel:${request.phone}`}
                    className="inline-flex h-11 w-full items-center justify-center rounded-sm border border-line bg-white px-4 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
                  >
                    Call {request.phone}
                  </a>
                )}
              </CardBody>
            </Card>
          </aside>
        </section>
      </div>
    </>
  );
}