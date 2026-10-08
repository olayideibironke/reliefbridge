import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  stripePost,
  STRIPE_COMPLETE_PRICE_ID,
  STRIPE_ADDITIONAL_USER_PRICE_ID,
} from "@/lib/stripe-rest";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role, access_status")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id || profile.access_status !== "active") {
    return NextResponse.json({ error: "No active organization." }, { status: 403 });
  }
  if (!["owner", "admin"].includes(String(profile.role).toLowerCase())) {
    return NextResponse.json({ error: "Owner or admin access required." }, { status: 403 });
  }

  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  if (Array.isArray(demoAccess) && demoAccess[0]?.is_demo) {
    return NextResponse.json({ error: "Billing is disabled in demos." }, { status: 403 });
  }

  if (!STRIPE_COMPLETE_PRICE_ID || !STRIPE_ADDITIONAL_USER_PRICE_ID) {
    return NextResponse.json({ error: "Billing prices are not configured." }, { status: 503 });
  }

  const form = await request.formData();
  const requestedUsers = Number(form.get("licensed_users") ?? 15);
  if (!Number.isInteger(requestedUsers) || requestedUsers < 15 || requestedUsers > 500) {
    return NextResponse.json({ error: "Licensed users must be between 15 and 500." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("organization_billing")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    return NextResponse.redirect(new URL("/app/settings/billing?already_subscribed=1", request.url), 303);
  }

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("name, email")
      .eq("id", profile.organization_id)
      .single();

    const customerParams = new URLSearchParams();
    customerParams.set("name", organization?.name ?? "ReliefBridge Organization");
    customerParams.set("email", organization?.email || user.email || "");
    customerParams.set("metadata[organization_id]", profile.organization_id);
    const customer = await stripePost("/customers", customerParams);
    customerId = customer.id;

    const { error: customerSaveError } = await admin.from("organization_billing").upsert({
      organization_id: profile.organization_id,
      stripe_customer_id: customerId,
      stripe_subscription_status: "checkout_pending",
      licensed_organizational_users: requestedUsers,
      stripe_base_price_id: STRIPE_COMPLETE_PRICE_ID,
      stripe_additional_user_price_id: STRIPE_ADDITIONAL_USER_PRICE_ID,
      updated_at: new Date().toISOString(),
    });
    if (customerSaveError) throw customerSaveError;
  }

  // Checkout is not a subscription. Keep the seat choice editable until payment completes.
  const { error: pendingError } = await admin.from("organization_billing").update({
    stripe_subscription_status: "checkout_pending",
    licensed_organizational_users: requestedUsers,
    stripe_base_price_id: STRIPE_COMPLETE_PRICE_ID,
    stripe_additional_user_price_id: STRIPE_ADDITIONAL_USER_PRICE_ID,
    updated_at: new Date().toISOString(),
  }).eq("organization_id", profile.organization_id).is("stripe_subscription_id", null);
  if (pendingError) throw pendingError;

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("customer", customerId);
  params.set("client_reference_id", profile.organization_id);
  params.set("success_url", `${origin}/app/settings/billing?checkout=success`);
  params.set("cancel_url", `${origin}/app/settings/billing?checkout=cancelled`);
  params.set("line_items[0][price]", STRIPE_COMPLETE_PRICE_ID);
  params.set("line_items[0][quantity]", "1");
  params.set("subscription_data[metadata][organization_id]", profile.organization_id);
  params.set("metadata[organization_id]", profile.organization_id);

  const additionalUsers = requestedUsers - 15;
  if (additionalUsers > 0) {
    params.set("line_items[1][price]", STRIPE_ADDITIONAL_USER_PRICE_ID);
    params.set("line_items[1][quantity]", String(additionalUsers));
  }

  const session = await stripePost("/checkout/sessions", params);
  if (!session.url) throw new Error("Stripe Checkout did not return a URL.");

  return NextResponse.redirect(session.url, 303);
}
