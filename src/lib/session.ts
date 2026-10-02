import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

async function enforceDemoAccess(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const { data, error } = await supabase.rpc("get_my_demo_access");
  const demo = Array.isArray(data) ? data[0] : null;

  // Normal ReliefBridge users have no demo record and continue unchanged.
  if (error || !demo?.is_demo) return;

  const expired =
    demo.status !== "active" ||
    new Date(demo.expires_at).getTime() <= Date.now();

  if (expired) {
    await supabase.auth.signOut();
    redirect("/login?demo_expired=1");
  }

  // Best-effort timestamp for the Demo Hub's Last access column.
  await supabase.rpc("touch_my_demo_access");
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  await enforceDemoAccess(supabase, user.id);
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;
  await enforceDemoAccess(supabase, user.id);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Could not load the signed-in ReliefBridge profile: ${profileError.message}`,
    );
  }

  if (!profile) return null;
  return profile as unknown as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    throw new Error(
      "This signed-in account does not have a ReliefBridge profile.",
    );
  }

  if (!profile.organization_id) {
    throw new Error(
      "This ReliefBridge profile is not connected to an organization.",
    );
  }

  return profile;
}
