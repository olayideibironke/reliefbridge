import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-line bg-surface-2 px-6 py-16 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-md border border-line bg-surface text-blue">
          {icon}
        </div>
      )}
      <h3 className="text-[17px] font-bold tracking-tight text-navy">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-[14px] leading-6 text-ink-3">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
