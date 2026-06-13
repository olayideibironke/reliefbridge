import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

export function TopBar({ orgName }: { orgName: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-6 md:px-10">
        <div className="hidden items-center gap-2 text-[12.5px] text-ink-3 md:flex">
          <Icons.Building className="h-4 w-4 text-ink-3" />
          <span className="font-medium text-ink-2">{orgName}</span>
        </div>

        <div className="ml-auto flex flex-1 max-w-[420px] items-center md:ml-6">
          <label className="hidden h-10 w-full items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-blue md:flex">
            <Icons.Search className="h-4 w-4 text-ink-3" />
            <input
              type="search"
              placeholder="Search survivors, cases, partners…"
              className="w-full bg-transparent text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <kbd className="hidden rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-ink-3 lg:inline">
              ⌘K
            </kbd>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/reports"
            className="hidden h-10 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink-2 hover:border-blue hover:text-blue hover:no-underline md:inline-flex"
          >
            <Icons.Reports className="h-4 w-4" />
            Reports
          </Link>
          <button
            className="relative grid h-10 w-10 place-items-center rounded-sm border border-line bg-surface text-ink-3 hover:text-blue"
            aria-label="Notifications"
          >
            <Icons.Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" />
          </button>
        </div>
      </div>
    </header>
  );
}
