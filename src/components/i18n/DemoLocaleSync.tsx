"use client";

import { useEffect } from "react";
import { LOCALE_COOKIE, parseLocale, type ReliefBridgeLocale } from "@/lib/i18n";

/** Keep an authenticated demo's language consistent across browsers and devices. */
export function DemoLocaleSync({ preferredLocale }: { preferredLocale: ReliefBridgeLocale | null }) {
  useEffect(() => {
    if (!preferredLocale) return;
    const current = document.cookie.split("; ").find((part) => part.startsWith(LOCALE_COOKIE + "="));
    const currentValue = current?.slice(LOCALE_COOKIE.length + 1);
    if (parseLocale(currentValue) === preferredLocale && currentValue === preferredLocale) return;
    document.cookie = `${LOCALE_COOKIE}=${preferredLocale}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    document.documentElement.lang = preferredLocale;
    location.reload();
  }, [preferredLocale]);
  return null;
}
