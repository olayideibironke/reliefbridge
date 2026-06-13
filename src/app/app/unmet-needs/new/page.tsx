import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { fullName } from "@/lib/format";
import { NeedForm } from "./NeedForm";

export const metadata: Metadata = {
  title: "Capture unmet need — ReliefBridge",
};

export default async function NewNeedPage({
  searchParams,
}: {
  searchParams: Promise<{ survivor?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: survivors } = profile.organization_id
    ? await supabase
        .from("survivors")
        .select("id, first_name, last_name, state, disaster_event")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const options = ((survivors ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    state: string | null;
    disaster_event: string | null;
  }>).map((s) => ({
    id: s.id,
    label: `${fullName(s.first_name, s.last_name)}${s.state ? ` · ${s.state}` : ""}`,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Unmet needs · New"
        title="Capture an unmet need"
        subtitle="Captured needs feed the referral exchange and outcome reporting."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Unmet needs", href: "/app/unmet-needs" },
          { label: "New" },
        ]}
      />
      <div className="px-6 py-8 md:px-10">
        {options.length === 0 ? (
          <EmptyState
            icon={<Icons.Survivors className="h-7 w-7" />}
            title="No survivors yet"
            description="An unmet need is captured against a survivor record. Add a survivor first."
            action={
              <LinkButton href="/app/survivors/new">
                <Icons.Plus className="h-4 w-4" />
                Add survivor first
              </LinkButton>
            }
          />
        ) : (
          <NeedForm survivors={options} defaultSurvivorId={sp.survivor} />
        )}
      </div>
    </>
  );
}
