import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your ReliefBridge account",
  description:
    "Create a ReliefBridge organization account — disaster recovery coordination for nonprofits, LTRGs, and partner organizations.",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
          Create account
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
          Start coordinating recovery with your organization.
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
          Create your ReliefBridge workspace. You can invite case managers and
          partner organizations after sign-up.
        </p>
      </div>

      <SignupForm />

      <div className="mt-5 text-[13.5px] text-ink-3">
        Already have a ReliefBridge account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue hover:text-navy-light hover:no-underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
