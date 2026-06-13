import { cn } from "@/lib/utils";

/**
 * ReliefBridge brand lockup — single shared component used outside the homepage.
 * Mirrors the homepage's hand-built shield + wordmark exactly so the brand
 * stays consistent across auth, the app shell, and product pages.
 *
 * Sizes:
 *   - sm  → compact (auth headers, table empty states)
 *   - md  → default (sidebar)
 *   - lg  → marketing-scale (auth split panel hero)
 *
 * Variants:
 *   - dark   → for white / surface backgrounds
 *   - light  → for navy / deep backgrounds
 */
export function Logo({
  size = "md",
  variant = "dark",
  showWordmark = true,
  className,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
}) {
  const dims = {
    sm: { shield: 44, radius: 10, r: 16, beam: 8, bar1: 22, bar2: 28, bar3: 18, wm: 18, tag: 9 },
    md: { shield: 56, radius: 12, r: 20, beam: 10, bar1: 28, bar2: 36, bar3: 22, wm: 22, tag: 10 },
    lg: { shield: 80, radius: 16, r: 28, beam: 14, bar1: 38, bar2: 50, bar3: 30, wm: 32, tag: 11 },
  }[size];

  const wmColor = variant === "light" ? "text-white" : "text-navy";
  const tagColor = variant === "light" ? "text-white/75" : "text-ink-3";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative grid shrink-0 overflow-hidden place-items-center shadow-md shadow-black/20"
        style={{
          height: dims.shield,
          width: dims.shield,
          borderRadius: dims.radius,
          background:
            "linear-gradient(135deg, #0B5E9E 0%, #08264A 55%, #06182E 100%)",
        }}
        aria-hidden
      >
        {/* Diagonal gold beam */}
        <div
          className="absolute bg-[#FDB022]"
          style={{
            left: -dims.shield * 0.2,
            top: dims.shield * 0.47,
            height: dims.beam,
            width: dims.shield * 1.6,
            transform: "rotate(-22deg)",
          }}
        />
        {/* Bridge towers */}
        <div
          className="absolute bottom-0 bg-[#FDB022]"
          style={{
            left: dims.shield * 0.26,
            height: dims.bar1,
            width: dims.beam * 0.7,
          }}
        />
        <div
          className="absolute bottom-0 bg-[#FDB022]"
          style={{
            left: dims.shield * 0.48,
            height: dims.bar2,
            width: dims.beam * 0.7,
          }}
        />
        <div
          className="absolute bottom-0 bg-[#FDB022]"
          style={{
            left: dims.shield * 0.7,
            height: dims.bar3,
            width: dims.beam * 0.7,
          }}
        />
        <div
          className="relative z-10 font-black text-white"
          style={{ fontSize: dims.r }}
        >
          R
        </div>
      </div>

      {showWordmark && (
        <div className="min-w-0">
          <div
            className={cn(
              "font-black leading-none tracking-tight",
              wmColor
            )}
            style={{ fontSize: dims.wm }}
          >
            ReliefBridge
          </div>
          <div
            className={cn(
              "mt-1.5 font-bold uppercase tracking-[0.22em]",
              tagColor
            )}
            style={{ fontSize: dims.tag }}
          >
            Disaster Recovery Coordination
          </div>
        </div>
      )}
    </div>
  );
}
