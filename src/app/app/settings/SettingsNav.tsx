"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/settings/organization", label: "Organization profile" },
  { href: "/app/settings/profile", label: "Your profile" },
  { href: "/app/settings/notifications", label: "Notifications" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 rounded-md border border-line bg-surface p-1">
      {items.map((i) => {
        const active = pathname === i.href || pathname.startsWith(`${i.href}/`);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-sm px-3.5 py-2 text-[13px] font-semibold hover:no-underline",
              active
                ? "bg-blue text-white"
                : "text-ink-2 hover:bg-surface-2 hover:text-navy"
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
