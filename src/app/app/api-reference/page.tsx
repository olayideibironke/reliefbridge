import { requireProfile } from "@/lib/session";
import { redirect } from "next/navigation";
import { EndpointExplorer } from "./EndpointExplorer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Internal API Reference | ReliefBridge" };

const endpoints = [
  {
    method: "POST",
    path: "/api/billing/checkout",
    purpose: "Start Stripe Checkout for an organization's subscription.",
    access: "Authenticated active organization owner or administrator; demos excluded.",
    request: "Form data: licensed_users (integer, 15 through 500).",
    responses: "303 redirect to Stripe Checkout; 400 invalid seats; 401 unauthenticated; 403 forbidden; 503 missing price configuration.",
    notes: "Creates or reuses a Stripe customer. An existing non-ended subscription cannot start a second checkout.",
  },
  {
    method: "POST",
    path: "/api/stripe/webhook",
    purpose: "Receive signed Stripe subscription and invoice events.",
    access: "Stripe-Signature verification; not a user-facing endpoint.",
    request: "Signed Stripe event payload.",
    responses: "200 accepted or already processed; 400 invalid signature.",
    notes: "Updates organization billing state and records processed event IDs. Never call this endpoint with fabricated production payment events.",
  },
];

export default async function InternalApiReferencePage() {
  const profile = await requireProfile();
  const role = String(profile.role ?? "").toLowerCase();
  if (!["owner", "admin"].includes(role)) redirect("/app");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">ReliefBridge Engineering</p>
        <h1 className="text-3xl font-bold">Internal API Reference</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Verified application endpoints for authorized ReliefBridge administrators.
          This is an internal reference, not a public partner API or an invitation to send live test payments.
        </p>
      </header>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <h2 className="font-semibold">Access and data protection</h2>
        <p className="mt-2">Application routes must enforce their own authentication and authorization.
          Documentation access does not grant API permissions. Do not use production survivor data for testing.
          External partner access, scoped API credentials, and cross-organization sharing are not enabled here.</p>
      </section>
      <EndpointExplorer endpoints={endpoints} />
      <p className="text-sm text-slate-500">Read-only endpoint explorer. OpenAPI 3.1 specification is maintained in docs/internal-openapi.json. No live requests are executed.</p>
    </main>
  );
}
