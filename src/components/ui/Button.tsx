import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-bold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-50 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-navy !text-white shadow-sm hover:bg-blue hover:!text-white active:bg-navy-light",
  secondary:
    "bg-blue !text-white shadow-sm hover:bg-navy-light hover:!text-white active:bg-navy",
  outline:
    "border border-navy/25 bg-white !text-navy shadow-sm hover:border-blue hover:bg-blue-soft hover:!text-navy",
  ghost:
    "bg-transparent !text-navy hover:bg-blue-soft hover:!text-navy",
  danger:
    "bg-red !text-white shadow-sm hover:bg-[#9B0808] hover:!text-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-[13.5px]",
  md: "h-12 px-6 text-[15px]",
  lg: "min-h-13 px-7 py-3 text-[16px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      {...rest}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
    >
      {children}
    </Link>
  );
}