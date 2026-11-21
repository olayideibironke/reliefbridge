import Link from "next/link";
import { getRequestLocale } from "@/lib/request-locale";

const copy = {
  en: ["Page not found", "This page or record is unavailable.", "Return to workspace"],
  es: ["Página no encontrada", "Esta página o registro no está disponible.", "Volver al espacio de trabajo"],
  fr: ["Page introuvable", "Cette page ou ce dossier est indisponible.", "Retour à l’espace de travail"],
} as const;

export default async function WorkspaceNotFound() {
  const [heading, description, action] = copy[await getRequestLocale()];

  return (
    <section className="space-y-4 px-6 py-8 md:px-10">
      <h1 className="text-2xl font-bold text-navy">{heading}</h1>
      <p className="text-ink-2">{description}</p>
      <Link className="font-semibold text-blue underline" href="/app">{action}</Link>
    </section>
  );
}
