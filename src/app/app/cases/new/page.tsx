import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { fullName } from "@/lib/format";
import { CaseForm } from "./CaseForm";

export const metadata: Metadata = {
  title: "Open recovery case — ReliefBridge",
};

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ survivor?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  const orgId = profile.organization_id;

  const [{ data: survivors }, { data: members }] = await Promise.all([
    orgId
      ? supabase
          .from("survivors")
          .select("id, first_name, last_name, state, disaster_event")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    orgId
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("organization_id", orgId)
      : Promise.resolve({ data: [] }),
  ]);

  const survivorOptions = ((survivors ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
    state: string | null;
    disaster_event: string | null;
  }>).map((s) => ({
    id: s.id,
    label: `${fullName(s.first_name, s.last_name)}${s.state ? ` · ${s.state}` : ""}${
      s.disaster_event ? ` · ${s.disaster_event}` : ""
    }`,
  }));

  const managerOptions = ((members ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  }>).map((m) => ({
    id: m.id,
    label:
      fullName(m.first_name, m.last_name) === "Unnamed"
        ? m.email ?? "Member"
        : fullName(m.first_name, m.last_name),
  }));

  return (
    <>
      <PageHeader
        eyebrow="Cases · New"
        title="Open a recovery case"
        subtitle="A recovery case captures the lifecycle of work coordinated for a survivor."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Recovery cases", href: "/app/cases" },
          { label: "New" },
        ]}
      />
      <div className="px-6 py-8 md:px-10">
        {survivorOptions.length === 0 ? (
          <EmptyState
            icon={<Icons.Survivors className="h-7 w-7" />}
            title="No survivors yet"
            description="A recovery case is opened against a survivor record. Create a survivor first."
            action={
              <LinkButton href="/app/survivors/new">
                <Icons.Plus className="h-4 w-4" />
                Add survivor first
              </LinkButton>
            }
          />
        ) : (
          <CaseForm
            survivors={survivorOptions}
            managers={managerOptions}
            defaultSurvivorId={sp.survivor}
          />
        )}
      </div>
    </>
  );
}
