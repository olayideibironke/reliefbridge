import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import type { Organization } from "@/lib/types";
import { SettingsNav } from "../SettingsNav";
import { OrgForm } from "./OrgForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization profile — ReliefBridge" };

export default async function OrgSettingsPage() {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  let org: Organization | null = null;
  if (profile.organization_id) {
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    org = (data as Organization | null) ?? null;
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Organization profile"
        subtitle="Public-facing details other ReliefBridge organizations see in the partner directory."
        breadcrumbs={[{ label: "Settings", href: "/app" }, { label: "Organization" }]}
      />
      <div className="px-6 py-8 md:px-10">
        <SettingsNav />
        {!org ? (
          <EmptyState
            icon={<Icons.Building className="h-7 w-7" />}
            title="No organization linked"
            description="Your profile isn't linked to an organization yet. Sign out, then sign in again so the platform can finish setup. If this persists, contact support."
          />
        ) : (
          <OrgForm org={org} />
        )}
      </div>
    </>
  );
}
