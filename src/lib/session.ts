import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userRes.user.id)
    .maybeSingle();
  if (error) return null;
  return (data as Profile | null) ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Not authenticated");
  }
  return profile;
}
