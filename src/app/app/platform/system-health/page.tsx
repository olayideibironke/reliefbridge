import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  const profile = await requireProfile();
  const role = String(profile.role ?? "").toLowerCase();
  if (profile.organization_id !== PLATFORM || !["owner", "admin"].includes(role)) redirect("/app");

  const supabase = await createSupabaseServerClient();
  const [organizations, profiles, audit, demos] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.rpc("get_platform_audit_count"),
    supabase.from("demo_workspaces").select("id", { count: "exact", head: true }),
  ]);

  const checks = [
    { name: "Organization directory", ok: !organizations.error, detail: organizations.error?.message || `${organizations.count ?? 0} records readable` },
    { name: "Identity directory", ok: !profiles.error, detail: profiles.error?.message || `${profiles.count ?? 0} profiles readable` },
    { name: "Administrative audit trail", ok: !audit.error, detail: audit.error?.message || `${audit.data ?? 0} events readable` },
    { name: "Managed demo controls", ok: !demos.error, detail: demos.error?.message || `${demos.count ?? 0} workspaces readable` },
  ];
  const healthy = checks.filter((check) => check.ok).length;

  return (
    <>
      <PageHeader
        eyebrow="Oversight"
        title="System Health"
        subtitle="Live application-level checks for ReliefBridge administrative data paths."
      />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <div className="text-[12px] font-bold uppercase tracking-[.14em] text-blue">Current status</div>
            <div className="mt-2 text-3xl font-black text-navy">{healthy}/{checks.length} checks operational</div>
            <p className="mt-2 text-[12.5px] leading-5 text-ink-3">These checks validate authenticated ReliefBridge data access. They do not claim external infrastructure or third-party service uptime.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Application control checks" subtitle="Evaluated when this page loads." />
          <CardBody padded={false}>
            <div className="divide-y divide-line">
              {checks.map((check) => (
                <div key={check.name} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div><div className="font-bold text-navy">{check.name}</div><div className="mt-1 text-[12px] text-ink-3">{check.detail}</div></div>
                  <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.08em] ${check.ok ? "bg-blue-soft text-blue" : "bg-red-50 text-red"}`}>{check.ok ? "Operational" : "Attention"}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
