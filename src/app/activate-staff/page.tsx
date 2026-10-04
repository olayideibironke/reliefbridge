import { activateStaff } from "./actions";

export const metadata = { title: "Activate staff account — ReliefBridge" };

const message=(e?:string)=>{
  if(!e) return "";
  if(e==="short") return "Password must be at least 12 characters.";
  if(e==="mismatch") return "Passwords do not match.";
  if(e==="invalid") return "This activation link is invalid.";
  try{return decodeURIComponent(e)}catch{return e}
};

export default async function ActivateStaffPage({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){
  const sp=await searchParams;
  const token=sp.token||"";
  return <main className="min-h-screen bg-[#f7f8fa] px-5 py-16">
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">ReliefBridge</div>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Activate your staff account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Create the password you will use with your ReliefBridge corporate login.</p>
      {sp.error&&<div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message(sp.error)}</div>}
      {!token?<div className="mt-6 text-sm text-slate-700">This activation link is incomplete. Ask your ReliefBridge administrator to resend activation.</div>:
      <form action={activateStaff} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token}/>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">New password</span><input name="password" type="password" minLength={12} required autoComplete="new-password" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-600"/></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-800">Confirm password</span><input name="confirm_password" type="password" minLength={12} required autoComplete="new-password" className="h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-slate-600"/></label>
        <button type="submit" className="h-11 w-full rounded-md bg-[#163a5f] px-4 font-semibold text-white hover:opacity-95">Activate account</button>
      </form>}
    </div>
  </main>
}
