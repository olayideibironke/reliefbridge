import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "../SettingsNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing — ReliefBridge" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ service_suspended?: string; portal_error?: string }> }) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  if (Array.isArray(demoAccess) && demoAccess[0]?.is_demo) redirect("/app");

  const role = String(profile.role ?? "").toLowerCase();
  const canManage = ["owner", "admin"].includes(role);

  const { data: billing } = profile.organization_id
    ? await supabase.from("organization_billing")
        .select("stripe_subscription_status, licensed_organizational_users, current_period_end, cancel_at_period_end, stripe_customer_id")
        .eq("organization_id", profile.organization_id).maybeSingle()
    : { data: null };

  const status = String(billing?.stripe_subscription_status ?? "not_configured").toLowerCase();
  const activeSubscription = Boolean(billing && !["not_configured", "checkout_pending", "canceled"].includes(status));
  const suspended = ["unpaid", "canceled", "incomplete_expired", "paused"].includes(status);
  const paymentAttention = ["past_due", "incomplete"].includes(status);

  return (
    <>
      <PageHeader eyebrow="Settings" title="Billing" subtitle="Manage your ReliefBridge Complete subscription and licensed organizational users." breadcrumbs={[{ label: "Settings", href: "/app/settings/organization" }, { label: "Billing" }]} />
      <div className="px-6 py-8 md:px-10">
        <SettingsNav />
        {sp.portal_error && (
          <div role="alert" className="mb-6 max-w-3xl rounded-md border border-red bg-red-soft p-4">
            <p className="font-bold text-red">Billing management could not be opened</p>
            <p className="mt-1 text-sm text-ink-2">
              {sp.portal_error === "session" ? "Your session has expired. Please sign in again."
                : sp.portal_error === "permission" ? "An active organization owner or administrator is required."
                : sp.portal_error === "customer" ? "This organization does not have a linked Stripe customer yet."
                : "Stripe could not open your billing portal. Your subscription has not been changed. Please try again shortly or contact ReliefBridge support."}
            </p>
          </div>
        )}
        {(suspended || sp.service_suspended === "1") && (
          <div className="mb-6 max-w-3xl rounded-md border border-red bg-red-soft p-4">
            <p className="font-bold text-red">Service suspended for non-payment</p>
            <p className="mt-1 text-sm text-ink-2">Your organization data is preserved. An owner or administrator can use Manage billing below to resolve payment. Service restores automatically after Stripe confirms an active subscription.</p>
          </div>
        )}
        {paymentAttention && (
          <div className="mb-6 max-w-3xl rounded-md border border-gold-dark bg-blue-pale p-4">
            <p className="font-bold text-navy">Payment requires attention</p>
            <p className="mt-1 text-sm text-ink-2">Stripe is attempting payment recovery. Please update the payment method to avoid service suspension.</p>
          </div>
        )}
        <div className="max-w-3xl rounded-lg border border-line bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-blue">ReliefBridge Complete</p><h2 className="mt-1 text-2xl font-bold text-navy">$749/month</h2><p className="mt-2 max-w-xl text-sm text-ink-2">Includes up to 15 licensed organizational users, implementation and onboarding. Survivor records and survivor-facing access are not billed as organizational seats.</p></div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-2">{status}</span>
          </div>
          <div className="mt-6 border-t border-line pt-6">
            {billing ? (
              <>
                <p className="text-sm text-ink-2">Licensed organizational users: <strong className="text-navy">{billing.licensed_organizational_users}</strong></p>
                {billing.current_period_end && <p className="mt-1 text-sm text-ink-2">Current period ends {new Date(billing.current_period_end).toLocaleDateString("en-US")}.</p>}
                {billing.cancel_at_period_end && <p className="mt-2 text-sm font-semibold text-amber-700">Cancellation is scheduled for the end of the current billing period.</p>}
                {canManage && billing.stripe_customer_id && <form action="/api/billing/portal" method="post" className="mt-5"><button className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white" type="submit">Manage billing</button></form>}
              </>
            ) : canManage ? (
              <form action="/api/billing/checkout" method="post">
                <label className="block text-sm font-semibold text-navy" htmlFor="licensed_users">Total licensed organizational users</label>
                <p className="mt-1 text-sm text-ink-2">15 are included. Each additional organizational user is $49/month.</p>
                <input id="licensed_users" name="licensed_users" type="number" min="15" max="500" defaultValue="15" className="mt-3 w-32 rounded-md border border-line bg-white px-3 py-2 text-sm text-navy" required />
                <div className="mt-5"><button className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white" type="submit">Continue to secure checkout</button></div>
              </form>
            ) : <p className="text-sm text-ink-2">An organization owner or administrator can manage billing.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
