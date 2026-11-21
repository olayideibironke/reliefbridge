import { getRequestLocale } from "@/lib/request-locale";
import { t, workspaceLabel } from "@/lib/i18n";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import { CaseStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import {
  CASE_STATUSES,
  LABELS,
  PRIORITIES,
} from "@/lib/constants";
import type {
  CaseStatus,
  Priority,
  RecoveryCase,
  Survivor,
} from "@/lib/types";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic = "force-dynamic";

type Row = Pick<
  RecoveryCase,
  "id" | "priority" | "status" | "primary_need" | "disaster_type" | "opened_at"
> & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name" | "state"> | null;
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>;
}) {
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const isPlatformStaff = profile.organization_id === PLATFORM && ["manager", "staff"].includes(String(profile.role ?? "").toLowerCase());
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = CASE_STATUSES.includes(sp.status as CaseStatus) ? (sp.status as CaseStatus) : "";
  const priority = PRIORITIES.includes(sp.priority as Priority) ? (sp.priority as Priority) : "";

  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo = Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);
  let query = supabase
    .from("recovery_cases")
    .select(
      "id, priority, status, primary_need, disaster_type, opened_at, survivors:survivors!recovery_cases_survivor_id_fkey ( id, first_name, last_name, state )"
    )
    .order("opened_at", { ascending: false })
    .limit(250);

  if (!isPlatformStaff) {
    if (profile.organization_id) query = query.eq("organization_id", profile.organization_id);
    else query = query.eq("organization_id", "00000000-0000-0000-0000-000000000000");
  }
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, error } = await query;
  let rows = ((data ?? []) as unknown) as Row[];
  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((r) =>
      fullName(r.survivors?.first_name, r.survivors?.last_name)
        .toLowerCase()
        .includes(needle) ||
      (r.primary_need ?? "").toLowerCase().includes(needle) ||
      (r.disaster_type ?? "").toLowerCase().includes(needle)
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "workspace")}
        title={t(locale, "recoveryCases")}
        subtitle={t(locale, "caseListSubtitle")}
        breadcrumbs={[{ label: t(locale, "workspace"), href: "/app" }, { label: t(locale, "recoveryCases") }]}
        actions={!isManagedDemo && !isPlatformStaff ? (
          <LinkButton href="/app/cases/new">
            <Icons.Plus className="h-4 w-4" />
            {t(locale, "newCase")}
          </LinkButton>
        ) : undefined}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[1fr_180px_160px_auto]"
              action="/app/cases"
              method="get"
            >
              <Input
                label={t(locale, "search")}
                name="q"
                placeholder={t(locale, "caseSearchPlaceholder")}
                defaultValue={q}
              />
              <Select label={t(locale, "status")} name="status" defaultValue={status}>
                <option value="">{t(locale, "allStatuses")}</option>
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {workspaceLabel(locale, LABELS.caseStatus[s])}
                  </option>
                ))}
              </Select>
              <Select label={t(locale, "priority")} name="priority" defaultValue={priority}>
                <option value="">{t(locale, "allPriorities")}</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {workspaceLabel(locale, LABELS.priority[p])}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-semibold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  {t(locale, "filter")}
                </button>
                <Link
                  href="/app/cases"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink-2 hover:border-blue hover:text-blue hover:no-underline"
                >
                  {t(locale, "reset")}
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {error ? (
          <Card>
            <CardBody>
              <div className="text-red">{t(locale, "casesLoadError")} {locale === "en" && error.message}</div>
            </CardBody>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icons.Cases className="h-7 w-7" />}
            title={t(locale, "noCases")}
            description={
              q || status || priority
                ? t(locale, "casesNoMatches")
                : t(locale, "casesEmptyHelp")
            }
            action={!isManagedDemo && !isPlatformStaff ? (
              <LinkButton href="/app/cases/new">
                <Icons.Plus className="h-4 w-4" />
                {t(locale, "openFirstCase")}
              </LinkButton>
            ) : undefined}
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
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
                {rows.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link
                        href={`/app/cases/${c.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(c.survivors?.first_name, c.survivors?.last_name)}
                      </Link>
                      {c.survivors?.state && (
                        <div className="text-[11.5px] text-ink-3">{c.survivors.state}</div>
                      )}
                    </Td>
                    <Td>{c.disaster_type ?? "—"}</Td>
                    <Td>{c.primary_need ?? "—"}</Td>
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
          </Card>
        )}
      </div>
    </>
  );
}
