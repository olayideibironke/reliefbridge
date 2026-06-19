import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { Sidebar } from "@/components/app/Sidebar";
import { TopBar } from "@/components/app/TopBar";
import { MobileHeader } from "@/components/app/MobileHeader";
import { SessionInactivityGuard } from "@/components/app/SessionInactivityGuard";
import type { Profile } from "@/lib/types";

type ProfileWithFullName = Profile & {
  full_name?: string | null;
};

function formatRole(
  role: string | null | undefined,
) {
  if (!role) {
    return "Case Manager";
  }

  return role
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) => character.toUpperCase(),
    );
}

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase =
    await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile =
    (await requireProfile()) as ProfileWithFullName;

  let orgName = "ReliefBridge Workspace";

  if (profile.organization_id) {
    const { data: organization } =
      await supabase
        .from("organizations")
        .select("name")
        .eq(
          "id",
          profile.organization_id,
        )
        .maybeSingle();

    if (organization?.name) {
      orgName = organization.name;
    }
  }

  const profileFullName =
    typeof profile.full_name === "string"
      ? profile.full_name.trim()
      : "";

  const profileFirstAndLastName = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    )
    .join(" ")
    .trim();

  const metadataName =
    typeof user.user_metadata?.full_name ===
    "string"
      ? user.user_metadata.full_name.trim()
      : "";

  const name =
    profileFullName ||
    profileFirstAndLastName ||
    metadataName ||
    user.email ||
    "ReliefBridge User";

  const email = user.email ?? "";
  const role = formatRole(profile.role);

  return (
    <div className="flex min-h-screen bg-surface-2">
      <SessionInactivityGuard />

      <Sidebar
        user={{
          name,
          email,
          role,
        }}
        orgName={orgName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader orgName={orgName} />
        <TopBar orgName={orgName} />

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}