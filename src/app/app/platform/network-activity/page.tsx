import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export const dynamic = "force-dynamic";

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString();
}

export default async function NetworkActivity() {
  const profile = await requireProfile();
  const role = (profile.role ?? "").toLowerCase();

  if (profile.organization_id !== PLATFORM || !["owner", "admin"].includes(role)) {
    redirect("/app");
  }

  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [survivors, recoveryCases, unmetNeeds, referrals, organizations] =
    await Promise.all([
      supabase.from("survivors").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("recovery_cases").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("unmet_needs").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("referrals").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase
        .from("organizations")
        .select("id,name,organization_type,city,state,status,created_at")
        .eq("is_demo_network", false)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const metrics = [
    { label: "New survivors", value: survivors.count ?? 0, icon: Icons.Survivors },
    { label: "New recovery cases", value: recoveryCases.count ?? 0, icon: Icons.Cases },
    { label: "New unmet needs", value: unmetNeeds.count ?? 0, icon: Icons.Needs },
    { label: "New referrals", value: referrals.count ?? 0, icon: Icons.Referrals },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Network Activity"
        subtitle="A seven-day operational pulse across the ReliefBridge network."
      />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12.5px] font-bold text-ink-2">{label}</div>
                    <div className="rb-numerals mt-2 text-[34px] font-black text-navy">
                      {value.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11.5px] text-ink-3">Last 7 days</div>
                  </div>
                  <span className="grid h-10 w-10 place-items-center rounded-sm bg-blue-soft text-blue">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader
            title="Recently added organizations"
            subtitle="Latest production, network, and managed-demo organizations. Synthetic demo partners are excluded."
          />
          <CardBody padded={false}>
            <div className="divide-y divide-line">
              {(organizations.data ?? []).map((organization) => {
                const location = [organization.city, organization.state]
                  .filter((value): value is string => typeof value === "string" && value.length > 0)
                  .join(", ");

                return (
                  <div
                    key={organization.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <div className="font-bold text-navy">
                        {organization.name || "Unnamed organization"}
                      </div>
                      <div className="mt-1 text-[12px] text-ink-3">
                        {organization.organization_type || "Organization"} · {location || "Location not set"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-ink-3">
                        {organization.status || "unknown"}
                      </div>
                      <div className="mt-1 text-[11.5px] text-ink-3">
                        {formatDate(organization.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
