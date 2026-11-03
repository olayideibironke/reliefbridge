"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestQuoteAction, type QuoteState } from "./actions";

const plans = ["Recovery Starter","Recovery Growth","ReliefBridge Standard","Enterprise & Multi-agency"];
const initial: QuoteState = {ok:false,message:""};
function Submit() {
  const {pending} = useFormStatus();
  return <button type="submit" disabled={pending} className="w-full rounded-md bg-navy px-6 py-4 font-bold text-white transition hover:bg-blue disabled:opacity-60">{pending ? "Submitting securely…" : "Request my written quote"}</button>;
}
export function QuoteForm({selected}: {selected?:string}) {
  const [state, action] = useActionState(requestQuoteAction,initial);
  if(state.ok) return <div role="status" className="rounded-xl border border-line bg-white p-8 text-navy shadow-card"><h2 className="text-2xl font-black">Request received</h2><p className="mt-4 leading-7">{state.message}</p></div>;
  const input="w-full rounded-md border border-line bg-white px-4 py-3 text-navy outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";
  return <form action={action} className="rounded-xl border border-line bg-white p-6 text-navy shadow-card sm:p-9">
    <h2 className="text-2xl font-black">Tell us about your organization</h2>
    <p className="mt-2 text-sm text-ink-2">A written quote, tailored to your team. No mandatory sales call.</p>
    {state.message && <p role="alert" className="mt-4 text-sm text-red-700">{state.message}</p>}
    <div className="absolute -left-[10000px]" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off"/></div>
    <div className="mt-7 grid gap-5 sm:grid-cols-2">
      {([["first_name","First name"],["last_name","Last name"],["work_email","Work email"],["organization_name","Organization"],["role_title","Your role"]] as const).map(([name,label])=><label key={name} className="block text-sm font-semibold">{label}<input name={name} required maxLength={name==="work_email"?254:name==="organization_name"?180:name==="role_title"?120:80} type={name==="work_email"?"email":"text"} autoComplete={name==="first_name"?"given-name":name==="last_name"?"family-name":name==="work_email"?"email":name==="organization_name"?"organization":"organization-title"} aria-invalid={Boolean(state.errors?.[name])} aria-describedby={state.errors?.[name]?name+"-error":undefined} className={input+" mt-2"}/>{state.errors?.[name] && <span id={name+"-error"} className="mt-1 block text-xs text-red-700">{state.errors[name]}</span>}</label>)}
      <label className="block text-sm font-semibold">Package of interest<select name="package" aria-invalid={Boolean(state.errors?.package)} aria-describedby={state.errors?.package?"package-error":undefined} defaultValue={plans.includes(selected||"")?selected:""} required className={input+" mt-2"}><option value="" disabled>Select a package</option>{plans.map(p=><option key={p} value={p}>{p}</option>)}</select>{state.errors?.package && <span id="package-error" className="text-xs text-red-700">{state.errors.package}</span>}</label>
      <label className="block text-sm font-semibold">Organizational staff<input name="staff_count" aria-invalid={Boolean(state.errors?.staff_count)} aria-describedby={state.errors?.staff_count?"staff_count-error":undefined} inputMode="numeric" type="number" min="1" max="100000" required className={input+" mt-2"}/>{state.errors?.staff_count && <span className="text-xs text-red-700">{state.errors.staff_count}</span>}</label>
      <label className="block text-sm font-semibold">Current active cases<input name="active_cases" aria-invalid={Boolean(state.errors?.active_cases)} aria-describedby={state.errors?.active_cases?"active_cases-error":undefined} inputMode="numeric" type="number" min="0" max="10000000" required className={input+" mt-2"}/>{state.errors?.active_cases && <span className="text-xs text-red-700">{state.errors.active_cases}</span>}</label>
    </div>
    <label className="mt-5 block text-sm font-semibold">Anything else we should know? (optional)<textarea name="notes" aria-invalid={Boolean(state.errors?.notes)} aria-describedby={state.errors?.notes?"notes-error":undefined} maxLength={1500} rows={4} className={input+" mt-2"}/>{state.errors?.notes && <span id="notes-error" className="text-xs text-red-700">{state.errors.notes}</span>}</label>
    <p className="my-5 text-xs leading-5 text-ink-2">We use this information to respond to your quote request. Please do not include survivor names or sensitive case details.</p>
    <Submit/>
  </form>;
}
