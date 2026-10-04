import type { Metadata } from "next";
import { ActivateStaffForm } from "./ActivateStaffForm";

export const metadata: Metadata = { title: "Activate staff account — ReliefBridge" };

export default async function ActivateStaffPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <div><div className="mb-8"><div className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-blue">Staff activation</div><h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-navy">Activate your ReliefBridge account.</h1><p className="mt-2 text-[14.5px] leading-6 text-ink-2">Create the password you will use with your ReliefBridge corporate login.</p></div><ActivateStaffForm token={token}/></div>;
}
