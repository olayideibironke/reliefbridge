import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "error";

const toneClasses: Record<Tone, string> = {
  info: "border-blue/30 bg-blue-pale text-blue",
  success: "border-green/30 bg-green-soft text-green",
  warning: "border-[#E6C46A] bg-[#FBF1D8] text-gold-dark",
  error: "border-red/30 bg-red-soft text-red",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-sm border px-4 py-3 text-[13.5px] leading-5",
        toneClasses[tone],
        className
      )}
    >
      {title && <div className="font-bold">{title}</div>}
      {children && <div className={cn(title && "mt-1")}>{children}</div>}
    </div>
  );
}
