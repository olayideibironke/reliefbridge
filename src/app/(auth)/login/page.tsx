import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, t } from "@/lib/i18n";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — ReliefBridge",
  description: "Sign in to the ReliefBridge disaster recovery coordination platform.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; demo_expired?: string }>;
}) {
  const sp = await searchParams;
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/app";

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">
          {t(locale, "signIn")}
        </div>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">
          {t(locale, "loginWelcome")}
        </h1>
        <p className="mt-2 text-[14.5px] leading-6 text-ink-2">
          {t(locale, "loginDescription")}
        </p>
      </div>

      {sp.demo_expired === "1" && (
        <div className="mb-5 rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-[13.5px] leading-5 text-ink-2">
          {t(locale, "demoExpired")}
        </div>
      )}

      <LoginForm next={next} locale={locale} />

      <div className="mt-5 flex items-center justify-between text-[13.5px]">
        <Link
          href="/forgot-password"
          className="font-semibold text-blue hover:text-navy-light hover:no-underline"
        >
          {t(locale, "forgotPassword")}
        </Link>
        <span className="text-ink-3">
          {t(locale, "newToReliefBridge")}{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue hover:text-navy-light hover:no-underline"
          >
            {t(locale, "createAccount")}
          </Link>
        </span>
      </div>
    </div>
  );
}
