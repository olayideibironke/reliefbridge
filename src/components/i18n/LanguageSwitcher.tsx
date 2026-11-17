"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_NAMES,
  parseLocale,
  SUPPORTED_LOCALES,
  t,
  type ReliefBridgeLocale,
} from "@/lib/i18n";

function currentLocale(): ReliefBridgeLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(LOCALE_COOKIE + "="));
  return parseLocale(cookie ? decodeURIComponent(cookie.slice(LOCALE_COOKIE.length + 1)) : undefined);
}

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<ReliefBridgeLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = currentLocale();
    document.documentElement.lang = initial;
    setLocale(initial);
    const update = () => {
      const next = currentLocale();
      document.documentElement.lang = next;
      setLocale(next);
    };
    window.addEventListener("reliefbridge:locale", update);
    return () => window.removeEventListener("reliefbridge:locale", update);
  }, []);

  function changeLocale(next: ReliefBridgeLocale) {
    document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    document.documentElement.lang = next;
    setLocale(next);
    window.dispatchEvent(new Event("reliefbridge:locale"));
    // An invitation ?lang= parameter initializes the login language only.
    // Explicit user selection must take precedence on the next reload.
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.delete("lang");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    // Server-rendered pages will read the locale cookie on navigation.
    // Do not claim all UI is translated until each screen is wired to dictionaries.
    window.location.reload();
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink-2">
      <span className="sr-only">{t(locale, "language")}</span>
      <select
        aria-label={t(locale, "language")}
        className="h-10 max-w-32 rounded-sm border border-line bg-surface px-2 text-xs font-semibold text-ink-2"
        value={locale}
        onChange={(event) => changeLocale(parseLocale(event.target.value))}
      >
        {SUPPORTED_LOCALES.map((code) => (
          <option key={code} value={code}>{LOCALE_NAMES[code]}</option>
        ))}
      </select>
    </label>
  );
}
