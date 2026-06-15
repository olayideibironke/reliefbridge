import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DataTable,
  THead,
  Tr,
  Th,
  Td,
} from "@/components/ui/Table";
import { Icons } from "@/components/ui/Icons";
import { relativeDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo Requests — ReliefBridge",
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

type DemoRequestRow = {
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
  created_at: string;
  updated_at: string;
};

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

function normalize(
  value: string | null | undefined
): string {
  return (value ?? "").trim().toLowerCase();
}

function requestMatchesSearch(
  request: DemoRequestRow,
  query: string
): boolean {
  if (!query) {
    return true;
  }

  const searchableValues = [
    request.first_name,
    request.last_name,
    request.work_email,
    request.phone,
    request.organization_name,
    request.organization_type,
    request.role_title,
    request.state,
    request.organization_size,
    request.recovery_focus,
    request.preferred_contact,
    request.message,
  ];

  return searchableValues.some((value) =>
    normalize(value).includes(query)
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-[12px] font-semibold text-ink-3">
          {label}
        </div>

        <div className="rb-numerals mt-2 text-[34px] font-black tracking-tight text-navy">
          {value}
        </div>

        <div className="mt-1 text-[12px] leading-5 text-ink-3">
          {hint}
        </div>
      </CardBody>
    </Card>
  );
}

export default async function DemoRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const profile = await requireProfile();

  const role =
    typeof profile.role === "string"
      ? profile.role.trim().toLowerCase()
      : "";

  const isPlatformAdmin =
    profile.organization_id ===
      PLATFORM_ORGANIZATION_ID &&
    (role === "owner" || role === "admin");

  if (!isPlatformAdmin) {
    redirect("/app");
  }

  const parameters = await searchParams;

  const searchQuery =
    parameters.q?.trim().toLowerCase() ?? "";

  const selectedStatus =
    typeof parameters.status === "string" &&
    DEMO_REQUEST_STATUSES.includes(
      parameters.status as DemoRequestStatus
    )
      ? (parameters.status as DemoRequestStatus)
      : "";

  const supabase =
    await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("demo_requests")
    .select(
      [
        "id",
        "first_name",
        "last_name",
        "work_email",
        "phone",
        "organization_name",
        "organization_type",
        "role_title",
        "state",
        "organization_size",
        "recovery_focus",
        "preferred_contact",
        "message",
        "status",
        "created_at",
        "updated_at",
      ].join(",")
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(500);

  const allRequests =
    ((data ?? []) as unknown) as DemoRequestRow[];

  const visibleRequests = allRequests.filter(
    (request) => {
      const matchesStatus =
        !selectedStatus ||
        request.status === selectedStatus;

      const matchesSearch =
        requestMatchesSearch(
          request,
          searchQuery
        );

      return matchesStatus && matchesSearch;
    }
  );

  const totalCount = allRequests.length;

  const newCount = allRequests.filter(
    (request) => request.status === "New"
  ).length;

  const qualifiedCount = allRequests.filter(
    (request) =>
      request.status === "Qualified"
  ).length;

  const scheduledCount = allRequests.filter(
    (request) =>
      request.status === "Demo Scheduled"
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Platform Administration"
        title="Demo requests"
        subtitle="Review prospective organizations, track outreach, qualify opportunities, and manage scheduled demonstrations."
        breadcrumbs={[
          {
            label: "Administration",
            href: "/app",
          },
          {
            label: "Demo requests",
          },
        ]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total requests"
            value={totalCount}
            hint="All website demo inquiries"
          />

          <KpiCard
            label="New"
            value={newCount}
            hint="Awaiting first contact"
          />

          <KpiCard
            label="Qualified"
            value={qualifiedCount}
            hint="Strong potential organizations"
          />

          <KpiCard
            label="Demo scheduled"
            value={scheduledCount}
            hint="Upcoming demonstrations"
          />
        </section>

        <Card>
          <CardBody>
            <form
              action="/app/demo-requests"
              method="get"
              className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]"
            >
              <div>
                <label
                  htmlFor="q"
                  className="mb-2 block text-[13px] font-bold text-navy"
                >
                  Search requests
                </label>

                <input
                  id="q"
                  name="q"
                  type="search"
                  defaultValue={
                    parameters.q ?? ""
                  }
                  placeholder="Search by contact, organization, email, focus, or state"
                  className="h-11 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] text-ink outline-none placeholder:text-ink-3 focus:border-blue focus:ring-2 focus:ring-blue/10"
                />
              </div>

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
                  defaultValue={selectedStatus}
                  className="h-11 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/10"
                >
                  <option value="">
                    All statuses
                  </option>

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
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-bold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  Filter
                </button>

                <Link
                  href="/app/demo-requests"
                  className="inline-flex h-11 items-center justify-center rounded-sm border border-line bg-white px-4 text-[13.5px] font-bold text-ink-2 hover:border-blue hover:text-blue hover:no-underline"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {error ? (
          <Card>
            <CardBody>
              <div className="rounded-sm border border-red/20 bg-red/5 px-4 py-3 text-[13.5px] text-red">
                Could not load demo requests.{" "}
                {error.message}
              </div>
            </CardBody>
          </Card>
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            icon={
              <Icons.Reports className="h-7 w-7" />
            }
            title="No demo requests found"
            description={
              searchQuery || selectedStatus
                ? "No demo requests match the selected filters."
                : "New website demo requests will appear here automatically."
            }
          />
        ) : (
          <Card>
            <div className="border-b border-line px-5 py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-[16px] font-bold text-navy">
                    Demo request inbox
                  </h2>

                  <p className="mt-1 text-[12.5px] text-ink-3">
                    Select a request to review
                    details, update its status, and
                    record internal notes.
                  </p>
                </div>

                <div className="rb-numerals text-[12.5px] font-semibold text-ink-3">
                  Showing{" "}
                  {visibleRequests.length} of{" "}
                  {totalCount}
                </div>
              </div>
            </div>

            <DataTable className="rounded-none border-0">
              <THead>
                <Tr>
                  <Th>Contact</Th>
                  <Th>Organization</Th>
                  <Th>Primary focus</Th>
                  <Th>Preferred contact</Th>
                  <Th>Status</Th>
                  <Th align="right">
                    Submitted
                  </Th>
                  <Th align="right">
                    Action
                  </Th>
                </Tr>
              </THead>

              <tbody>
                {visibleRequests.map(
                  (request) => {
                    const detailHref =
                      `/app/demo-requests/${request.id}`;

                    return (
                      <Tr key={request.id}>
                        <Td>
                          <div className="min-w-[180px]">
                            <Link
                              href={detailHref}
                              className="font-semibold text-navy hover:text-blue hover:no-underline"
                            >
                              {
                                request.first_name
                              }{" "}
                              {
                                request.last_name
                              }
                            </Link>

                            <a
                              href={`mailto:${request.work_email}`}
                              className="mt-1 block text-[12.5px] text-blue hover:text-navy hover:no-underline"
                            >
                              {
                                request.work_email
                              }
                            </a>

                            <div className="mt-0.5 text-[12px] text-ink-3">
                              {
                                request.role_title
                              }
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <div className="min-w-[190px]">
                            <Link
                              href={detailHref}
                              className="font-semibold text-ink hover:text-blue hover:no-underline"
                            >
                              {
                                request.organization_name
                              }
                            </Link>

                            <div className="mt-1 text-[12px] leading-5 text-ink-3">
                              {
                                request.organization_type
                              }
                              {request.state
                                ? ` · ${request.state}`
                                : ""}
                            </div>
                          </div>
                        </Td>

                        <Td>
                          <div className="max-w-[220px] text-[13px] leading-5 text-ink-2">
                            {request.recovery_focus ??
                              "Not provided"}
                          </div>
                        </Td>

                        <Td>
                          <div className="text-[13px] font-semibold text-ink-2">
                            {
                              request.preferred_contact
                            }
                          </div>

                          {request.phone && (
                            <a
                              href={`tel:${request.phone}`}
                              className="mt-1 block text-[12px] text-blue hover:text-navy hover:no-underline"
                            >
                              {request.phone}
                            </a>
                          )}
                        </Td>

                        <Td>
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${statusClasses(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </Td>

                        <Td
                          align="right"
                          className="rb-numerals whitespace-nowrap text-[12.5px] text-ink-3"
                        >
                          {relativeDate(
                            request.created_at
                          )}
                        </Td>

                        <Td align="right">
                          <Link
                            href={detailHref}
                            className="inline-flex h-9 whitespace-nowrap items-center justify-center rounded-sm border border-line bg-white px-3 text-[12.5px] font-bold text-navy hover:border-blue hover:bg-blue-pale hover:text-blue hover:no-underline"
                          >
                            View details
                          </Link>
                        </Td>
                      </Tr>
                    );
                  }
                )}
              </tbody>
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}