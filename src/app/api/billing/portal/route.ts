import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripePost } from "@/lib/stripe-rest";

function billingRedirect(request: Request, reason: string) {
  const url = new URL("/app/settings/billing", request.url);
  url.searchParams.set("portal_error", reason);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return billingRedirect(request, "session");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role, access_status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id || profile.access_status !== "active" ||
        !["owner", "admin"].includes(String(profile.role).toLowerCase())) {
      return billingRedirect(request, "permission");
    }

    const { data: billing, error: billingError } = await supabase
      .from("organization_billing")
      .select("stripe_customer_id")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (billingError) throw billingError;
    if (!billing?.stripe_customer_id) return billingRedirect(request, "customer");

    const params = new URLSearchParams();
    params.set("customer", billing.stripe_customer_id);
    params.set("return_url", `${new URL(request.url).origin}/app/settings/billing`);

    const session = await stripePost("/billing_portal/sessions", params);
    if (!session?.url || typeof session.url !== "string" ||
        !session.url.startsWith("https://billing.stripe.com/")) {
      throw new Error("Stripe did not return a valid billing portal URL.");
    }
    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("ReliefBridge billing portal session failed:", error instanceof Error ? error.message : "Unknown portal error");
    return billingRedirect(request, "unavailable");
  }
}
