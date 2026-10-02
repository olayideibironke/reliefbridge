import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { SurvivorForm } from "./SurvivorForm";

export const metadata: Metadata = {
  title: "Add survivor — ReliefBridge",
};

export default async function NewSurvivorPage() {
  const supabase = await createSupabaseServerClient();
  const { data: demoAccess } = await supabase.rpc("get_my_demo_access");
  if (Array.isArray(demoAccess) && demoAccess[0]?.is_demo) redirect("/app/survivors");
  return (
    <>
      <PageHeader
        eyebrow="Survivors · New"
        title="Add a survivor record"
        subtitle="A survivor record is the foundation for every recovery case, unmet need, and referral."
        breadcrumbs={[
          { label: "Workspace", href: "/app" },
          { label: "Survivors", href: "/app/survivors" },
          { label: "New" },
        ]}
      />
      <div className="px-6 py-8 md:px-10">
        <SurvivorForm />
      </div>
    </>
  );
}
