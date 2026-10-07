import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const BILLING_ALLOWED_STATUSES = new Set(["active", "trialing"]);
const BILLING_RECOVERY_STATUSES = new Set(["past_due", "incomplete"]);
const BILLING_BLOCKED_STATUSES = new Set(["unpaid", "canceled", "incomplete_expired", "paused"]);

async function enforceDemoAccess(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase.rpc("get_my_demo_access");
  const demo = Array.isArray(data) ? data[0] : null;
  if (error || !demo?.is_demo) return;
  const expired = demo.status !== "active" || new Date(demo.expires_at).getTime() <= Date.now();
  if (expired) {
    await supabase.auth.signOut();
    redirect("/login?demo_expired=1");
  }
  await supabase.rpc("touch_my_demo_access");
}

async function enforceBillingAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profile: Profile,
) {
  if (!profile.organization_id || profile.organization_id === PLATFORM_ORGANIZATION_ID) return;

  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  const demo = Array.isArray(demoAccess) ? demoAccess[0] : null;
  if (demo?.is_demo) return;

  const { data: billing, error } = await supabase
    .from("organization_billing")
    .select("stripe_subscription_status")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  // Existing/pre-billing organizations continue unchanged until a billing record exists.
  if (error || !billing) return;

  const status = String(billing.stripe_subscription_status ?? "").toLowerCase();
  if (BILLING_ALLOWED_STATUSES.has(status) || BILLING_RECOVERY_STATUSES.has(status) || status === "checkout_pending") return;

  if (BILLING_BLOCKED_STATUSES.has(status)) {
    const role = String(profile.role ?? "").toLowerCase();
    if (["owner", "admin"].includes(role)) redirect("/app/settings/billing?service_suspended=1");
    await supabase.auth.signOut();
    redirect("/login?billing_suspended=1");
  }
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  await enforceDemoAccess(supabase);
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  await enforceDemoAccess(supabase);

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profileError) throw new Error(`Could not load the signed-in ReliefBridge profile: ${profileError.message}`);
  if (!profile) return null;

  if (profile.access_status === "disabled") {
    await supabase.auth.signOut();
    redirect("/login?access_disabled=1");
  }

  const { data: organizationAccess } = await supabase.rpc("get_my_organization_access");
  const access = Array.isArray(organizationAccess) ? organizationAccess[0] : null;
  if (access && access.allowed === false) {
    await supabase.auth.signOut();
    redirect("/login?organization_disabled=1");
  }

  if (
    profile.organization_id === PLATFORM_ORGANIZATION_ID &&
    ["owner", "admin", "manager", "staff"].includes(String(profile.role ?? "").toLowerCase()) &&
    profile.access_status === "active"
  ) {
    await supabase.rpc("touch_my_platform_access");
  }

  await enforceBillingAccess(supabase, profile as unknown as Profile);
  return profile as unknown as Profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) throw new Error("This signed-in account does not have a ReliefBridge profile.");
  if (!profile.organization_id) throw new Error("This ReliefBridge profile is not connected to an organization.");
  return profile;
}
