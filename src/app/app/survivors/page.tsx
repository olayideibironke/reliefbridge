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
import { SurvivorStatusBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import { SURVIVOR_STATUSES, US_STATES } from "@/lib/constants";
import { LABELS } from "@/lib/constants";
import type { Survivor, SurvivorStatus } from "@/lib/types";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic = "force-dynamic";

export default async function SurvivorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; state?: string }>;
}) {
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const isPlatformStaff = profile.organization_id === PLATFORM && ["manager", "staff"].includes(String(profile.role ?? "").toLowerCase());
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = SURVIVOR_STATUSES.includes(sp.status as SurvivorStatus)
    ? (sp.status as SurvivorStatus)
    : "";
  const state = sp.state && US_STATES.includes(sp.state) ? sp.state : "";

  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo = Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);

  let query = supabase
    .from("survivors")
    .select("id, first_name, last_name, status, disaster_event, state, county, created_at, phone, email")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!isPlatformStaff) {
    if (profile.organization_id) query = query.eq("organization_id", profile.organization_id);
    else query = query.eq("organization_id", "00000000-0000-0000-0000-000000000000");
  }
  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }
  if (status) query = query.eq("status", status);
  if (state) query = query.eq("state", state);

  const { data, error } = await query;
  const survivors = (data ?? []) as Pick<
    Survivor,
    | "id"
    | "first_name"
    | "last_name"
    | "status"
    | "disaster_event"
    | "state"
    | "county"
    | "created_at"
    | "phone"
    | "email"
  >[];

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "workspace")}
        title={t(locale, "survivors")}
        subtitle={t(locale, "survivorListSubtitle")}
        breadcrumbs={[{ label: t(locale, "workspace"), href: "/app" }, { label: t(locale, "survivors") }]}
        actions={!isManagedDemo && !isPlatformStaff ? (
          <LinkButton href="/app/survivors/new">
            <Icons.Plus className="h-4 w-4" />
            {t(locale, "addSurvivor")}
          </LinkButton>
        ) : undefined}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[1fr_180px_160px_auto]"
              action="/app/survivors"
              method="get"
            >
              <Input
                label={t(locale, "search")}
                name="q"
                placeholder={t(locale, "survivorSearchPlaceholder")}
                defaultValue={q}
              />
              <Select
                label={t(locale, "status")}
                name="status"
                defaultValue={status}
              >
                <option value="">{t(locale, "allStatuses")}</option>
                {SURVIVOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {workspaceLabel(locale, LABELS.survivorStatus[s])}
                  </option>
                ))}
              </Select>
              <Select label={t(locale, "state")} name="state" defaultValue={state}>
                <option value="">{t(locale, "allStates")}</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
                  href="/app/survivors"
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
              <div className="text-red">{t(locale, "survivorsLoadError")} {locale === "en" && error.message}</div>
            </CardBody>
          </Card>
        ) : survivors.length === 0 ? (
          <EmptyState
            icon={<Icons.Survivors className="h-7 w-7" />}
            title={t(locale, "noSurvivors")}
            description={
              q || status || state
                ? t(locale, "survivorsNoMatches")
                : t(locale, "survivorsEmptyHelp")
            }
            action={!isManagedDemo && !isPlatformStaff ? (
              <LinkButton href="/app/survivors/new">
                <Icons.Plus className="h-4 w-4" />
                {t(locale, "addFirstSurvivor")}
              </LinkButton>
            ) : undefined}
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
              <THead>
                <Tr>
                  <Th>{t(locale, "survivor")}</Th>
                  <Th>{t(locale, "disasterEvent")}</Th>
                  <Th>{t(locale, "location")}</Th>
                  <Th>{t(locale, "contact")}</Th>
                  <Th>{t(locale, "status")}</Th>
                  <Th align="right">{t(locale, "added")}</Th>
                </Tr>
              </THead>
              <tbody>
                {survivors.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <Link
                        href={`/app/survivors/${s.id}`}
                        className="font-semibold text-navy hover:text-blue hover:no-underline"
                      >
                        {fullName(s.first_name, s.last_name)}
                      </Link>
                    </Td>
                    <Td>{s.disaster_event ?? "—"}</Td>
                    <Td>
                      {s.county ? `${s.county}${s.state ? `, ${s.state}` : ""}` : s.state ?? "—"}
                    </Td>
                    <Td>
                      {s.email || s.phone ? (
                        <div className="space-y-0.5">
                          {s.email && <div className="text-[12.5px] text-ink-2">{s.email}</div>}
                          {s.phone && <div className="text-[12px] text-ink-3">{s.phone}</div>}
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <SurvivorStatusBadge locale={locale} status={s.status} />
                    </Td>
                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {relativeDate(s.created_at, locale)}
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
