import { getRequestLocale } from "@/lib/request-locale";
import { t, workspaceLabel } from "@/lib/i18n";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { ORG_TYPES, US_STATES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type PartnerOrg = {
  id: string;
  name: string;
  organization_type: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  created_at?: string | null;
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; state?: string }>;
}) {
  const locale = await getRequestLocale();
  const profile = await requireProfile();
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const type = sp.type?.trim() ?? "";
  const state = sp.state && US_STATES.includes(sp.state) ? sp.state : "";

  const supabase = await createSupabaseServerClient();

  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const isManagedDemo = Array.isArray(demoAccess) && Boolean(demoAccess[0]?.is_demo);

  let query = supabase
    .from("organizations")
    .select("id, name, organization_type, city, state, email, phone, status, created_at")
    .eq("status", "active")
    .order("name", { ascending: true });


  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (type) {
    query = query.eq("organization_type", type);
  }

  if (state) {
    query = query.eq("state", state);
  }

  const { data } = await query;
  const orgs = (data ?? []) as PartnerOrg[];

  return (
    <>
      <PageHeader
        eyebrow={t(locale, "network")}
        title={t(locale, "partners")}
        subtitle={isManagedDemo
          ? t(locale, "demoPartnerListSubtitle")
          : t(locale, "partnerListSubtitle")}
        breadcrumbs={[{ label: t(locale, "network"), href: "/app" }, { label: t(locale, "partners") }]}
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[1fr_180px_140px_auto]"
              action="/app/partners"
              method="get"
            >
              <Input
                label={t(locale, "searchByName")}
                name="q"
                placeholder={t(locale, "organizationName")}
                defaultValue={q}
              />

              <Select label={t(locale, "type")} name="type" defaultValue={type}>
                <option value="">{t(locale, "allTypes")}</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {workspaceLabel(locale, t)}
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
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-bold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  {t(locale, "filter")}
                </button>

                <Link
                  href="/app/partners"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-3 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
                >
                  {t(locale, "reset")}
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {orgs.length === 0 ? (
          <EmptyState
            icon={<Icons.Partners className="h-7 w-7" />}
            title={t(locale, "noMatchingPartners")}
            description={
              q || type || state
                ? t(locale, "partnersNoMatches")
                : t(locale, "partnersEmptyHelp")
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orgs.map((org) => {
              const isMe = org.id === profile.organization_id;
              const orgType = org.organization_type ?? t(locale, "organization");

              return (
                <Link
                  key={org.id}
                  href={`/app/partners/${org.id}`}
                  className="group rounded-md border border-line bg-white p-5 transition hover:border-blue hover:no-underline hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-blue-soft text-navy">
                      <Icons.Building className="h-5 w-5" />
                    </span>

                    {isMe ? (
                      <Badge tone="navy">{t(locale, "yourOrganization")}</Badge>
                    ) : (
                      <Badge tone="blue">{workspaceLabel(locale, orgType)}</Badge>
                    )}
                  </div>

                  <div className="mt-4 text-[16px] font-bold tracking-tight text-navy group-hover:text-blue">
                    {org.name}
                  </div>

                  <div className="mt-1 text-[12.5px] text-ink-3">
                    {[org.city, org.state].filter(Boolean).join(", ") || "—"}
                  </div>

                  <div className="mt-3 space-y-1 text-[13px] leading-5 text-ink-2">
                    {org.email && <div>{org.email}</div>}
                    {org.phone && <div>{org.phone}</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}