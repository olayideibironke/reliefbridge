"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icons } from "@/components/ui/Icons";
import { cn, initials } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match?: (path: string) => boolean;
};

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", href: "/app", icon: Icons.Dashboard, match: (p) => p === "/app" },
      { label: "Survivors", href: "/app/survivors", icon: Icons.Survivors },
      { label: "Recovery cases", href: "/app/cases", icon: Icons.Cases },
      { label: "Unmet needs", href: "/app/unmet-needs", icon: Icons.Needs },
    ],
  },
  {
    title: "Network",
    items: [
      { label: "Referral exchange", href: "/app/referrals", icon: Icons.Referrals },
      { label: "Partner organizations", href: "/app/partners", icon: Icons.Partners },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/app/reports", icon: Icons.Reports },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", href: "/app/settings/organization", icon: Icons.Settings, match: (p) => p.startsWith("/app/settings") },
    ],
  },
];

export function Sidebar({
  user,
  orgName,
}: {
  user: { name: string; email: string; role: string };
  orgName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[268px] shrink-0 flex-col border-r border-line bg-surface-2 lg:flex">
      {/* Brand */}
      <div className="border-b border-line px-5 py-5">
        <Link
          href="/app"
          aria-label="ReliefBridge home"
          className="block hover:no-underline"
        >
          <Logo size="sm" />
        </Link>
      </div>

      {/* Org */}
      <div className="px-3 py-4">
        <div className="rounded-sm border border-line bg-surface px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-navy text-[11px] font-bold text-white">
              {initials(orgName.split(" ")[0], orgName.split(" ")[1])}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-bold text-navy">
                {orgName}
              </div>
              <div className="truncate text-[11px] text-ink-3">Active organization</div>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.match
                  ? item.match(pathname)
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Ico = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] font-medium transition hover:no-underline",
                        active
                          ? "bg-blue text-white"
                          : "text-ink-2 hover:bg-surface hover:text-navy"
                      )}
                    >
                      <Ico
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          active ? "text-white" : "text-ink-3 group-hover:text-blue"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-line px-3 py-3">
        <Link
          href="/app/settings/profile"
          className="flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-surface hover:no-underline"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-navy text-[12px] font-bold text-white">
            {initials(user.name.split(" ")[0], user.name.split(" ")[1])}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold text-navy">
              {user.name}
            </div>
            <div className="truncate text-[11.5px] text-ink-3">{user.role}</div>
          </div>
          <Icons.ChevronRight className="h-4 w-4 text-ink-3" />
        </Link>
        <form action="/auth/signout" method="post" className="mt-1">
          <button
            type="submit"
            className="inline-flex w-full items-center gap-2 rounded-sm px-3 py-2 text-[12.5px] font-semibold text-ink-3 transition hover:bg-surface hover:text-red"
          >
            <Icons.Logout className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
