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
  const profile = await requireProfile();
  const sp = await searchParams;

  const q = sp.q?.trim() ?? "";
  const type = sp.type?.trim() ?? "";
  const state = sp.state && US_STATES.includes(sp.state) ? sp.state : "";

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("organizations")
    .select("id, name, organization_type, city, state, email, phone, status, created_at")
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
        eyebrow="Network"
        title="Partner organizations"
        subtitle="Directory of every organization in the ReliefBridge network — housing, legal aid, repair, faith-based, county, and more."
        breadcrumbs={[{ label: "Network", href: "/app" }, { label: "Partner organizations" }]}
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
                label="Search by name"
                name="q"
                placeholder="Organization name"
                defaultValue={q}
              />

              <Select label="Type" name="type" defaultValue={type}>
                <option value="">All types</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>

              <Select label="State" name="state" defaultValue={state}>
                <option value="">All states</option>
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
                  Filter
                </button>

                <Link
                  href="/app/partners"
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-3 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {orgs.length === 0 ? (
          <EmptyState
            icon={<Icons.Partners className="h-7 w-7" />}
            title="No organizations match"
            description={
              q || type || state
                ? "No partner organizations match those filters."
                : "Once partner organizations join the ReliefBridge network they'll appear here."
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orgs.map((org) => {
              const isMe = org.id === profile.organization_id;
              const orgType = org.organization_type ?? "Organization";

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
                      <Badge tone="navy">Your organization</Badge>
                    ) : (
                      <Badge tone="blue">{orgType}</Badge>
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