import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Section = { heading: string; description: string; bullets: string[] };
type Page = { title: string; description: string; eyebrow: string; heading: string; intro: string; sections: Section[] };
const pages: Record<string, Page> = {
  features: {
    title: "Disaster Recovery Platform Features",
    description: "Explore ReliefBridge features for survivor case management, referrals, unmet needs, partner coordination, and recovery reporting.",
    eyebrow: "Platform capabilities",
    heading: "One connected workspace for the work of recovery.",
    intro: "Recovery is a coordinated effort across people, programs, and organizations. ReliefBridge brings the essential workflows together so teams can spend less time chasing information and more time helping survivors.",
    sections: [
      { heading: "Survivor and case records", description: "Organize recovery work around the people who need support.", bullets: ["Survivor intake and case records", "Case status and activity tracking", "Team assignments and follow-up"] },
      { heading: "Referrals and unmet needs", description: "Keep requests visible as they move between recovery partners.", bullets: ["Partner referral workflows", "Unmet-needs tracking", "Follow-up and outcome visibility"] },
      { heading: "Operational reporting", description: "Turn daily coordination into a clearer picture of progress.", bullets: ["Open and closed case reporting", "Referral outcome reporting", "Organization activity and unmet-needs insights"] },
    ],
  },
  solutions: {
    title: "Solutions for Recovery Organizations",
    description: "ReliefBridge supports long-term recovery groups, VOAD partners, nonprofits, faith-based organizations, and disaster recovery teams.",
    eyebrow: "Who we serve",
    heading: "Built for organizations doing the hard work after disaster.",
    intro: "Every recovery organization has a different role. ReliefBridge helps teams maintain a shared operational picture while managing their own responsibilities and follow-through.",
    sections: [
      { heading: "Long-term recovery groups", description: "Coordinate survivor needs and case progress through a recovery process that can last months or years.", bullets: ["Track ongoing recovery cases", "Document outstanding needs", "Review progress and closures"] },
      { heading: "Nonprofits and faith-based partners", description: "Support a practical handoff between organizations serving the same community.", bullets: ["Manage partner relationships", "Send and track referrals", "Keep activity organized"] },
      { heading: "VOAD and coordination networks", description: "Bring visibility to operational gaps, participating partners, and recovery outcomes.", bullets: ["Coordinate across organizations", "Identify unresolved needs", "Report on response and recovery activity"] },
    ],
  },
  "case-management": {
    title: "Disaster Survivor Case Management",
    description: "Manage disaster survivor cases, intake, follow-ups, assignments, and recovery outcomes with ReliefBridge.",
    eyebrow: "Case management",
    heading: "Keep every survivor case moving forward.",
    intro: "Disaster recovery case management depends on accurate records and consistent follow-through. ReliefBridge helps authorized teams organize cases and see what needs attention next.",
    sections: [
      { heading: "Organized intake", description: "Capture survivor information in a structured recovery workflow.", bullets: ["Survivor profiles", "Case creation and tracking", "Documented recovery needs"] },
      { heading: "Accountable follow-through", description: "Make it easier for staff to understand what happened and what comes next.", bullets: ["Assigned responsibilities", "Case status visibility", "Activity and notes"] },
      { heading: "Measurable progress", description: "See work in progress alongside completed outcomes.", bullets: ["Open and closed cases", "Outstanding needs", "Operational reporting"] },
    ],
  },
  "disaster-recovery": {
    title: "Long-Term Disaster Recovery Coordination",
    description: "Coordinate long-term disaster recovery with case tracking, unmet needs, referrals, and partner reporting in ReliefBridge.",
    eyebrow: "Long-term recovery",
    heading: "Recovery continues long after the immediate response.",
    intro: "As communities rebuild, organizations must coordinate cases, referrals, resources, and unresolved needs. ReliefBridge provides a structured place to manage that continuing work.",
    sections: [
      { heading: "From immediate needs to long-term plans", description: "Keep a record of the work that remains after initial relief efforts.", bullets: ["Document survivor needs", "Follow cases over time", "Identify outstanding work"] },
      { heading: "Coordination across teams", description: "Reduce fragmented handoffs between participating recovery organizations.", bullets: ["Partner directories", "Referral tracking", "Team activity visibility"] },
      { heading: "Progress that can be reported", description: "Help teams explain where recovery stands and what support is still needed.", bullets: ["Case outcomes", "Unmet-needs reports", "Recovery activity summaries"] },
    ],
  },
  partners: {
    title: "Partner and VOAD Coordination",
    description: "Coordinate nonprofit partners, VOAD networks, and recovery referrals through ReliefBridge's disaster recovery platform.",
    eyebrow: "Partner networks",
    heading: "Better coordination between the organizations that show up.",
    intro: "Disaster recovery requires local knowledge and trusted relationships. ReliefBridge helps participating organizations track referrals and coordinate work without losing sight of the survivor.",
    sections: [
      { heading: "Partner visibility", description: "Maintain a practical view of organizations involved in recovery work.", bullets: ["Partner organization records", "Referral relationships", "Coordination activity"] },
      { heading: "Referral follow-through", description: "Support clearer handoffs and track whether requests are progressing.", bullets: ["Send referrals", "Track referral outcomes", "Surface unresolved needs"] },
      { heading: "Designed for varied organizations", description: "Explore workflows relevant to local recovery groups, VOAD partners, nonprofits, and faith-based teams.", bullets: ["Organization-based workspaces", "Role-based access", "Operational reports"] },
    ],
  },
  pricing: {
    title: "ReliefBridge Plans & Packages",
    description: "Explore ReliefBridge packages for small recovery teams, growing organizations and multi-agency programs. Request a tailored quote.",
    eyebrow: "Organizational service packages",
    heading: "A better fit for every stage of recovery.",
    intro: "Choose the right foundation for your staff and active caseload. Survivor-facing access is not billed as a staff seat. Receive a clear written quote before subscribing.",
    sections: [
      { heading: "Recovery Starter", description: "Focused coordination for smaller recovery teams.", bullets: ["Designed for up to 2 staff users", "Active-case capacity confirmed in quote", "Survivor-facing access included", "Written organizational quote"] },
      { heading: "Recovery Growth", description: "More capacity for lean teams with growing caseloads.", bullets: ["Designed for up to 3 staff users", "Active-case capacity confirmed in quote", "Survivor-facing access included", "Written organizational quote"] },
      { heading: "ReliefBridge Standard", description: "An established foundation for larger recovery teams.", bullets: ["Up to 15 staff users included", "Active-case capacity confirmed in quote", "Survivor-facing access included", "Additional staff options"] },
      { heading: "Enterprise & Multi-agency", description: "Tailored coordination for complex recovery networks.", bullets: ["Custom staff capacity", "Custom active-case capacity", "Multi-organization scope reviewed", "Tailored implementation quote"] },
    ],
  },
  contact: {
    title: "Contact ReliefBridge",
    description: "Contact the ReliefBridge team to discuss disaster recovery coordination, partnerships, demonstrations, and organizational access.",
    eyebrow: "Talk with our team",
    heading: "Let's talk about your recovery coordination needs.",
    intro: "Whether you're exploring a new platform, coordinating a recovery network, or looking for a demonstration, the ReliefBridge team is ready to hear from you.",
    sections: [
      { heading: "General inquiries", description: "Reach our team directly at contact@reliefbridge.net.", bullets: ["Platform questions", "Organization onboarding inquiries", "Recovery coordination discussions"] },
      { heading: "Request a demonstration", description: "Share your organization's needs through our demo request form.", bullets: ["Tell us about your organization", "Describe your coordination challenges", "Receive a personalized follow-up"] },
      { heading: "Partner conversations", description: "Discuss how ReliefBridge could fit into your network's recovery operations.", bullets: ["VOAD and LTRG networks", "Nonprofits and faith-based organizations", "Community recovery programs"] },
    ],
  },
};
const slugs = Object.keys(pages);
export function generateStaticParams() { return slugs.map(slug => ({ slug })); }
export const dynamicParams = false;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: "/" + slug }, openGraph: { title: page.title, description: page.description, url: "/" + slug, type: "website" }, robots: { index: true, follow: true } };
}
export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="border-b border-line bg-navy-dark text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-3 hover:no-underline">
            <Image src="/icon.png" alt="" width={48} height={48} className="rounded-lg" />
            <span className="text-2xl font-black text-white">ReliefBridge</span>
          </Link>
          <nav aria-label="Public website" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
            <Link href="/features" className="text-white hover:text-gold">Features</Link>
            <Link href="/solutions" className="text-white hover:text-gold">Solutions</Link>
            <Link href="/partners" className="text-white hover:text-gold">Partners</Link>
            <Link href="/pricing" className="text-white hover:text-gold">Plans & Packages</Link>
            <Link href="/contact" className="text-white hover:text-gold">Contact</Link>
            <Link href="/login" className="text-white hover:text-gold">Sign in</Link>
          </nav>
        </div>
      </header>
      <main>
        <section className="relative overflow-hidden bg-navy py-16 text-white sm:py-24">
          <div className="pointer-events-none absolute inset-0 rb-dotgrid" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 md:px-8">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-gold">{page.eyebrow}</p>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">{page.heading}</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/80">{page.intro}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={slug === "pricing" ? "/request-quote" : "/request-demo"} className="rounded bg-gold px-6 py-3 font-bold text-navy hover:bg-white hover:no-underline">{slug === "pricing" ? "Request a written quote" : "Request a demo →"}</Link>
              <Link href="/features" className="rounded border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10 hover:no-underline">Explore features</Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className={slug === "pricing" ? "grid gap-6 md:grid-cols-2 xl:grid-cols-4" : "grid gap-6 md:grid-cols-3"}>
            {page.sections.map((section, index) => (
              <article key={section.heading} className="rounded-xl border border-line bg-white p-7 shadow-card">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-pale text-lg font-black text-navy">{String(index + 1).padStart(2, "0")}</div>
                <h2 className="text-2xl font-black text-navy">{section.heading}</h2>
                <p className="mt-4 leading-7 text-ink-2">{section.description}</p>
                <ul className="mt-6 space-y-3">{section.bullets.map(bullet => <li key={bullet} className="flex gap-3 text-sm leading-6 text-ink-2"><span className="font-bold text-blue" aria-hidden="true">✓</span><span>{bullet}</span></li>)}</ul>
                {slug === "pricing" && <Link href={`/request-quote?plan=${encodeURIComponent(section.heading)}`} className="mt-7 inline-flex rounded-md bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-blue hover:no-underline">Request a written quote</Link>}
              </article>
            ))}
          </div>
        </section>
        <section className="bg-blue-pale py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
            <div><h2 className="text-3xl font-black text-navy">{slug === "pricing" ? "Find the right package for your organization." : "See ReliefBridge in action."}</h2><p className="mt-3 max-w-2xl text-ink-2">{slug === "pricing" ? "Share your team size and caseload for a written quote. A sales call is optional." : "Explore a demonstration tailored to your organization\'s recovery operations."}</p></div>
            <Link href={slug === "pricing" ? "/request-quote" : "/request-demo"} className="shrink-0 rounded bg-navy px-6 py-3 font-bold text-white hover:bg-navy-light hover:no-underline">{slug === "pricing" ? "Request a written quote" : "Request a no-obligation demo →"}</Link>
          </div>
        </section>
      </main>
      <footer className="bg-navy-dark py-12 text-white/75">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="mb-5 text-lg font-black text-white">ReliefBridge</div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            {slugs.map(s => <Link key={s} href={"/" + s} className="text-white/80 hover:text-white">{s === "pricing" ? "Plans & Packages" : s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}</Link>)}
            <Link href="/request-demo" className="text-white/80 hover:text-white">Request Demo</Link>
          </nav>
          <p className="mt-7 text-xs text-white/50">© {new Date().getFullYear()} ReliefBridge. Disaster recovery coordination.</p>
        </div>
      </footer>
    </div>
  );
}