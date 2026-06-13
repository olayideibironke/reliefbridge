import Link from "next/link";
import type { Metadata } from "next";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = {
  title: "Reset your password — ReliefBridge",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
          Account recovery
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
          Reset your ReliefBridge password.
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
          Enter the email associated with your account. We&apos;ll send a secure
          link to reset your password.
        </p>
      </div>

      <ForgotForm />

      <div className="mt-5 text-[13.5px] text-ink-3">
        <Link
          href="/login"
          className="font-semibold text-blue hover:text-navy-light hover:no-underline"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
