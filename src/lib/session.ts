import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

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

  if (!profile) {
    return null;
  }

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