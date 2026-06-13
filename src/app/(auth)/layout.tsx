import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icons } from "@/components/ui/Icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Top banner — matches homepage */}
      <div className="bg-navy-dark text-white">
        <div className="mx-auto flex h-9 max-w-[1280px] items-center gap-3 px-5 text-[12.5px] md:px-8">
          <span className="h-3.5 w-3.5 text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 21V4" />
              <path d="M5 4h11l-1.5 3.5L16 11H5" />
            </svg>
          </span>
          <span className="font-medium tracking-tight">
            A Westforge Holdings disaster recovery coordination platform
          </span>
          <span className="ml-auto hidden items-center gap-4 text-white/80 sm:flex">
            <Link href="/" className="hover:text-white hover:no-underline">
              Back to public site
            </Link>
          </span>
        </div>
      </div>

      {/* Split layout — brand panel + form */}
      <div className="grid min-h-[calc(100vh-2.25rem)] lg:grid-cols-2">
        {/* Left brand panel */}
        <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col">
          <div
            className="absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="relative flex h-full flex-col px-12 py-12">
            <Link href="/" aria-label="ReliefBridge home" className="hover:no-underline">
              <Logo size="md" variant="light" />
            </Link>

            <div className="mt-auto">
              <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
                <Icons.Lock className="h-3 w-3 text-gold" />
                Secure coordination workspace
              </div>
              <h2 className="mt-5 max-w-[18ch] text-[34px] font-bold leading-[1.1] tracking-tight">
                One survivor record.
                <span className="block text-gold">One coordinated recovery.</span>
              </h2>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-7 text-white/80">
                Sign in to coordinate survivor cases, partner referrals, unmet
                needs, and outcome reporting across your recovery network.
              </p>

              <ul className="mt-7 space-y-2.5 text-[13.5px] text-white/85">
                {[
                  "Role-based access for case managers, directors, and partners",
                  "Audit trail across every case, note, and referral",
                  "Consent-aware survivor records",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2.5">
                    <Icons.CircleCheck className="mt-[3px] h-4 w-4 shrink-0 text-gold" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 text-[12px] text-white/55">
              © {new Date().getFullYear()} Westforge Holdings · ReliefBridge
            </div>
          </div>
        </aside>

        {/* Right form panel */}
        <main className="flex flex-col">
          <header className="flex items-center justify-between border-b border-line px-6 py-5 lg:hidden">
            <Link href="/" aria-label="ReliefBridge home" className="hover:no-underline">
              <Logo size="sm" />
            </Link>
          </header>
          <div className="flex flex-1 items-center justify-center px-5 py-10 md:px-10">
            <div className="w-full max-w-[480px]">{children}</div>
          </div>
          <footer className="border-t border-line bg-surface-2 px-6 py-4 text-[12px] text-ink-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>ReliefBridge · A Westforge Holdings product</span>
              <span className="flex items-center gap-4">
                <Link href="#" className="hover:text-ink-2 hover:no-underline">Privacy</Link>
                <Link href="#" className="hover:text-ink-2 hover:no-underline">Security</Link>
                <Link href="#" className="hover:text-ink-2 hover:no-underline">Accessibility</Link>
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
