import type { ReactNode, SVGProps } from "react";
import Link from "next/link";

const IMG = {
  heroBuilder:
    "https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=1600&q=80",
  damagedRow:
    "https://images.unsplash.com/photo-1640301630386-a51ca448589a?auto=format&fit=crop&w=1400&q=80",
  rebuildingInterior:
    "https://images.unsplash.com/photo-1711856714982-63f341038619?auto=format&fit=crop&w=1400&q=80",
};

type IconProps = SVGProps<SVGSVGElement>;

const baseStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = {
  Flag: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 3.5L16 11H5" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  ),
  ArrowRight: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  CaseFolder: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <path d="M4 9.5a2 2 0 0 1 2-2h6.5l2.5 2.5H26a2 2 0 0 1 2 2V24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M4 13h24" />
    </svg>
  ),
  Handshake: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <path d="M3 16h4l3-4 4 3 3-3 4 3 5-4 3 2" />
      <path d="M10 18.5c1 2 4 3 5.5 1.5" />
      <path d="M18 21c1.5 1.5 4.5.5 5-1.5" />
    </svg>
  ),
  Heart: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <path d="M16 27S5 21 5 13.5a5.5 5.5 0 0 1 11-2.2 5.5 5.5 0 0 1 11 2.2C27 21 16 27 16 27Z" />
    </svg>
  ),
  Network: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <circle cx="16" cy="6" r="2.5" />
      <circle cx="6" cy="24" r="2.5" />
      <circle cx="26" cy="24" r="2.5" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="M16 8.5v5M14 18l-6 4M18 18l6 4" />
    </svg>
  ),
  Chart: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <path d="M5 27V8" />
      <path d="M5 27h22" />
      <path d="M10 22v-6" />
      <path d="M16 22v-10" />
      <path d="M22 22v-4" />
      <path d="M27 22V14" />
    </svg>
  ),
  Shield: (p: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...p}>
      <path d="M16 4 5 8v8c0 6.5 4.5 10.5 11 12 6.5-1.5 11-5.5 11-12V8Z" />
      <path d="m11.5 16.5 3 3 6-6" />
    </svg>
  ),
  Phone: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.6l1.4 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.4v2.6A1.5 1.5 0 0 1 17 18.5C9.8 18.5 4 12.7 4 5.5Z" />
    </svg>
  ),
  Lock: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
    </svg>
  ),
  CircleCheck: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
};

