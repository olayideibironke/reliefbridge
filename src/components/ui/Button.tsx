import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:no-underline";

const variantClasses: Record<Variant, string> = {
  primary: "bg-blue text-white shadow-sm hover:bg-navy-light",
  secondary: "bg-navy text-white shadow-sm hover:bg-navy-light",
  outline:
    "border border-line bg-surface text-ink-2 hover:border-blue hover:text-blue",
  ghost: "text-ink-2 hover:text-blue hover:bg-surface-2",
  danger: "bg-red text-white hover:bg-[#9B0808]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-[12.5px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-12 px-6 text-[15px]",
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
