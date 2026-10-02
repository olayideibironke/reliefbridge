"use client";

import { useActionState } from "react";
import { createDemoAction, type DemoHubState } from "./actions";
import { Button } from "@/components/ui/Button";

const initialState: DemoHubState = { ok: false, message: null };
const inputClass = "mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-[14px] text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/10";

export function CreateDemoForm() {
  const [state, action, pending] = useActionState(createDemoAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-[12.5px] font-semibold text-ink-2">Organization name
          <input name="organization_name" required className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Organization type
          <select name="organization_type" defaultValue="VOAD" className={inputClass}>
            <option value="VOAD">VOAD</option><option value="COAD">COAD</option><option>Long-Term Recovery Group</option><option>Nonprofit</option><option>Faith-Based Organization</option><option>Government Agency</option><option>Other</option>
          </select>
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">State
          <input name="state" required maxLength={2} className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">City
          <input name="city" className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Client contact
          <input name="contact_name" className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Contact email
          <input name="contact_email" type="email" className={inputClass} />
        </label>
        <label className="text-[12.5px] font-semibold text-ink-2">Access duration
          <select name="duration_days" defaultValue="7" className={inputClass}>
            <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
          </select>
        </label>
      </div>
      {state.message && <div className={`rounded-sm border px-4 py-3 text-[13px] ${state.ok ? "border-green/20 bg-green/10 text-green" : "border-red/20 bg-red/5 text-red"}`}>{state.message}</div>}
      {state.credentials && (
        <div className="rounded-md border border-blue/20 bg-blue-soft p-5">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-blue">Access details</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div><div className="text-[11px] font-bold text-ink-3">LOGIN</div><div className="mt-1 break-all text-[13px] font-semibold text-navy">{state.credentials.login_email}</div></div>
            <div><div className="text-[11px] font-bold text-ink-3">TEMPORARY PASSWORD</div><div className="mt-1 break-all font-mono text-[13px] font-bold text-navy">{state.credentials.password}</div></div>
            <div><div className="text-[11px] font-bold text-ink-3">EXPIRES</div><div className="mt-1 text-[13px] font-semibold text-navy">{new Date(state.credentials.expires_at).toLocaleString()}</div></div>
          </div>
          <p className="mt-3 text-[12px] text-ink-3">The password is not stored in the Demo Hub. Copy it before leaving this page.</p>
          <button type="button" onClick={() => navigator.clipboard.writeText(`ReliefBridge demo access\nLogin: ${state.credentials?.login_email ?? ""}\nPassword: ${state.credentials?.password ?? ""}\nExpires: ${state.credentials?.expires_at ? new Date(state.credentials.expires_at).toLocaleString() : ""}\nSign in: https://reliefbridge.net/login`)} className="mt-4 inline-flex h-9 items-center rounded-sm border border-blue/20 bg-white px-3 text-[12.5px] font-bold text-blue hover:border-blue">Copy access details</button>
        </div>
      )}
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Creating demo..." : "Create demo"}</Button>
    </form>
  );
}
