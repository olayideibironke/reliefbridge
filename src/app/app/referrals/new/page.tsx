import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { fullName } from "@/lib/format";
import { ReferralForm } from "./ReferralForm";

export const metadata: Metadata = {
  title: "Send referral — ReliefBridge",
};

export default async function NewReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ survivor?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id;

  const [{ data: survivors }, { data: partners }] = await Promise.all([
    orgId
      ? supabase
          .from("survivors")
          .select("id, first_name, last_name, state")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("organizations")
      .select("id, name, type, state")
      .neq("id", orgId ?? "00000000-0000-0000-0000-000000000000")
      .order("name", { ascending: true }),
  ]);

  const survivorOptions = ((survivors ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    state: string | null;
  }>).map((s) => ({
    id: s.id,
    label: `${fullName(s.first_name, s.last_name)}${s.state ? ` · ${s.state}` : ""}`,
  }));

  const partnerOptions = ((partners ?? []) as Array<{
    id: string;
    name: string;
    type: string;
    state: string | null;
  }>).map((p) => ({
    id: p.id,
    label: `${p.name} · ${p.type}${p.state ? ` · ${p.state}` : ""}`,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Referrals · New"
        title="Send a referral to a partner"
        subtitle="Refer survivors to vetted partner organizations and track outcomes end-to-end."
        breadcrumbs={[
          { label: "Network", href: "/app" },
          { label: "Referral exchange", href: "/app/referrals" },
          { label: "Send referral" },
        ]}
      />
      <div className="px-6 py-8 md:px-10">
        {survivorOptions.length === 0 ? (
          <EmptyState
            icon={<Icons.Survivors className="h-7 w-7" />}
            title="No survivors yet"
            description="Referrals are sent against survivor records. Add a survivor first."
            action={
              <LinkButton href="/app/survivors/new">
                <Icons.Plus className="h-4 w-4" />
                Add survivor first
              </LinkButton>
            }
          />
        ) : partnerOptions.length === 0 ? (
          <EmptyState
            icon={<Icons.Partners className="h-7 w-7" />}
            title="No partner organizations yet"
            description="Partner organizations show up here once they create ReliefBridge accounts."
          />
        ) : (
          <ReferralForm
            survivors={survivorOptions}
            partners={partnerOptions}
            defaultSurvivorId={sp.survivor}
          />
        )}
      </div>
    </>
  );
}
