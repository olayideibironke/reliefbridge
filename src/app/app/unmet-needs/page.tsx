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
import { NeedStatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import { LABELS, NEED_CATEGORIES, NEED_STATUSES } from "@/lib/constants";
import type { NeedCategory, NeedStatus, Survivor, UnmetNeed } from "@/lib/types";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic = "force-dynamic";

type Row = UnmetNeed & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name"> | null;
};

export default async function UnmetNeedsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const isPlatformStaff = profile.organization_id === PLATFORM && ["manager", "staff"].includes(String(profile.role ?? "").toLowerCase());
  const sp = await searchParams;

  const category = NEED_CATEGORIES.includes(sp.category as NeedCategory)
    ? (sp.category as NeedCategory)
    : "";

  const status = NEED_STATUSES.includes(sp.status as NeedStatus)
    ? (sp.status as NeedStatus)
    : "";

  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo = Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);

  let query = supabase
    .from("unmet_needs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250);

  if (!isPlatformStaff && profile.organization_id) query = query.eq("organization_id", profile.organization_id);

  if (category) query = query.eq("category", category);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  const needs = (data ?? []) as UnmetNeed[];
  const survivorIds = Array.from(
    new Set(needs.map((need) => need.survivor_id).filter(Boolean))
  );

  const { data: survivorData } = survivorIds.length
    ? await supabase
        .from("survivors")
        .select("id, first_name, last_name")
        .in("id", survivorIds)
    : { data: [] };

  const survivorsById = new Map(
    (survivorData ?? []).map((survivor) => [survivor.id, survivor])
  );

  const rows: Row[] = needs.map((need) => ({
    ...need,
    survivors: need.survivor_id
      ? (survivorsById.get(need.survivor_id) ?? null)
      : null,
  }));

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "workspace")}
        title={t(locale, "unmetNeeds")}
        subtitle={t(locale, "needListSubtitle")}
        breadcrumbs={[{ label: t(locale, "workspace"), href: "/app" }, { label: t(locale, "unmetNeeds") }]}
        actions={!isManagedDemo && !isPlatformStaff ? (
          <LinkButton href="/app/unmet-needs/new">
            <Icons.Plus className="h-4 w-4" />
            {t(locale, "addNeed")}
          </LinkButton>
        ) : undefined}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[200px_180px_auto]"
              action="/app/unmet-needs"
              method="get"
            >
              <Select label={t(locale, "category")} name="category" defaultValue={category}>
                <option value="">{t(locale, "allCategories")}</option>
                {NEED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {workspaceLabel(locale, c)}
                  </option>
                ))}
              </Select>

              <Select label={t(locale, "status")} name="status" defaultValue={status}>
                <option value="">{t(locale, "allStatuses")}</option>
                {NEED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {workspaceLabel(locale, LABELS.needStatus[s])}
                  </option>
                ))}
              </Select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-bold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  {t(locale, "filter")}
                </button>

                <Link
                  href="/app/unmet-needs"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-3 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
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
              <div className="text-red">{t(locale, "needsLoadError")} {locale === "en" && error.message}</div>
            </CardBody>
          </Card>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Icons.Needs className="h-7 w-7" />}
            title={t(locale, "noNeeds")}
            description={
              category || status
                ? t(locale, "needsNoMatches")
                : t(locale, "needsEmptyHelp")
            }
            action={!isManagedDemo && !isPlatformStaff ? (
              <LinkButton href="/app/unmet-needs/new">
                <Icons.Plus className="h-4 w-4" />
                {t(locale, "captureFirstNeed")}
              </LinkButton>
            ) : undefined}
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
              <THead>
                <Tr>
                  <Th>{t(locale, "survivor")}</Th>
                  <Th>{t(locale, "category")}</Th>
                  <Th>{t(locale, "description")}</Th>
                  <Th>{t(locale, "priority")}</Th>
                  <Th>{t(locale, "status")}</Th>
                  <Th align="right">{t(locale, "captured")}</Th>
                </Tr>
              </THead>

              <tbody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      {r.survivors ? (
                        <Link
                          href={`/app/survivors/${r.survivors.id}`}
                          className="font-semibold text-navy hover:text-blue hover:no-underline"
                        >
                          {fullName(r.survivors.first_name, r.survivors.last_name)}
                        </Link>
                      ) : r.survivor_id ? (
                        <Link
                          href={`/app/survivors/${r.survivor_id}`}
                          className="font-semibold text-navy hover:text-blue hover:no-underline"
                        >
                          {t(locale, "linkedSurvivor")}
                        </Link>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </Td>

                    <Td>
                      <span className="font-semibold text-navy">{workspaceLabel(locale, r.category)}</span>
                    </Td>

                    <Td className="max-w-md">
                      <div className="truncate">{r.description ?? "—"}</div>
                    </Td>

                    <Td>
                      <PriorityBadge locale={locale} priority={r.priority ?? "medium"} />
                    </Td>

                    <Td>
                      <NeedStatusBadge locale={locale} status={r.status} />
                    </Td>

                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {relativeDate(r.created_at, locale)}
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