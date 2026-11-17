/**
 * ReliefBridge language contract.
 * Keep locale codes stable across website, authenticated app, and demo invitations.
 * User-entered survivor records and documents are never translated implicitly.
 */
export const SUPPORTED_LOCALES = ["en", "es", "fr"] as const;
export type ReliefBridgeLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: ReliefBridgeLocale = "en";
export const LOCALE_COOKIE = "rb_locale";

export const LOCALE_NAMES: Record<ReliefBridgeLocale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};

export function parseLocale(input: unknown): ReliefBridgeLocale {
  return typeof input === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(input.toLowerCase())
    ? (input.toLowerCase() as ReliefBridgeLocale)
    : DEFAULT_LOCALE;
}

/** Only translated UI copy belongs here. Never place private case data in a dictionary. */
export const translations = {
  en: {
    loginWelcome: "Welcome back to ReliefBridge.",
    loginDescription: "Sign in to coordinate survivor cases, referrals, and partner activity.",
    workEmail: "Work email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    signingIn: "Signing in…",
    forgotPassword: "Forgot password?",
    newToReliefBridge: "New to ReliefBridge?",
    createAccount: "Create an account",
    demoExpired: "This demonstration access period has ended. Please contact ReliefBridge for renewed access.",
    language: "Language",
    overview: "Overview",
    survivors: "Survivors",
    recoveryCases: "Recovery cases",
    unmetNeeds: "Unmet needs",
    referrals: "Referrals",
    partners: "Partner organizations",
    mail: "Mail",
    reports: "Reports",
    settings: "Settings",
    signIn: "Sign in",
    requestDemo: "Request a demo",
    requestQuote: "Request a quote",
    demoHub: "Demo Hub",
    demoLanguage: "Demo language",
    demoLanguageHelp: "Choose the initial language for this organization's demonstration.",
    platformAdministration: "Platform Administration",
    staffOperations: "Staff Operations",
    activityLog: "Activity Log",
  },
  es: {
    loginWelcome: "Bienvenido de nuevo a ReliefBridge.",
    loginDescription: "Inicie sesión para coordinar casos de sobrevivientes, referidos y actividades de organizaciones colaboradoras.",
    workEmail: "Correo electrónico de trabajo",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    signingIn: "Iniciando sesión…",
    forgotPassword: "¿Olvidó su contraseña?",
    newToReliefBridge: "¿Es nuevo en ReliefBridge?",
    createAccount: "Crear una cuenta",
    demoExpired: "El período de acceso a esta demostración ha terminado. Comuníquese con ReliefBridge para renovar el acceso.",
    language: "Idioma",
    overview: "Resumen",
    survivors: "Sobrevivientes",
    recoveryCases: "Casos de recuperación",
    unmetNeeds: "Necesidades no cubiertas",
    referrals: "Referidos",
    partners: "Organizaciones colaboradoras",
    mail: "Correo",
    reports: "Informes",
    settings: "Configuración",
    signIn: "Iniciar sesión",
    requestDemo: "Solicitar una demostración",
    requestQuote: "Solicitar una cotización",
    demoHub: "Centro de demostraciones",
    demoLanguage: "Idioma de la demostración",
    demoLanguageHelp: "Seleccione el idioma inicial de la demostración para esta organización.",
    platformAdministration: "Administración de la plataforma",
    staffOperations: "Operaciones del personal",
    activityLog: "Registro de actividad",
  },
  fr: {
    loginWelcome: "Bienvenue sur ReliefBridge.",
    loginDescription: "Connectez-vous pour coordonner les dossiers des personnes sinistrées, les orientations et les activités des partenaires.",
    workEmail: "Adresse courriel professionnelle",
    password: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    signingIn: "Connexion en cours…",
    forgotPassword: "Mot de passe oublié?",
    newToReliefBridge: "Nouveau sur ReliefBridge?",
    createAccount: "Créer un compte",
    demoExpired: "La période d'accès à cette démonstration est terminée. Contactez ReliefBridge pour renouveler votre accès.",
    language: "Langue",
    overview: "Vue d'ensemble",
    survivors: "Personnes sinistrées",
    recoveryCases: "Dossiers de rétablissement",
    unmetNeeds: "Besoins non satisfaits",
    referrals: "Orientations",
    partners: "Organisations partenaires",
    mail: "Messagerie",
    reports: "Rapports",
    settings: "Paramètres",
    signIn: "Se connecter",
    requestDemo: "Demander une démonstration",
    requestQuote: "Demander un devis",
    demoHub: "Centre de démonstration",
    demoLanguage: "Langue de la démonstration",
    demoLanguageHelp: "Choisissez la langue initiale de la démonstration pour cette organisation.",
    platformAdministration: "Administration de la plateforme",
    staffOperations: "Opérations du personnel",
    activityLog: "Journal d'activité",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];

export function t(locale: ReliefBridgeLocale, key: TranslationKey): string {
  return translations[locale][key];
}
