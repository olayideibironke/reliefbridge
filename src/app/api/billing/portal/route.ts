import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { stripePost } from "@/lib/stripe-rest";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, access_status")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id || profile.access_status !== "active" ||
      !["owner", "admin"].includes(String(profile.role).toLowerCase())) {
    return NextResponse.json({ error: "Owner or admin access required." }, { status: 403 });
  }

  const { data: billing } = await supabase
    .from("organization_billing")
    .select("stripe_customer_id")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (!billing?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/app/settings/billing", request.url), 303);
  }

  const params = new URLSearchParams();
  params.set("customer", billing.stripe_customer_id);
  params.set("return_url", `${new URL(request.url).origin}/app/settings/billing`);
  const session = await stripePost("/billing_portal/sessions", params);
  return NextResponse.redirect(session.url, 303);
}
