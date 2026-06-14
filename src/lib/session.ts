import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

const FALLBACK_ORG_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return profile as unknown as Profile;
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "John Doe";

  const firstName =
    typeof user.user_metadata?.first_name === "string"
      ? user.user_metadata.first_name
      : fullName.split(" ")[0] || "John";

  const lastName =
    typeof user.user_metadata?.last_name === "string"
      ? user.user_metadata.last_name
      : fullName.split(" ").slice(1).join(" ") || "Doe";

  return {
    id: user.id,
    organization_id: FALLBACK_ORG_ID,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email: user.email ?? "",
    title: "Owner",
    phone: null,
    role: "Owner",
    notification_settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    throw new Error("Signed-in user could not be loaded.");
  }

  return profile;
}