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

const navigationItems = [
  { label: "Disasters & Recovery", href: "#platform" },
  { label: "Case Management", href: "/app/cases" },
  { label: "Referral Exchange", href: "/app/referrals" },
  { label: "Partner Organizations", href: "/app/partners" },
  { label: "Reports", href: "/app/reports" },
];

type IconProps = SVGProps<SVGSVGElement>;

const baseStroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Icon = {
  Flag: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-1.5 3.5L16 11H5" />
    </svg>
  ),

  Search: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  ),

  ArrowRight: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  ),

  ChevronRight: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),

  CaseFolder: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <path d="M4 9.5a2 2 0 0 1 2-2h6.5l2.5 2.5H26a2 2 0 0 1 2 2V24a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M4 13h24" />
    </svg>
  ),

  Handshake: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <path d="M3 16h4l3-4 4 3 3-3 4 3 5-4 3 2" />
      <path d="M10 18.5c1 2 4 3 5.5 1.5" />
      <path d="M18 21c1.5 1.5 4.5.5 5-1.5" />
    </svg>
  ),

  Heart: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <path d="M16 27S5 21 5 13.5a5.5 5.5 0 0 1 11-2.2 5.5 5.5 0 0 1 11 2.2C27 21 16 27 16 27Z" />
    </svg>
  ),

  Network: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <circle cx="16" cy="6" r="2.5" />
      <circle cx="6" cy="24" r="2.5" />
      <circle cx="26" cy="24" r="2.5" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="M16 8.5v5M14 18l-6 4M18 18l6 4" />
    </svg>
  ),

  Chart: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <path d="M5 27V8" />
      <path d="M5 27h22" />
      <path d="M10 22v-6" />
      <path d="M16 22v-10" />
      <path d="M22 22v-4" />
      <path d="M27 22V14" />
    </svg>
  ),

  Shield: (props: IconProps) => (
    <svg viewBox="0 0 32 32" {...baseStroke} {...props}>
      <path d="M16 4 5 8v8c0 6.5 4.5 10.5 11 12 6.5-1.5 11-5.5 11-12V8Z" />
      <path d="m11.5 16.5 3 3 6-6" />
    </svg>
  ),

  Mail: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m5 7 7 5 7-5" />
    </svg>
  ),

  Lock: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <rect x="5.5" y="10.5" width="13" height="9" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
    </svg>
  ),

  CircleCheck: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  ),

  Menu: (props: IconProps) => (
    <svg viewBox="0 0 24 24" {...baseStroke} {...props}>
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
    <div
      className={`mx-auto w-full min-w-0 max-w-[1280px] px-4 sm:px-5 md:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

function ReliefBridgeLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-[#08264A] shadow-lg shadow-black/20 sm:h-[70px] sm:w-[70px] sm:rounded-[14px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B5E9E] via-[#08264A] to-[#06182E]" />
        <div className="absolute left-[-14px] top-[27px] h-[10px] w-[90px] rotate-[-22deg] bg-[#FDB022] sm:top-[33px] sm:h-[12px] sm:w-[110px]" />
        <div className="absolute bottom-0 left-[14px] h-[27px] w-[7px] bg-[#FDB022] sm:left-[18px] sm:h-[34px] sm:w-[8px]" />
        <div className="absolute bottom-0 left-[27px] h-[36px] w-[7px] bg-[#FDB022] sm:left-[34px] sm:h-[45px] sm:w-[8px]" />
        <div className="absolute bottom-0 left-[40px] h-[23px] w-[7px] bg-[#FDB022] sm:left-[50px] sm:h-[28px] sm:w-[8px]" />

        <div className="relative z-10 text-[22px] font-black text-white sm:text-[26px]">
          R
        </div>
      </div>

      <div className="min-w-0">
        <div
          className={`whitespace-nowrap text-[24px] font-black leading-none tracking-tight sm:text-[30px] ${
            light ? "text-white" : "text-navy"
          }`}
        >
          ReliefBridge
        </div>

        <div
          className={`mt-2 hidden text-[11px] font-bold uppercase tracking-[0.22em] sm:block ${
            light ? "text-white/75" : "text-ink-3"
          }`}
        >
          Disaster Recovery Coordination
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  children,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-blue px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-navy-light hover:no-underline sm:w-auto"
      : "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border-2 border-white/80 bg-transparent px-5 py-[10px] text-[15px] font-semibold text-white transition hover:bg-white hover:text-navy hover:no-underline sm:w-auto";

  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("http")
  ) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function OfficialBanner() {
  return (
    <div className="bg-navy-dark text-white">
      <Container className="flex min-h-9 items-start gap-2.5 py-2 text-[11.5px] leading-4 sm:items-center sm:gap-3 sm:text-[12.5px]">
        <Icon.Flag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold sm:mt-0" />

        <span className="font-medium tracking-tight">
          A Westforge Holdings disaster recovery coordination platform
        </span>

        <span className="ml-auto hidden items-center gap-4 text-white/80 md:flex">
          <Link
            href="/request-demo"
            className="hover:text-white hover:no-underline"
          >
            Help Center
          </Link>

          <span className="h-3 w-px bg-white/25" />

          <a
            href="mailto:contact@reliefbridge.net"
            className="hover:text-white hover:no-underline"
          >
            Contact
          </a>
        </span>
      </Container>
    </div>
  );
}

function MobileNavigation() {
  return (
    <details className="group relative ml-auto shrink-0 lg:hidden">
      <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-sm border border-line bg-surface text-ink-2 [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Open navigation menu</span>
        <Icon.Menu className="h-5 w-5" />
      </summary>

      <div className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-2rem)] max-w-[300px] overflow-hidden rounded-md border border-line bg-white shadow-lift">
        <div className="border-b border-line p-3">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-sm bg-navy px-4 text-[14px] font-semibold text-white hover:bg-navy-light hover:no-underline"
          >
            Sign in
          </Link>
        </div>

        <nav className="p-2">
          {navigationItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-11 items-center rounded-sm px-3 py-2 text-[14px] font-semibold text-navy hover:bg-blue-pale hover:text-blue hover:no-underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            href="/request-demo"
            className="flex h-11 items-center justify-center gap-2 rounded-sm bg-blue px-4 text-[14px] font-semibold text-white hover:bg-navy-light hover:no-underline"
          >
            Request Demo
            <Icon.ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </details>
  );
}

function Masthead() {
  return (
    <div className="relative z-40 border-b border-line bg-surface">
      <Container className="flex min-h-[88px] min-w-0 items-center gap-3 py-4 sm:min-h-[112px] sm:gap-8 sm:py-5">
        <Link
          href="/"
          aria-label="ReliefBridge home"
          className="min-w-0 hover:no-underline"
        >
          <ReliefBridgeLogo />
        </Link>

        <div className="ml-auto hidden max-w-[440px] flex-1 md:block">
          <label className="flex h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-blue">
            <Icon.Search className="h-4 w-4 shrink-0 text-ink-3" />

            <input
              type="text"
              placeholder="Search disasters, cases, partners, resources"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
            />
          </label>
        </div>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-[14px] font-semibold text-ink-2 hover:text-blue hover:no-underline"
          >
            Sign in
          </Link>

          <Link
            href="/request-demo"
            className="inline-flex items-center gap-1.5 rounded-sm bg-navy px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-light hover:no-underline"
          >
            Request Demo
            <Icon.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <MobileNavigation />
      </Container>
    </div>
  );
}

function PrimaryNav() {
  return (
    <nav className="hidden border-b-4 border-gold bg-navy text-white lg:block">
      <Container className="flex h-12 items-stretch">
        <ul className="flex items-stretch gap-1">
          {navigationItems.map((item, index) => (
            <li key={item.label} className="flex items-stretch">
              <Link
                href={item.href}
                data-active={index === 0 ? "true" : "false"}
                className="rb-nav-link inline-flex items-center px-4 text-[14px] font-semibold tracking-tight text-white/90 hover:text-white hover:no-underline"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/request-demo"
          className="ml-auto inline-flex items-center gap-1.5 self-stretch border-l border-white/10 bg-navy-light px-5 text-[14px] font-semibold text-white hover:bg-blue hover:no-underline"
        >
          Request Demo
          <Icon.ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </Container>
    </nav>
  );
}

function Hero() {
  return (
    <section
      id="platform"
      className="relative min-w-0 overflow-hidden bg-navy text-white"
    >
      <div className="absolute inset-0 rb-dotgrid opacity-60" aria-hidden />

      <Container className="relative grid min-w-0 items-stretch gap-0 py-0 lg:grid-cols-12">
        <div className="relative min-w-0 py-10 sm:py-14 lg:col-span-7 lg:py-20 lg:pr-12">
          <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-2 text-[10.5px] font-semibold uppercase leading-5 tracking-[0.1em] text-white/85 sm:py-1 sm:text-[11.5px] sm:tracking-[0.12em]">
            <Icon.Shield className="h-3.5 w-3.5 shrink-0 text-gold" />
            <span>
              For Long-Term Recovery Groups, VOAD partners &amp; nonprofits
            </span>
          </div>

          <h1 className="mt-6 max-w-[18ch] break-words text-[38px] font-bold leading-[1.06] tracking-tight sm:text-[44px] md:text-[56px]">
            Helping recovery organizations
            <span className="mt-2 block text-gold sm:mt-0">
              coordinate, rebuild, and report.
            </span>
          </h1>

          <p className="mt-6 max-w-[58ch] text-[16px] leading-7 text-white/85 sm:text-[17px]">
            ReliefBridge helps nonprofits, churches, long-term recovery groups,
            and case managers coordinate survivor cases, unmet needs, referrals,
            partner activity, and recovery outcomes — in one secure platform.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
            <ActionLink href="/request-demo">
              Request Demo
              <Icon.ArrowRight className="h-4 w-4" />
            </ActionLink>

            <ActionLink href="/login" variant="secondary">
              View Platform
            </ActionLink>

            <Link
              href="/request-demo"
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 text-center text-[14px] font-semibold text-white/85 hover:text-white hover:no-underline sm:ml-1 sm:w-auto"
            >
              Talk to recovery operations
              <Icon.ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-9 grid gap-3 text-[12.5px] text-white/70 sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
            <div className="flex items-center gap-2">
              <Icon.Lock className="h-3.5 w-3.5 shrink-0 text-gold" />
              Encrypted at rest &amp; in transit
            </div>

            <div className="flex items-center gap-2">
              <Icon.CircleCheck className="h-3.5 w-3.5 shrink-0 text-gold" />
              Built for VOAD &amp; LTRG coordination
            </div>

            <div className="flex items-center gap-2">
              <Icon.Shield className="h-3.5 w-3.5 shrink-0 text-gold" />
              Consent-aware data handling
            </div>
          </div>
        </div>

        <div className="relative min-w-0 lg:col-span-5">
          <div className="relative h-[240px] sm:h-[300px] lg:absolute lg:inset-y-0 lg:-right-8 lg:left-0 lg:h-auto lg:w-[calc(100%+2rem)]">
            <img
              src={IMG.heroBuilder}
              alt="A construction worker repairing a home after a disaster"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent lg:from-navy lg:via-navy/50" />
          </div>
        </div>
      </Container>

      <div className="relative border-t border-white/10 bg-navy-dark">
        <Container className="flex min-h-12 items-start gap-3 py-3 text-[12.5px] leading-5 sm:items-center sm:text-[13px]">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy sm:text-[11px]">
            Pilot
          </span>

          <span className="min-w-0 text-white/90">
            <span className="font-semibold">
              Founding Recovery Partner Pilot:
            </span>{" "}
            Now onboarding a limited number of disaster-recovery organizations
            serving active recovery communities nationwide.
          </span>
        </Container>
      </div>
    </section>
  );
}

function StatsStrip() {
  const capabilities = [
    {
      title: "Case coordination",
      description:
        "Organize intake, assignment, consent, notes, and recovery progress.",
    },
    {
      title: "Referral accountability",
      description:
        "Track partner handoffs, responses, follow-up, and outcomes.",
    },
    {
      title: "Unmet needs visibility",
      description:
        "Identify and prioritize survivor needs still requiring action.",
    },
    {
      title: "Funder-ready reporting",
      description:
        "View operational trends and export structured Excel reports.",
    },
  ];

  return (
    <section className="border-b border-line bg-surface-2">
      <Container className="grid grid-cols-1 gap-x-4 gap-y-6 py-10 sm:grid-cols-2 sm:py-12 md:grid-cols-4 md:gap-y-0">
        {capabilities.map((capability, index) => (
          <div
            key={capability.title}
            className={`flex min-w-0 flex-col gap-2 px-1 sm:px-2 md:px-6 ${
              index !== 0 ? "md:border-l md:border-line" : ""
            }`}
          >
            <div className="text-[17px] font-bold leading-6 tracking-tight text-navy">
              {capability.title}
            </div>

            <div className="text-[12.5px] font-medium leading-5 text-ink-3 sm:text-[13px]">
              {capability.description}
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
      body: "Send structured referrals to partner organizations. Track acceptance, status, follow-up, and outcomes end-to-end.",
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
      body: "Funder-ready reporting on case progress, referrals, unmet needs, partner activity, and recovery outcomes.",
    },
    {
      icon: Icon.Shield,
      title: "Consent & privacy ready",
      body: "Role-based access and consent-aware workflows designed to support responsible survivor data handling.",
    },
  ];

  return (
    <section className="bg-surface py-14 sm:py-20">
      <Container>
        <div className="max-w-2xl">
          <div className="rb-rule-gold" />

          <h2 className="text-[30px] font-bold leading-tight tracking-tight text-navy sm:text-[34px] md:text-[40px]">
            A platform built for serious recovery work.
          </h2>

          <p className="mt-4 text-[15.5px] leading-7 text-ink-2 sm:text-[16.5px]">
            Replace spreadsheets, scattered email threads, and one-off databases
            with a coordinated workspace for survivor cases, partner referrals,
            and recovery reporting.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const ItemIcon = item.icon;

            return (
              <div
                key={item.title}
                className="group flex min-w-0 flex-col gap-4 bg-surface p-5 transition hover:bg-blue-pale sm:p-7"
              >
                <span className="grid h-12 w-12 place-items-center rounded-sm bg-blue-soft text-navy transition group-hover:bg-blue group-hover:text-white">
                  <ItemIcon className="h-6 w-6" />
                </span>

                <h3 className="text-[18px] font-semibold text-navy">
                  {item.title}
                </h3>

                <p className="text-[14.5px] leading-6 text-ink-2">
                  {item.body}
                </p>

                <Link
                  href="/request-demo"
                  className="mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-blue hover:text-navy-light"
                >
                  Learn more
                  <Icon.ChevronRight className="h-3.5 w-3.5" />
                </Link>
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
  href,
  flip = false,
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  cta: string;
  href: string;
  flip?: boolean;
}) {
  return (
    <div
      className={`grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-16 ${
        flip ? "lg:[direction:rtl]" : ""
      }`}
    >
      <div className={`min-w-0 ${flip ? "lg:[direction:ltr]" : ""}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-line bg-surface-3">
          <img src={image} alt={alt} className="h-full w-full object-cover" />
        </div>
      </div>

      <div className={`min-w-0 ${flip ? "lg:[direction:ltr]" : ""}`}>
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
          {eyebrow}
        </div>

        <h3 className="mt-3 text-[28px] font-bold leading-tight tracking-tight text-navy sm:text-[30px] md:text-[34px]">
          {title}
        </h3>

        <p className="mt-4 text-[15.5px] leading-7 text-ink-2 sm:text-[16px]">
          {body}
        </p>

        <ul className="mt-6 space-y-3">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-3 text-[15px] text-ink"
            >
              <Icon.CircleCheck className="mt-[3px] h-[18px] w-[18px] shrink-0 text-blue" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-7 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-blue hover:text-navy-light"
        >
          {cta}
          <Icon.ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function FeatureSections() {
  return (
    <section className="bg-surface-2 py-14 sm:py-20">
      <Container className="flex min-w-0 flex-col gap-14 sm:gap-20">
        <FeatureRow
          image={IMG.damagedRow}
          alt="Damaged homes along a residential street after a major storm"
          eyebrow="Coordinated Disaster Response"
          title="One survivor record, from intake to closure."
          body="Every survivor can have one coordinated record for events, household information, needs, consent, notes, referrals, and outcomes — helping reduce duplicate-service risk across partners."
          bullets={[
            "Structured intake with consent capture",
            "Household, demographics, and disaster events linked",
            "Case manager assignment and lifecycle tracking",
            "Organized history of notes, statuses, and referrals",
          ]}
          cta="See case management"
          href="/login"
        />

        <FeatureRow
          flip
          image={IMG.rebuildingInterior}
          alt="A worker rebuilding the interior of a home after damage"
          eyebrow="Partner Referral Exchange"
          title="Refer survivors to the right partner — and track what happens."
          body="Send structured referrals to housing partners, legal aid, repair coalitions, and faith-based responders. Monitor response times, acceptance, progress, and outcomes for every handoff."
          bullets={[
            "Secure referrals with structured consent",
            "Partner directory with capacity and service coverage",
            "Acceptance, response time, and outcome reporting",
            "Continued visibility into unmet needs across the network",
          ]}
          cta="See the referral exchange"
          href="/login"
        />
      </Container>
    </section>
  );
}

function DashboardPreview() {
  const workflowCards = [
    {
      title: "Case coordination",
      description: "Track intake through closure",
      status: "Organized",
    },
    {
      title: "Partner referrals",
      description: "Monitor every handoff",
      status: "Visible",
    },
    {
      title: "Unmet needs",
      description: "Prioritize continued action",
      status: "Actionable",
    },
  ];

  const sampleRows = [
    [
      "Sample household A",
      "Initial assessment",
      "Temporary housing",
      "High",
      "Open",
    ],
    [
      "Sample household B",
      "Partner referral",
      "Roof repair support",
      "High",
      "In review",
    ],
    [
      "Sample household C",
      "Documentation",
      "Insurance assistance",
      "Medium",
      "Follow-up",
    ],
    [
      "Sample household D",
      "Recovery planning",
      "Transportation support",
      "Medium",
      "Coordinating",
    ],
  ];

  return (
    <section className="bg-surface py-14 sm:py-20">
      <Container>
        <div className="grid min-w-0 items-end gap-6 sm:gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <div className="rb-rule-gold" />

            <h2 className="text-[30px] font-bold leading-tight tracking-tight text-navy sm:text-[34px] md:text-[40px]">
              The recovery operations workspace your team has been waiting for.
            </h2>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <p className="text-[15.5px] leading-7 text-ink-2 sm:text-[16px]">
              A purpose-built workspace for case managers and recovery directors
              — not a generic CRM, not a spreadsheet, and not a disconnected
              database.
            </p>
          </div>
        </div>

        <div className="mt-10 min-w-0 overflow-hidden rounded-md border border-line bg-surface shadow-lift sm:mt-12">
          <div className="flex min-w-0 items-center gap-2 border-b border-line bg-surface-2 px-3 py-3 sm:px-4">
            <span className="h-3 w-3 shrink-0 rounded-full bg-line" />
            <span className="h-3 w-3 shrink-0 rounded-full bg-line" />
            <span className="h-3 w-3 shrink-0 rounded-full bg-line" />

            <div className="ml-1 flex h-7 min-w-0 max-w-[420px] flex-1 items-center gap-2 overflow-hidden rounded-sm border border-line bg-surface px-2 text-[11px] text-ink-3 sm:ml-3 sm:px-3 sm:text-[12px]">
              <Icon.Lock className="h-3.5 w-3.5 shrink-0 text-green" />
              <span className="truncate">reliefbridge.net/app/cases</span>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden min-w-0 overflow-hidden border-r border-line bg-surface-2 lg:flex lg:flex-col">
              <div className="border-b border-line px-4 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[#08264A] shadow-md shadow-black/15">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0B5E9E] via-[#08264A] to-[#06182E]" />
                    <div className="absolute left-[-12px] top-[23px] h-[9px] w-[78px] rotate-[-22deg] bg-[#FDB022]" />
                    <div className="absolute bottom-0 left-[12px] h-[23px] w-[6px] bg-[#FDB022]" />
                    <div className="absolute bottom-0 left-[23px] h-[31px] w-[6px] bg-[#FDB022]" />
                    <div className="absolute bottom-0 left-[34px] h-[20px] w-[6px] bg-[#FDB022]" />

                    <div className="relative z-10 text-[19px] font-black text-white">
                      R
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-[20px] font-black leading-none tracking-tight text-navy">
                      ReliefBridge
                    </div>

                    <div className="mt-2 text-[8.5px] font-bold uppercase leading-[1.45] tracking-[0.16em] text-ink-3">
                      <span className="block">Disaster Recovery</span>
                      <span className="block">Coordination</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 py-5">
                <div className="px-3 pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  Workspace
                </div>

                <ul className="space-y-0.5 text-[13px]">
                  {[
                    "Overview",
                    "Survivors",
                    "Recovery cases",
                    "Unmet needs",
                  ].map((item) => (
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
                  ))}
                </ul>
              </div>
            </aside>

            <div className="min-w-0 bg-surface px-4 py-5 sm:px-5 sm:py-6 md:px-8">
              <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase leading-5 tracking-[0.12em] text-blue sm:text-[12px] sm:tracking-[0.14em]">
                    Sample recovery workspace
                  </div>

                  <h3 className="mt-2 text-[21px] font-bold leading-tight tracking-tight text-navy sm:text-[24px]">
                    A clear operational view for every recovery team.
                  </h3>
                </div>

                <span className="rounded-sm bg-blue px-3 py-2 text-[12.5px] font-semibold text-white">
                  + Add survivor
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {workflowCards.map((card) => (
                  <div
                    key={card.title}
                    className="min-w-0 rounded-sm border border-line bg-surface p-4"
                  >
                    <div className="text-[12px] font-semibold text-ink-3">
                      {card.title}
                    </div>

                    <div className="mt-2 text-[15px] font-bold leading-5 text-navy">
                      {card.description}
                    </div>

                    <div className="mt-3 inline-flex rounded-full bg-green/10 px-2 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-green">
                      {card.status}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 max-w-full overflow-x-auto rounded-sm border border-line">
                <table className="min-w-[720px] border-collapse text-left text-[13px]">
                  <thead className="bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                    <tr>
                      <th className="px-4 py-3">Sample record</th>
                      <th className="px-4 py-3">Recovery stage</th>
                      <th className="px-4 py-3">Primary need</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sampleRows.map((row) => (
                      <tr key={row[0]} className="border-t border-line">
                        <td className="px-4 py-3 font-semibold text-navy">
                          {row[0]}
                        </td>

                        <td className="px-4 py-3 text-ink-2">{row[1]}</td>

                        <td className="px-4 py-3 text-ink-2">{row[2]}</td>

                        <td className="px-4 py-3 text-red">{row[3]}</td>

                        <td className="px-4 py-3 text-blue">{row[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-[11px] leading-5 text-ink-3">
                Sample data shown for demonstration purposes only.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhoItsFor() {
  const organizations = [
    "Long-Term Recovery Groups (LTRGs)",
    "VOAD member organizations",
    "Faith-based recovery networks",
    "County recovery offices",
    "Nonprofit case management teams",
    "Grant-funded recovery programs",
  ];

  return (
    <section className="border-y border-line bg-surface py-14 sm:py-16">
      <Container className="grid min-w-0 items-start gap-8 sm:gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue">
            Built for the recovery community
          </div>

          <h2 className="mt-3 text-[27px] font-bold leading-tight tracking-tight text-navy sm:text-[28px] md:text-[32px]">
            Designed for the organizations doing the real work after disasters.
          </h2>

          <p className="mt-4 text-[15.5px] leading-7 text-ink-2">
            ReliefBridge is designed for the coordination layer of disaster
            recovery — where survivors, partners, and case managers meet.
          </p>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2">
            {organizations.map((organization) => (
              <li
                key={organization}
                className="flex min-w-0 items-center gap-3 bg-surface px-4 py-4 text-[14.5px] font-medium leading-6 text-ink sm:px-5"
              >
                <Icon.CircleCheck className="h-5 w-5 shrink-0 text-blue" />
                <span className="min-w-0">{organization}</span>
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
    <section
      id="demo"
      className="relative min-w-0 overflow-hidden bg-navy text-white"
    >
      <div className="absolute inset-0 rb-dotgrid opacity-60" aria-hidden />

      <Container className="relative grid min-w-0 gap-8 py-14 sm:gap-10 sm:py-16 lg:grid-cols-12 lg:items-center">
        <div className="min-w-0 lg:col-span-7">
          <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-gold">
            Request a Demo
          </div>

          <h2 className="mt-3 max-w-[24ch] text-[30px] font-bold leading-[1.1] tracking-tight sm:text-[34px] md:text-[42px]">
            See ReliefBridge inside your recovery organization.
          </h2>

          <p className="mt-4 max-w-[60ch] text-[16px] leading-7 text-white/85">
            A tailored walk-through focused on your recovery operations,
            partner network, referrals, and reporting responsibilities.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionLink href="/request-demo">
              Request Demo
              <Icon.ArrowRight className="h-4 w-4" />
            </ActionLink>

            <ActionLink
              href="mailto:contact@reliefbridge.net"
              variant="secondary"
            >
              <Icon.Mail className="h-4 w-4" />
              Email our team
            </ActionLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="min-w-0 border-t border-line bg-navy text-white">
      <Container className="grid min-w-0 gap-10 py-12 sm:py-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <ReliefBridgeLogo light />

          <p className="mt-6 max-w-md text-[14px] leading-6 text-white/75">
            ReliefBridge is the coordination platform for long-term disaster
            recovery. A Westforge Holdings product, built for nonprofits,
            recovery groups, and the partners who serve survivors.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-8 min-[380px]:grid-cols-2 sm:grid-cols-4 lg:col-span-7">
          {[
            ["Platform", "Case Management", "Referral Exchange", "Unmet Needs"],
            [
              "Solutions",
              "Long-Term Recovery Groups",
              "VOAD Partners",
              "County Offices",
            ],
            [
              "Resources",
              "Help Center",
              "Security & Privacy",
              "Accessibility",
            ],
            ["Company", "About Westforge", "Contact", "Press"],
          ].map((column) => (
            <div key={column[0]} className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-gold">
                {column[0]}
              </div>

              <ul className="mt-4 space-y-2.5">
                {column.slice(1).map((item) => (
                  <li key={item}>
                    <Link
                      href={
                        item === "Contact"
                          ? "/request-demo"
                          : item === "Case Management" ||
                              item === "Referral Exchange" ||
                              item === "Unmet Needs"
                            ? "/login"
                            : "/request-demo"
                      }
                      className="text-[13.5px] leading-5 text-white/85 hover:text-white"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex min-w-0 flex-col gap-4 py-5 text-[12.5px] leading-5 text-white/70 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            © {new Date().getFullYear()} Westforge Holdings. ReliefBridge is a
            Westforge Holdings platform. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/request-demo" className="hover:text-white">
              Privacy
            </Link>

            <Link href="/request-demo" className="hover:text-white">
              Security
            </Link>

            <Link href="/request-demo" className="hover:text-white">
              Accessibility
            </Link>

            <Link href="/request-demo" className="hover:text-white">
              Terms
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden">
      <OfficialBanner />
      <Masthead />
      <PrimaryNav />

      <main className="min-w-0">
        <Hero />
        <StatsStrip />
        <CapabilitiesGrid />
        <FeatureSections />
        <DashboardPreview />
        <WhoItsFor />
        <CTABand />
      </main>

      <Footer />
    </div>
  );
}