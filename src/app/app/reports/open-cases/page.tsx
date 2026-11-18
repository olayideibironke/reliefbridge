import { getRequestLocale } from "@/lib/request-locale";
import { t, workspaceLabel } from "@/lib/i18n";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { BarRow } from "@/components/reports/BarRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { fullName, relativeDate } from "@/lib/format";
import { LABELS } from "@/lib/constants";
import type {
  CaseStatus,
  Priority,
  Survivor,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: locale === "en" ? "Open cases report — ReliefBridge" : t(locale, "reportOpenCases") };
}

type RawCaseRow = {
  id: string;
  priority: string | null;
  status: string | null;
  primary_need: string | null;
  disaster_type: string | null;
  opened_at: string;
  survivors: Pick<
    Survivor,
    "id" | "first_name" | "last_name" | "state"
  > | null;
};

type ReportCaseRow = RawCaseRow & {
  normalizedPriority: Priority;
  normalizedStatus: CaseStatus;
};

function normalizeCaseStatus(value: string | null): CaseStatus {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "in_review") {
    return "in_review";
  }

  if (normalized === "follow_up") {
    return "follow_up";
  }

  if (normalized === "on_hold") {
    return "on_hold";
  }

  if (normalized === "closed") {
    return "closed";
  }

  return "open";
}

function normalizePriority(value: string | null): Priority {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "low") {
    return "low";
  }

  return "medium";
}

export default async function OpenCasesReport() {
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const orgId =
    profile.organization_id ??
    "00000000-0000-0000-0000-000000000000";

  const { data, error } = await supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )",
    )
    .eq("organization_id", orgId)
    .order("opened_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Could not load open cases report: ${error.message}`);
  }

  const rows: ReportCaseRow[] = ((data ?? []) as unknown as RawCaseRow[])
    .map((caseRow) => ({
      ...caseRow,
      normalizedPriority: normalizePriority(caseRow.priority),
      normalizedStatus: normalizeCaseStatus(caseRow.status),
    }))
    .filter((caseRow) => caseRow.normalizedStatus !== "closed");

  const total = rows.length;

  const byStatus = new Map<CaseStatus, number>();
  const byPriority = new Map<Priority, number>();

  for (const caseRow of rows) {
    byStatus.set(
      caseRow.normalizedStatus,
      (byStatus.get(caseRow.normalizedStatus) ?? 0) + 1,
    );

    byPriority.set(
      caseRow.normalizedPriority,
      (byPriority.get(caseRow.normalizedPriority) ?? 0) + 1,
    );
  }

  const percentage = (count: number) =>
    total ? Math.round((count / total) * 100) : 0;

  const visibleStatuses: CaseStatus[] = [
    "open",
    "in_review",
    "follow_up",
    "on_hold",
  ];

  const visiblePriorities: Priority[] = [
    "high",
    "medium",
    "low",
  ];

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "reportReportsOperations")}
        title={t(locale, "openRecoveryCases")}
        subtitle={t(locale, "reportActiveWorkloadDistributionAcrossYourOrganizationMessage")}
        breadcrumbs={[
          { label: t(locale, "insights"), href: "/app" },
          { label: t(locale, "reports"), href: "/app/reports" },
          { label: t(locale, "reportOpenCases") },
        ]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                {t(locale, "reportTotalOpen")}
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {total}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                {t(locale, "reportExcludesClosedCases")}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                {t(locale, "reportHighPriority")}
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {byPriority.get("high") ?? 0}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                {t(locale, "reportSurvivorsNeedingTheMostAttentionNow")}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="text-[12px] font-semibold text-ink-3">
                {t(locale, "reportInReview")}
              </div>

              <div className="rb-numerals mt-2 text-[36px] font-black tracking-tight text-navy">
                {byStatus.get("in_review") ?? 0}
              </div>

              <div className="mt-1 text-[12px] text-ink-3">
                {t(locale, "reportCasesUnderPartnerOrProgramReview")}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title={t(locale, "reportByStatus")} />

            <CardBody>
              {total === 0 ? (
                <div className="text-[13px] text-ink-3">
                  {t(locale, "reportNoOpenCasesMessage")}
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {visibleStatuses.map((status) => {
                    const count = byStatus.get(status) ?? 0;

                    return (
                      <li key={status}>
                        <BarRow
                          label={workspaceLabel(locale, LABELS.caseStatus[status])}
                          count={count}
                          pct={percentage(count)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t(locale, "reportByPriority")} />

            <CardBody>
              {total === 0 ? (
                <div className="text-[13px] text-ink-3">
                  {t(locale, "reportNoOpenCasesMessage")}
                </div>
              ) : (
                <ul className="space-y-3.5">
                  {visiblePriorities.map((priority) => {
                    const count = byPriority.get(priority) ?? 0;

                    return (
                      <li key={priority}>
                        <BarRow
                          label={workspaceLabel(locale, LABELS.priority[priority])}
                          count={count}
                          pct={percentage(count)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title={t(locale, "reportOpenCases")}
            subtitle={t(locale, "reportAllNonClosedCases")}
          />

          {rows.length === 0 ? (
            <EmptyState
              className="m-5"
              icon={<Icons.Cases className="h-7 w-7" />}
              title={t(locale, "reportNoOpenCases")}
              description={t(locale, "reportNoOpenRecoveryCasesForThisOrganizationMessage")}
            />
          ) : (
            <DataTable className="rounded-none border-0">
              <THead>
                <Tr>
                  <Th>{t(locale, "survivor")}</Th>
                  <Th>{t(locale, "event")}</Th>
                  <Th>{t(locale, "primaryNeed")}</Th>
                  <Th>{t(locale, "priority")}</Th>
                  <Th>{t(locale, "status")}</Th>
                  <Th align="right">{t(locale, "opened")}</Th>
                </Tr>
              </THead>

              <tbody>
                {rows.slice(0, 50).map((caseRow) => (
                  <Tr key={caseRow.id}>
                    <Td>
                      <Link
                        href={`/app/cases/${caseRow.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(
                          caseRow.survivors?.first_name,
                          caseRow.survivors?.last_name,
                        )}
                      </Link>
                    </Td>

                    <Td>{caseRow.disaster_type ?? "—"}</Td>

                    <Td>{caseRow.primary_need ?? "—"}</Td>

                    <Td>
                      <PriorityBadge
                        priority={caseRow.normalizedPriority}
                      />
                    </Td>

                    <Td>
                      <CaseStatusBadge
                        status={caseRow.normalizedStatus}
                      />
                    </Td>

                    <Td
                      align="right"
                      className="rb-numerals text-[12.5px] text-ink-3"
                    >
                      {relativeDate(caseRow.opened_at, locale)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          )}
        </Card>
      </div>
    </>
  );
}