function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-5 md:px-8 ${className}`}>
      {children}
    </div>
  );
}

function ReliefBridgeLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-[70px] w-[70px] place-items-center overflow-hidden rounded-[14px] bg-[#08264A] shadow-lg shadow-black/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B5E9E] via-[#08264A] to-[#06182E]" />
        <div className="absolute left-[-14px] top-[33px] h-[12px] w-[110px] rotate-[-22deg] bg-[#FDB022]" />
        <div className="absolute bottom-0 left-[18px] h-[34px] w-[8px] bg-[#FDB022]" />
        <div className="absolute bottom-0 left-[34px] h-[45px] w-[8px] bg-[#FDB022]" />
        <div className="absolute bottom-0 left-[50px] h-[28px] w-[8px] bg-[#FDB022]" />
        <div className="relative z-10 text-[26px] font-black text-white">R</div>
      </div>

      <div>
        <div
          className={`text-[30px] font-black leading-none tracking-tight ${
            light ? "text-white" : "text-navy"
          }`}
        >
          ReliefBridge
        </div>
        <div
          className={`mt-2 text-[11px] font-bold uppercase tracking-[0.22em] ${
            light ? "text-white/75" : "text-ink-3"
          }`}
        >
          Disaster Recovery Coordination
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-sm bg-blue px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-navy-light">
      {children}
    </button>
  );
}

function SecondaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-sm border-2 border-white/80 bg-transparent px-5 py-[10px] text-[15px] font-semibold text-white transition hover:bg-white hover:text-navy">
      {children}
    </button>
  );
}

function OfficialBanner() {
  return (
    <div className="bg-navy-dark text-white">
      <Container className="flex h-9 items-center gap-3 text-[12.5px]">
        <Icon.Flag className="h-3.5 w-3.5 text-gold" />
        <span className="font-medium tracking-tight">
          A Westforge Holdings disaster recovery coordination platform
        </span>
        <span className="ml-auto hidden items-center gap-4 text-white/80 sm:flex">
          <a href="#" className="hover:text-white hover:no-underline">
            Help Center
          </a>
          <span className="h-3 w-px bg-white/25" />
          <a href="#" className="hover:text-white hover:no-underline">
            Contact (24/7)
          </a>
        </span>
      </Container>
    </div>
  );
}

function Masthead() {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="flex min-h-[112px] items-center gap-8 py-5">
        <Link href="/" aria-label="ReliefBridge home" className="hover:no-underline">
          <ReliefBridgeLogo />
        </Link>

        <div className="ml-auto hidden flex-1 max-w-[440px] md:block">
          <label className="flex h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-blue">
            <Icon.Search className="h-4 w-4 text-ink-3" />
            <input
              type="text"
              placeholder="Search disasters, cases, partners, resources"
              className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden text-[14px] font-semibold text-ink-2 hover:text-blue hover:no-underline md:inline"
          >
            Sign in
          </a>
          <a
            href="#demo"
            className="hidden items-center gap-1.5 rounded-sm bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-light hover:no-underline lg:inline-flex"
          >
            Request Demo
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </a>
          <button className="grid h-11 w-11 place-items-center rounded-sm border border-line text-ink-2 lg:hidden">
            <Icon.Menu className="h-5 w-5" />
          </button>
        </div>
      </Container>
    </div>
  );
}

function PrimaryNav() {
  const items = [
    "Disasters & Recovery",
    "Case Management",
    "Referral Exchange",
    "Partner Organizations",
    "Reports",
  ];

  return (
    <nav className="border-b-4 border-gold bg-navy text-white">
      <Container className="flex h-12 items-stretch">
        <ul className="flex items-stretch gap-1">
          {items.map((item, i) => (
            <li key={item} className="flex items-stretch">
              <a
                href="#"
                data-active={i === 0 ? "true" : "false"}
                className="rb-nav-link inline-flex items-center px-4 text-[14px] font-semibold tracking-tight text-white/90 hover:text-white hover:no-underline"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#demo"
          className="ml-auto inline-flex items-center gap-1.5 self-stretch border-l border-white/10 bg-navy-light px-5 text-[14px] font-semibold text-white hover:bg-blue hover:no-underline"
        >
          Request Demo
          <Icon.ArrowRight className="h-3.5 w-3.5" />
        </a>
      </Container>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 rb-dotgrid opacity-60" aria-hidden />
      <Container className="relative grid items-stretch gap-0 py-0 lg:grid-cols-12">
        <div className="relative py-14 lg:col-span-7 lg:py-20 lg:pr-12">
          <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/85">
            <Icon.Shield className="h-3.5 w-3.5 text-gold" />
            For Long-Term Recovery Groups, VOAD partners & nonprofits
          </div>

          <h1 className="mt-6 max-w-[18ch] text-[44px] font-bold leading-[1.07] tracking-tight md:text-[56px]">
            Helping recovery organizations
            <span className="block text-gold">
              coordinate, rebuild, and report.
            </span>
          </h1>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-7 text-white/85">
            ReliefBridge helps nonprofits, churches, long-term recovery groups,
            and case managers coordinate survivor cases, unmet needs, referrals,
            partner activity, and recovery outcomes — in one secure platform.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryButton>
              Request Demo
              <Icon.ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <SecondaryButton>View Platform</SecondaryButton>
            <a
              href="#"
              className="ml-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-white/85 hover:text-white hover:no-underline"
            >
              Talk to recovery operations
              <Icon.ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-white/70">
            <div className="flex items-center gap-2">
              <Icon.Lock className="h-3.5 w-3.5 text-gold" />
              Encrypted at rest & in transit
            </div>
            <div className="flex items-center gap-2">
              <Icon.CircleCheck className="h-3.5 w-3.5 text-gold" />
              Built for VOAD & LTRG coordination
            </div>
            <div className="flex items-center gap-2">
              <Icon.Shield className="h-3.5 w-3.5 text-gold" />
              Consent-aware data handling
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative h-[300px] lg:absolute lg:inset-y-0 lg:-right-8 lg:left-0 lg:h-auto lg:w-[calc(100%+2rem)]">
            <img
              src={IMG.heroBuilder}
              alt="A construction worker repairing a home after a disaster"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/30 to-transparent lg:bg-gradient-to-r lg:from-navy lg:via-navy/50 lg:to-transparent" />
          </div>
        </div>
      </Container>

      <div className="relative border-t border-white/10 bg-navy-dark">
        <Container className="flex h-12 items-center gap-3 text-[13px]">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-gold px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-navy">
            Active
          </span>
          <span className="text-white/90">
            <span className="font-semibold">Coordination notice:</span> 6
            disaster zones currently active across Gulf Coast LTRG, Western NC,
            and Hawaii recovery networks.
          </span>
        </Container>
      </div>
    </section>
  );
}

function StatsStrip() {
  const stats = [
    { value: "1,400+", label: "Survivor cases coordinated" },
    { value: "180+", label: "Partner organizations" },
    { value: "18", label: "States served" },
    { value: "98%", label: "Referral response within 48h" },
  ];

  return (
    <section className="border-b border-line bg-surface-2">
      <Container className="grid grid-cols-2 gap-y-8 py-12 md:grid-cols-4 md:gap-y-0">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col gap-1.5 px-2 md:px-6 ${
              i !== 0 ? "md:border-l md:border-line" : ""
            }`}
          >
            <div className="rb-numerals text-[34px] font-bold leading-none tracking-tight text-navy md:text-[40px]">
              {s.value}
            </div>
            <div className="text-[13.5px] font-medium text-ink-3">
              {s.label}
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

