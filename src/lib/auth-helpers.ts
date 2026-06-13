import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { OrgType } from "@/lib/types";

/**
 * If the current user has no organization yet, create one from the org_*
 * fields stored in user_metadata during signup, and set the user as its owner.
 *
 * Safe to call on every authenticated request — it's a no-op when a profile
 * is already linked to an org.
 */
export async function ensureOrgForCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", userRes.user.id)
    .maybeSingle();

  if (!profile || profile.organization_id) return;

  const meta = (userRes.user.user_metadata ?? {}) as Record<string, unknown>;
  const orgName = typeof meta.org_name === "string" ? meta.org_name : null;
  const orgType = typeof meta.org_type === "string" ? (meta.org_type as OrgType) : null;
  const orgState = typeof meta.org_state === "string" ? meta.org_state : null;
  const orgCity = typeof meta.org_city === "string" ? meta.org_city : null;

  if (!orgName || !orgType) return;

  const { data: org } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      type: orgType,
      state: orgState,
      city: orgCity,
    })
    .select()
    .single();

  if (!org) return;

  await supabase
    .from("profiles")
    .update({ organization_id: org.id, role: "owner" })
    .eq("id", userRes.user.id);
}
