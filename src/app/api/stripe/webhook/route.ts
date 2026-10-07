import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  stripeGet,
  verifyStripeSignature,
  STRIPE_COMPLETE_PRICE_ID,
  STRIPE_ADDITIONAL_USER_PRICE_ID,
} from "@/lib/stripe-rest";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, any> };
};

async function syncSubscription(subscription: Record<string, any>, fallbackOrgId?: string) {
  const admin = createSupabaseAdminClient();
  const orgId = subscription.metadata?.organization_id || fallbackOrgId;
  if (!orgId) return;

  const items = subscription.items?.data ?? [];
  const additionalItem = items.find(
    (item: any) => item.price?.id === STRIPE_ADDITIONAL_USER_PRICE_ID
  );
  const baseItem = items.find(
    (item: any) => item.price?.id === STRIPE_COMPLETE_PRICE_ID
  );
  const licensedUsers = 15 + Number(additionalItem?.quantity ?? 0);

  await admin.from("organization_billing").upsert({
    organization_id: orgId,
    stripe_customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    stripe_subscription_status: subscription.status ?? "unknown",
    stripe_base_price_id: baseItem?.price?.id ?? STRIPE_COMPLETE_PRICE_ID,
    stripe_additional_user_price_id:
      additionalItem?.price?.id ?? STRIPE_ADDITIONAL_USER_PRICE_ID,
    licensed_organizational_users: licensedUsers,
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const admin = createSupabaseAdminClient();
  const { data: alreadyProcessed } = await admin
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (alreadyProcessed) return NextResponse.json({ received: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    if (subscriptionId) {
      const subscription = await stripeGet(`/subscriptions/${subscriptionId}`);
      await syncSubscription(subscription, session.client_reference_id);
    }
  } else if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncSubscription(event.data.object);
  }

  await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  });

  return NextResponse.json({ received: true });
}
