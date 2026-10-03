import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export const dynamic = "force-dynamic";

export default async function AccessControlPage() {
  const profile = await requireProfile();
  const role = String(profile.role ?? "").toLowerCase();
  if (profile.organization_id !== PLATFORM || !["owner", "admin"].includes(role)) redirect("/app");

  const supabase = await createSupabaseServerClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,role,access_status,last_access_at")
    .eq("organization_id", PLATFORM)
    .order("created_at");

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Access Control"
        subtitle="Review protected platform roles, account state, and administrative authority."
        actions={<LinkButton href="/app/platform/staff" variant="outline">Staff Management</LinkButton>}
      />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardHeader title="Permission boundaries" subtitle="Super Admin authority is protected and cannot be delegated by a regular Admin." />
          <CardBody padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-[.08em] text-ink-3">
                  <tr><th className="px-5 py-3">Capability</th><th className="px-5 py-3">Super Admin</th><th className="px-5 py-3">Admin</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ["View platform operations", "Allowed", "Allowed"],
                    ["View organizations and network activity", "Allowed", "Allowed"],
                    ["View audit history", "Allowed", "Allowed"],
                    ["Invite platform administrators", "Allowed", "Protected"],
                    ["Disable or remove administrators", "Allowed", "Protected"],
                    ["Disable or reactivate organizations", "Allowed", "Protected"],
                    ["Create or promote Super Admin", "Protected", "Protected"],
                  ].map(([capability, owner, admin]) => (
                    <tr key={capability}><td className="px-5 py-3 font-semibold text-navy">{capability}</td><td className="px-5 py-3 text-ink-2">{owner}</td><td className="px-5 py-3 text-ink-2">{admin}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Platform identities" subtitle="Current administrative identities and access state." />
          <CardBody padded={false}>
            <div className="divide-y divide-line">
              {(staff ?? []).map((member) => (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <div className="font-bold text-navy">{[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email || "Platform user"}</div>
                    <div className="mt-1 text-[12px] text-ink-3">{member.email || "No email"} · {String(member.role).toLowerCase() === "owner" ? "Super Admin" : "Admin"}</div>
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[.08em] text-ink-3">{member.access_status || "active"}</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
