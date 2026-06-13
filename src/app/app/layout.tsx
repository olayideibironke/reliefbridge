import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ensureOrgForCurrentUser } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar } from "@/components/app/TopBar";
import { MobileHeader } from "@/components/app/MobileHeader";
import { LABELS } from "@/lib/constants";
import { fullName } from "@/lib/format";
import type { Profile, Organization } from "@/lib/types";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    redirect("/login");
  }

  await ensureOrgForCurrentUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userRes.user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  let org: Organization | null = null;
  if (profile.organization_id) {
    const { data: orgRow } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    org = (orgRow as Organization | null) ?? null;
  }

  const profileTyped = profile as Profile;
  const displayName = fullName(profileTyped.first_name, profileTyped.last_name);
  const displayRole = LABELS.role[profileTyped.role] ?? "Member";
  const orgName = org?.name ?? "Set up your organization";

  return (
    <div className="flex min-h-screen bg-surface-2">
      <Sidebar
        user={{
          name: displayName === "Unnamed" ? userRes.user.email ?? "Account" : displayName,
          email: userRes.user.email ?? "",
          role: displayRole,
        }}
        orgName={orgName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader orgName={orgName} />
        <TopBar orgName={orgName} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
