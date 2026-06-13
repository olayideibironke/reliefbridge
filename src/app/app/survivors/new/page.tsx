import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SurvivorForm } from "./SurvivorForm";

export const metadata: Metadata = {
  title: "Add survivor — ReliefBridge",
};

export default function NewSurvivorPage() {
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
