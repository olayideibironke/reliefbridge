"use client";

import { useActionState, useEffect } from "react";
import { LOCALE_COOKIE, t, type ReliefBridgeLocale } from "@/lib/i18n";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/Alert";
import { loginAction } from "@/app/(auth)/actions";
import { initialFormState as authInitialState } from "@/lib/forms";

export function LoginForm({ next, locale, explicitLocale }: { next: string; locale: ReliefBridgeLocale; explicitLocale: boolean }) {
  const [state, action] = useActionState(loginAction, authInitialState);
  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
    document.documentElement.lang = locale;
    window.dispatchEvent(new Event("reliefbridge:locale"));
  }, [locale]);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="locale" value={locale} />
      {explicitLocale && <input type="hidden" name="explicitLocale" value="1" />}

      {state.message && !state.ok && (
        <Alert tone="error">{state.message}</Alert>
      )}

      <Input
        label={t(locale, "workEmail")}
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder={t(locale, "loginEmailPlaceholder")}
        error={fe.email}
      />
      <Input
        label={t(locale, "password")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder={t(locale, "passwordPlaceholder")}
        error={fe.password}
      />

      <SubmitButton className="w-full" pendingLabel={t(locale, "signingIn")}>
        {t(locale, "signIn")}
      </SubmitButton>
    </form>
  );
}