function CapabilitiesGrid() {
  const items = [
    {
      icon: Icon.CaseFolder,
      title: "Survivor case coordination",
      body: "Intake, assignment, and lifecycle tracking for every survivor case. Notes, consent, and history in one record.",
    },
    {
      icon: Icon.Handshake,
      title: "Referral exchange",
      body: "Securely refer survivors to vetted partner organizations. Track acceptance, status, and outcomes end-to-end.",
    },
    {
      icon: Icon.Heart,
      title: "Unmet needs tracking",
      body: "Capture and prioritize survivor needs across housing, repair, legal aid, mental health, and transportation.",
    },
    {
      icon: Icon.Network,
      title: "Partner organization network",
      body: "Directory, capacity, and service coverage for every partner — VOAD, LTRG, faith-based, county, and nonprofit.",
    },
    {
      icon: Icon.Chart,
      title: "Recovery reports & outcomes",
      body: "Funder-ready reporting on closures, referrals accepted, duplicate-service risk, and outcomes by zone.",
    },
    {
      icon: Icon.Shield,
      title: "Consent & privacy ready",
      body: "Role-based access, audit trails, and consent capture designed for survivor data protection from day one.",
    },
  ];

  return (
    <section className="bg-surface py-20">
      <Container>
        <div className="max-w-2xl">
          <div className="rb-rule-gold" />
          <h2 className="text-[34px] font-bold leading-tight tracking-tight text-navy md:text-[40px]">
            A platform built for serious recovery work.
          </h2>
          <p className="mt-4 text-[16.5px] leading-7 text-ink-2">
            Replace spreadsheets, scattered email threads, and one-off databases
            with a coordinated workspace for survivor cases, partner referrals,
            and recovery reporting.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Ico = it.icon;
            return (
              <div
                key={it.title}
                className="group flex flex-col gap-4 bg-surface p-7 transition hover:bg-blue-pale"
              >
                <span className="grid h-12 w-12 place-items-center rounded-sm bg-blue-soft text-navy transition group-hover:bg-blue group-hover:text-white">
                  <Ico className="h-6 w-6" />
                </span>
                <h3 className="text-[18px] font-semibold text-navy">
                  {it.title}
                </h3>
                <p className="text-[14.5px] leading-6 text-ink-2">{it.body}</p>
                <a
                  href="#"
                  className="mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-blue hover:text-navy-light"
                >
                  Learn more
                  <Icon.ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function FeatureRow({
  image,
  alt,
  eyebrow,
  title,
  body,
  bullets,
  cta,
  flip = false,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  flip?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
        flip ? "lg:[direction:rtl]" : ""
      }`}
    >
      <div className={flip ? "lg:[direction:ltr]" : ""}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-surface-3">
          <img src={image} alt={alt} className="h-full w-full object-cover" />
        </div>
      </div>
      <div className={flip ? "lg:[direction:ltr]" : ""}>
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
          {eyebrow}
        </div>
        <h3 className="mt-3 text-[30px] font-bold leading-tight tracking-tight text-navy md:text-[34px]">
          {title}
        </h3>
        <p className="mt-4 text-[16px] leading-7 text-ink-2">{body}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[15px] text-ink">
              <Icon.CircleCheck className="mt-[3px] h-[18px] w-[18px] shrink-0 text-blue" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <a
          href="#"
          className="mt-7 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-blue hover:text-navy-light"
        >
          {cta}
          <Icon.ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function FeatureSections() {
  return (
    <section className="bg-surface-2 py-20">
      <Container className="flex flex-col gap-20">
        <FeatureRow
          image={IMG.damagedRow}
          alt="Damaged homes along a residential street after a major storm"
          eyebrow="Coordinated Disaster Response"
          title="One survivor record, from intake to closure."
          body="Every survivor has a single coordinated record — events, household, needs, consent, notes, referrals, and outcomes. No duplicate-service risk across partners."
          bullets={[
            "Structured intake with consent capture",
            "Household, demographics, and disaster events linked",
            "Case manager assignment and lifecycle tracking",
            "Audit trail of every note, status, and referral",
          ]}
          cta="See case management"
        />
        <FeatureRow
          flip
          image={IMG.rebuildingInterior}
          alt="A worker rebuilding the interior of a home after damage"
          eyebrow="Partner Referral Exchange"
          title="Refer survivors to the right partner — and track what happens."
          body="Send vetted referrals to housing partners, legal aid, repair coalitions, and faith-based responders. See response times, acceptance, and outcomes for every handoff."
          bullets={[
            "Secure referrals with structured consent",
            "Partner directory with capacity and service coverage",
            "Acceptance, response time, and outcome reporting",
            "Closes the loop on unmet needs across the network",
          ]}
          cta="See the referral exchange"
        />
      </Container>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="bg-surface py-20">
      <Container>
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="rb-rule-gold" />
            <h2 className="text-[34px] font-bold leading-tight tracking-tight text-navy md:text-[40px]">
              The recovery operations workspace your team has been waiting for.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[16px] leading-7 text-ink-2">
              A purpose-built workspace for case managers and recovery directors
              — not a generic CRM, not a spreadsheet, not a one-off database.
            </p>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-md border border-line bg-surface shadow-lift">
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-line" />
            <span className="h-3 w-3 rounded-full bg-line" />
            <span className="h-3 w-3 rounded-full bg-line" />
            <div className="ml-3 flex h-7 max-w-[420px] flex-1 items-center gap-2 rounded-sm border border-line bg-surface px-3 text-[12px] text-ink-3">
              <Icon.Lock className="h-3.5 w-3.5 text-green" />
              app.reliefbridge.com/cases
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
            <aside className="hidden flex-col border-r border-line bg-surface-2 lg:flex">
              <div className="border-b border-line px-4 py-5">
                <ReliefBridgeLogo />
              </div>

              <div className="px-3 py-5">
                <div className="px-3 pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Workspace
                </div>
                <ul className="space-y-0.5 text-[13px]">
                  {["Overview", "Survivors", "Recovery cases", "Unmet needs"].map(
                    (item) => (
                      <li key={item}>
                        <span
                          className={`block rounded-sm px-3 py-2 ${
                            item === "Recovery cases"
                              ? "bg-blue text-white"
                              : "text-ink-2 hover:bg-surface"
                          }`}
                        >
                          {item}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </aside>

            <div className="bg-surface px-5 py-6 md:px-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blue">
                    Gulf Coast LTRG · Recovery cases
                  </div>
                  <h3 className="mt-2 text-[24px] font-bold tracking-tight text-navy">
                    142 active cases across 6 disaster zones
                  </h3>
                </div>
                <button className="rounded-sm bg-blue px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-navy-light">
                  + Add survivor
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["142", "Active cases", "+8 this week"],
                  ["18", "Pending referrals", "-3 vs last week"],
                  ["74", "Open unmet needs", "+12 this month"],
                ].map((s) => (
                  <div key={s[1]} className="rounded-sm border border-line bg-surface p-4">
                    <div className="text-[12px] font-semibold text-ink-3">
                      {s[1]}
                    </div>
                    <div className="rb-numerals mt-1 text-[26px] font-bold leading-none tracking-tight text-navy">
                      {s[0]}
                    </div>
                    <div className="mt-2 text-[11.5px] font-semibold text-green">
                      {s[2]}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-sm border border-line">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead className="bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    <tr>
                      <th className="px-4 py-3">Survivor</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Primary need</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Angela Morris", "Hurricane Idalia", "Emergency housing", "High", "Open"],
                      ["Maria Lopez", "TS flooding · NC", "Roof repair referral", "High", "In Review"],
                      ["David Carter", "House fire · Beaumont", "Insurance documentation", "Medium", "Open"],
                      ["Samuel Wright", "Tornado · Mayfield", "Transportation support", "Medium", "Follow-up"],
                    ].map((r) => (
                      <tr key={r[0]} className="border-t border-line">
                        <td className="px-4 py-3 font-semibold text-navy">{r[0]}</td>
                        <td className="px-4 py-3 text-ink-2">{r[1]}</td>
                        <td className="px-4 py-3 text-ink-2">{r[2]}</td>
                        <td className="px-4 py-3 text-red">{r[3]}</td>
                        <td className="px-4 py-3 text-blue">{r[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhoItsFor() {
  const orgs = [
    "Long-Term Recovery Groups (LTRGs)",
    "VOAD member organizations",
    "Faith-based recovery networks",
    "County recovery offices",
    "Nonprofit case management teams",
    "Grant-funded recovery programs",
  ];

  return (
    <section className="border-y border-line bg-surface py-16">
      <Container className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
            Built for the recovery community
          </div>
          <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-navy md:text-[32px]">
            Trusted by the organizations doing the real work after disasters.
          </h2>
          <p className="mt-4 text-[15.5px] leading-7 text-ink-2">
            ReliefBridge is designed for the coordination layer of disaster
            recovery — where survivors, partners, and case managers meet.
          </p>
        </div>

        <div className="lg:col-span-7">
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
            {orgs.map((o) => (
              <li
                key={o}
                className="flex items-center gap-3 bg-surface px-5 py-4 text-[14.5px] font-medium text-ink"
              >
                <Icon.CircleCheck className="h-5 w-5 shrink-0 text-blue" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function CTABand() {
  return (
    <section id="demo" className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 rb-dotgrid opacity-60" aria-hidden />
      <Container className="relative grid gap-10 py-16 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">
            Request a Demo
          </div>
          <h2 className="mt-3 max-w-[24ch] text-[34px] font-bold leading-[1.1] tracking-tight md:text-[42px]">
            See ReliefBridge inside your recovery organization.
          </h2>
          <p className="mt-4 max-w-[60ch] text-[16px] leading-7 text-white/85">
            A 30-minute walk-through with our recovery operations team.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <PrimaryButton>
              Request Demo
              <Icon.ArrowRight className="h-4 w-4" />
            </PrimaryButton>
            <SecondaryButton>
              <Icon.Phone className="h-4 w-4" />
              Call (24/7)
            </SecondaryButton>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-navy text-white">
      <Container className="grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ReliefBridgeLogo light />
          <p className="mt-6 max-w-md text-[14px] leading-6 text-white/75">
            ReliefBridge is the coordination platform for long-term disaster
            recovery. A Westforge Holdings product, built for nonprofits,
            recovery groups, and the partners who serve survivors.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-7">
          {[
            ["Platform", "Case Management", "Referral Exchange", "Unmet Needs"],
            ["Solutions", "Long-Term Recovery Groups", "VOAD Partners", "County Offices"],
            ["Resources", "Help Center", "Security & Privacy", "Accessibility"],
            ["Company", "About Westforge", "Contact", "Press"],
          ].map((col) => (
            <div key={col[0]}>
              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-gold">
                {col[0]}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.slice(1).map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13.5px] text-white/85 hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-5 text-[12.5px] text-white/70">
          <div>
            © {new Date().getFullYear()} Westforge Holdings. ReliefBridge is a
            Westforge Holdings platform. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Security
            </a>
            <a href="#" className="hover:text-white">
              Accessibility
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <OfficialBanner />
      <Masthead />
      <PrimaryNav />
      <main>
        <Hero />
        <StatsStrip />
        <CapabilitiesGrid />
        <FeatureSections />
        <DashboardPreview />
        <WhoItsFor />
        <CTABand />
      </main>
      <Footer />
    </>
  );
}