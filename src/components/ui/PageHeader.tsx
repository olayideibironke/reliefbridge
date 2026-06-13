import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  breadcrumbs,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-b border-line bg-surface px-6 py-7 md:px-10",
        className
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-2 text-[12px] text-ink-3">
          {breadcrumbs.map((b, i) => (
            <span key={b.label} className="flex items-center gap-2">
              {b.href ? (
                <Link
                  href={b.href}
                  className="hover:text-blue hover:no-underline"
                >
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-ink-2">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && (
                <span className="text-ink-3">/</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <div className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-blue">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy md:text-[32px]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[14.5px] leading-6 text-ink-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
