"use client";

import { useEffect, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, type ReliefBridgeLocale } from "@/lib/i18n";

const copy = {
  en: {
    secureWorkspace: "Secure coordination workspace",
    oneSurvivor: "One survivor record.",
    oneRecovery: "One coordinated recovery.",
    authBrandDescription: "Sign in to coordinate survivor cases, partner referrals, unmet needs, and outcome reporting across your recovery network.",
    roleBasedAccess: "Role-based access for case managers, directors, and partners",
    auditTrail: "Audit trail across every case, note, and referral",
    consentAwareRecords: "Consent-aware survivor records",
  },
  es: {
    secureWorkspace: "Espacio seguro de coordinación",
    oneSurvivor: "Un registro por sobreviviente.",
    oneRecovery: "Una recuperación coordinada.",
    authBrandDescription: "Inicie sesión para coordinar casos de recuperación, derivaciones a colaboradores, necesidades no cubiertas e informes de resultados en su red.",
    roleBasedAccess: "Acceso por funciones para gestores de casos, directores y colaboradores",
    auditTrail: "Registro de auditoría de cada caso, nota y derivación",
    consentAwareRecords: "Registros de sobrevivientes con protección del consentimiento",
  },
  fr: {
    secureWorkspace: "Espace de coordination sécurisé",
    oneSurvivor: "Un dossier par sinistré.",
    oneRecovery: "Un rétablissement coordonné.",
    authBrandDescription: "Connectez-vous pour coordonner les dossiers des sinistrés, les orientations vers les partenaires, les besoins non satisfaits et les rapports de résultats.",
    roleBasedAccess: "Accès selon les rôles pour les gestionnaires de cas, les responsables et les partenaires",
    auditTrail: "Piste d'audit pour chaque dossier, note et orientation",
    consentAwareRecords: "Dossiers des sinistrés respectant le consentement",
  },
} as const;

type AuthBrandKey = keyof typeof copy.en;

function readLocale(): ReliefBridgeLocale {
  const cookie = document.cookie.split("; ").find((part) => part.startsWith(LOCALE_COOKIE + "="));
  return parseLocale(cookie?.slice(LOCALE_COOKIE.length + 1));
}

export function AuthBrandCopy({ copyKey }: { copyKey: AuthBrandKey }) {
  const [locale, setLocale] = useState<ReliefBridgeLocale>(DEFAULT_LOCALE);
  useEffect(() => {
    const sync = () => setLocale(readLocale());
    sync();
    window.addEventListener("reliefbridge:locale", sync);
    return () => window.removeEventListener("reliefbridge:locale", sync);
  }, []);
  return <>{copy[locale][copyKey]}</>;
}
