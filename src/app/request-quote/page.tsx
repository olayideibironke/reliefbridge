import type { Metadata } from "next";
import Link from "next/link";
import { QuoteForm } from "./QuoteForm";

export const metadata: Metadata = {
  title:"Request a ReliefBridge Quote",
  description:"Request a written ReliefBridge organizational quote based on your staff, active caseload, and preferred service package.",
  alternates:{canonical:"/request-quote"}
};
export default async function QuotePage({searchParams}:{searchParams:Promise<{plan?:string}>}) {
  const {plan} = await searchParams;
  return <main className="min-h-screen bg-surface-2">
    <header className="bg-navy-dark px-6 py-5 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="text-2xl font-black text-white hover:no-underline">ReliefBridge</Link><Link href="/pricing" className="text-sm font-semibold text-white/80 hover:text-white">View packages</Link></div></header>
    <section className="bg-navy px-6 py-14 text-white"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Organizational access</p><h1 className="mt-4 max-w-3xl text-4xl font-black sm:text-5xl">A clear quote for the work your team does.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Share your team size and active caseload. We will review the right package for your recovery program and follow up in writing.</p></div></section>
    <section className="mx-auto max-w-3xl px-5 py-12"><QuoteForm selected={plan}/></section>
  </main>;
}
