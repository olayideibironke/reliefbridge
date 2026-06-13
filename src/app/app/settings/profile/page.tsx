import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "../SettingsNav";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your profile — ReliefBridge" };

export default async function UserProfileSettingsPage() {
  const profile = await requireProfile();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Your profile"
        subtitle="How you appear to teammates and partners across ReliefBridge."
        breadcrumbs={[{ label: "Settings", href: "/app" }, { label: "Profile" }]}
      />
      <div className="px-6 py-8 md:px-10">
        <SettingsNav />
        <ProfileForm profile={profile} />
      </div>
    </>
  );
}
