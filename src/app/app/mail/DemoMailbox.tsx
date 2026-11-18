import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { t, type ReliefBridgeLocale } from "@/lib/i18n";

const sampleMail = {
  en: {
    inbox: "Inbox",
    notice: "Sample messages show how recovery teams coordinate through internal mail. This demo is read-only.",
    sender: "Recovery Coordination Team",
    messages: [
      ["Housing follow-up", "Please confirm whether the temporary housing referral was accepted before the next case review."],
      ["Recovery team briefing", "Bring updates on open referrals and unmet needs to the next team briefing."],
    ],
  },
  es: {
    inbox: "Bandeja de entrada",
    notice: "Estos mensajes de ejemplo muestran cómo los equipos coordinan la recuperación por correo interno. Esta demostración es de solo lectura.",
    sender: "Equipo de coordinación de la recuperación",
    messages: [
      ["Seguimiento de vivienda", "Confirme si se aceptó la derivación para vivienda temporal antes de la próxima revisión del caso."],
      ["Reunión del equipo de recuperación", "Comparta las novedades sobre las derivaciones abiertas y las necesidades pendientes en la próxima reunión del equipo."],
    ],
  },
  fr: {
    inbox: "Boîte de réception",
    notice: "Ces exemples montrent comment les équipes coordonnent le rétablissement par messagerie interne. Cette démonstration est en lecture seule.",
    sender: "Équipe de coordination du rétablissement",
    messages: [
      ["Suivi du logement", "Veuillez confirmer que la demande de logement temporaire a été acceptée avant le prochain examen du dossier."],
      ["Réunion de l’équipe de rétablissement", "Présentez les dernières nouvelles sur les orientations en cours et les besoins non satisfaits à la prochaine réunion."],
    ],
  },
} as const;

export function DemoMailbox({ locale, message }: { locale: ReliefBridgeLocale; message?: string }) {
  const copy = sampleMail[locale];
  const active = message === "briefing" ? "briefing" : "housing";
  const [subject, body] = copy.messages[active === "briefing" ? 1 : 0];

  return (
    <>
      <PageHeader eyebrow={t(locale, "communication")} title={t(locale, "mail")} subtitle={copy.notice} />
      <div className="grid gap-4 p-6 md:grid-cols-[minmax(14rem,1fr)_2fr] md:px-10">
        <nav aria-label={copy.inbox} className="rounded border border-line bg-surface">
          <h2 className="border-b border-line px-4 py-3 font-semibold text-navy">{copy.inbox}</h2>
          {(["housing", "briefing"] as const).map((id, index) => (
            <Link
              key={id}
              href={`/app/mail?message=${id}`}
              aria-current={active === id ? "page" : undefined}
              className="block border-b border-line px-4 py-3 last:border-0 aria-[current=page]:bg-blue-soft"
            >
              <span className="block font-semibold text-navy">{copy.messages[index][0]}</span>
              <span className="text-sm text-ink-3">{copy.sender}</span>
            </Link>
          ))}
        </nav>
        <article className="rounded border border-line bg-surface p-5">
          <h2 className="text-xl font-bold text-navy">{subject}</h2>
          <p className="mt-1 text-sm text-ink-3">{copy.sender}</p>
          <p className="mt-5 text-ink-2">{body}</p>
        </article>
      </div>
    </>
  );
}
