"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Icons } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const links = [
  { label: "Overview", href: "/app" },
  { label: "Survivors", href: "/app/survivors" },
  { label: "Recovery cases", href: "/app/cases" },
  { label: "Unmet needs", href: "/app/unmet-needs" },
  { label: "Referrals", href: "/app/referrals" },
  { label: "Partners", href: "/app/partners" },
  { label: "Reports", href: "/app/reports" },
  { label: "Settings", href: "/app/settings/organization" },
];

export function MobileHeader({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-line bg-surface lg:hidden">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/app" aria-label="ReliefBridge home" className="hover:no-underline">
          <Logo size="sm" />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-sm border border-line text-ink-2"
        >
          <Icons.Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 flex h-full w-[80%] max-w-[320px] flex-col bg-surface shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo size="sm" />
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink-2"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-line px-5 py-3 text-[12.5px] text-ink-3">
              <span className="font-medium text-ink-2">{orgName}</span>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-sm px-3 py-2.5 text-[14px] font-medium hover:no-underline",
                      active
                        ? "bg-blue text-white"
                        : "text-ink-2 hover:bg-surface-2 hover:text-navy"
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <form action="/auth/signout" method="post" className="border-t border-line p-4">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink-2 hover:text-red"
              >
                <Icons.Logout className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
