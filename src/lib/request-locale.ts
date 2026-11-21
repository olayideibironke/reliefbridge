import { cookies, headers } from "next/headers";
import { DEMO_LOCALE_HEADER, LOCALE_COOKIE, parseLocale } from "@/lib/i18n";

export async function getRequestLocale() {
  const demoLocale = (await headers()).get(DEMO_LOCALE_HEADER);
  return parseLocale(demoLocale ?? (await cookies()).get(LOCALE_COOKIE)?.value);
}
