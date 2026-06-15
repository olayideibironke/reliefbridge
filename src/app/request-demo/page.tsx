import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DemoRequestForm } from "./DemoRequestForm";

export const metadata: Metadata = {
  title: "Request a Demo",
  description:
    "Request a personalized ReliefBridge demonstration for your nonprofit, recovery group, faith-based organization, VOAD partner, county office, or disaster recovery program.",
  alternates: {
    canonical: "/request-demo",
  },
  openGraph: {
    title: "Request a ReliefBridge Demo",
    description:
      "See how ReliefBridge helps recovery organizations coordinate survivors, cases, unmet needs, referrals, partners, and outcomes.",
    url: "/request-demo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Request a ReliefBridge Demo",
    description:
      "See how ReliefBridge helps disaster recovery organizations coordinate cases, referrals, partners, and outcomes.",
  },
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.7 2.7L16.5 9" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5.5c0 4.7 3 7.8 7 9.5 4-1.7 7-4.8 7-9.5V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

function BrandHeader() {
  return (
    <header className="relative z-30 border-b border-white/10 bg-navy-dark text-white">
      <div className="mx-auto flex min-h-[82px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8">
        <Link
          href="/"
          aria-label="ReliefBridge home"
          className="flex min-w-0 items-center gap-3 hover:no-underline"
        >
          <Image
            src="/icon.png"
            alt=""
            width={54}
            height={54}
            priority
            className="h-[50px] w-[50px] shrink-0 rounded-[12px] sm:h-[54px] sm:w-[54px]"
          />

          <div className="min-w-0">
            <div className="whitespace-nowrap text-[23px] font-black leading-none tracking-tight text-white sm:text-[27px]">
              ReliefBridge
            </div>

            <div className="mt-1.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/65 sm:block">
              Disaster Recovery Coordination
            </div>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm border border-white/20 bg-white/[0.04] px-3 text-[13px] font-bold text-white hover:bg-white hover:text-navy hover:no-underline sm:px-4 sm:text-[13.5px]"
        >
          <ArrowLeftIcon />
          <span className="hidden sm:inline">Back to website</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>
    </header>
  );
}

function ProcessCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-md border border-white/10 bg-white/[0.045] p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-[13px] font-black text-navy">
        {step}
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-white">{title}</h3>

        <p className="mt-1 text-[13.5px] leading-6 text-white/70">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function RequestDemoPage() {
  const benefits = [
    "Coordinate survivor intake, consent, notes, and recovery cases",
    "Refer survivors securely across trusted partner organizations",
    "Track unmet needs, response times, and closed-loop outcomes",
    "Generate operational and funder-ready recovery reports",
  ];

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-surface-2">
      <BrandHeader />

      <main>
        <section className="relative isolate overflow-hidden bg-navy text-white">
          <div
            className="pointer-events-none absolute inset-0 z-0 rb-dotgrid opacity-50"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -right-40 -top-40 z-0 h-[420px] w-[420px] rounded-full border border-white/10"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -right-16 top-16 z-0 h-[280px] w-[280px] rounded-full border border-gold/20"
            aria-hidden="true"
          />

          <div className="relative z-10 mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-12 sm:px-6 sm:py-16 md:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(520px,1.12fr)] lg:gap-14 lg:py-20">
            <div className="relative z-10 min-w-0 lg:sticky lg:top-8 lg:self-start">
              <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-white/85">
                <ShieldIcon />
                Personalized platform walkthrough
              </div>

              <h1 className="mt-6 max-w-[12ch] text-[39px] font-black leading-[1.04] tracking-tight sm:text-[48px] md:text-[56px]">
                See how ReliefBridge can strengthen your
                <span className="block text-gold">
                  recovery operations.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[16px] leading-7 text-white/78 sm:text-[17px]">
                Request a tailored demonstration built around your
                organization&apos;s survivor services, partner network,
                referral workflow, reporting responsibilities, and recovery
                coordination challenges.
              </p>

              <div className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 text-[14.5px] leading-6 text-white/85"
                  >
                    <span className="mt-0.5 shrink-0 text-gold">
                      <CheckIcon />
                    </span>

                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 border-t border-white/10 pt-7">
                <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold">
                  What happens after you submit
                </div>

                <div className="mt-4 space-y-3">
                  <ProcessCard
                    step="1"
                    title="We review your organization"
                    description="Our team reviews your recovery mission, workflow, and primary areas of interest."
                  />

                  <ProcessCard
                    step="2"
                    title="We contact you directly"
                    description="A ReliefBridge representative follows up using your selected contact method."
                  />

                  <ProcessCard
                    step="3"
                    title="We tailor the demonstration"
                    description="Your walkthrough focuses on the capabilities most relevant to your organization."
                  />
                </div>
              </div>

              <div className="mt-8 rounded-md border border-white/10 bg-navy-dark/70 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 text-gold">
                    <ShieldIcon />
                  </span>

                  <div>
                    <div className="text-[13px] font-bold text-white">
                      Secure and private
                    </div>

                    <p className="mt-1 text-[12.5px] leading-5 text-white/65">
                      Demo-request information is used only to respond to your
                      inquiry and discuss ReliefBridge with your organization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-20 min-w-0">
              <DemoRequestForm />
            </div>
          </div>
        </section>

        <section className="relative z-10 border-t border-line bg-white">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 md:px-8 md:py-12">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.13em] text-blue">
                Built for recovery
              </div>

              <p className="mt-2 text-[14px] leading-6 text-ink-2">
                Designed for nonprofits, churches, LTRGs, VOAD partners,
                government agencies, and recovery case-management teams.
              </p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.13em] text-blue">
                Operationally focused
              </div>

              <p className="mt-2 text-[14px] leading-6 text-ink-2">
                Demonstrations focus on real coordination workflows rather than
                generic software features.
              </p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.13em] text-blue">
                A Westforge platform
              </div>

              <p className="mt-2 text-[14px] leading-6 text-ink-2">
                ReliefBridge is developed by Westforge Holdings to support
                stronger long-term disaster recovery coordination.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-navy-dark text-white">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-6 text-[12.5px] leading-5 text-white/65 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            © {new Date().getFullYear()} Westforge Holdings. ReliefBridge is a
            Westforge Holdings platform.
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/" className="hover:text-white">
              Home
            </Link>

            <Link href="/login" className="hover:text-white">
              Sign in
            </Link>

            <a
              href="mailto:reliefbridgeusa@gmail.com"
              className="hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}