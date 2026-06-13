import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — ReliefBridge",
  description: "Sign in to the ReliefBridge disaster recovery coordination platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/app";

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
          Sign in
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
          Welcome back to ReliefBridge.
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
          Sign in to coordinate survivor cases, referrals, and partner activity.
        </p>
      </div>

      <LoginForm next={next} />

      <div className="mt-5 flex items-center justify-between text-[13.5px]">
        <Link
          href="/forgot-password"
          className="font-semibold text-blue hover:text-navy-light hover:no-underline"
        >
          Forgot password?
        </Link>
        <span className="text-ink-3">
          New to ReliefBridge?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue hover:text-navy-light hover:no-underline"
          >
            Create an account
          </Link>
        </span>
      </div>
    </div>
  );
}
