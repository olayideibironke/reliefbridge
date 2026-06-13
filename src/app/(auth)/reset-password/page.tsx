import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Alert } from "@/components/ui/Alert";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password — ReliefBridge",
};

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <div>
        <div className="mb-8">
          <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
            Account recovery
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
            This reset link has expired.
          </h1>
        </div>
        <Alert tone="warning">
          The reset link is invalid or has expired. Request a new one from the
          forgot-password page.
        </Alert>
        <div className="mt-5">
          <Link
            href="/forgot-password"
            className="font-semibold text-blue hover:text-navy-light hover:no-underline"
          >
            Request a new reset link →
          </Link>
        </div>
      </div>
    );
  }

  // Quick sanity: if user is fully authenticated but not in recovery flow,
  // it's still fine to let them set a new password.
  void redirect;

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
          Account recovery
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
          Choose a new password.
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
          You&apos;re signed in via your reset link. Set a new password to
          complete recovery.
        </p>
      </div>

      <ResetForm />
    </div>
  );
}
