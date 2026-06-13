import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "../SettingsNav";
import { NotificationsForm } from "./NotificationsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notification settings — ReliefBridge" };

export default async function NotificationsSettingsPage() {
  const profile = await requireProfile();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Notifications"
        subtitle="Choose what ReliefBridge emails you about."
        breadcrumbs={[{ label: "Settings", href: "/app" }, { label: "Notifications" }]}
      />
      <div className="px-6 py-8 md:px-10">
        <SettingsNav />
        <NotificationsForm profile={profile} />
      </div>
    </>
  );
}
