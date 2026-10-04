"use client";
import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function ActivateStaffForm({token}:{token:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[corporate,setCorporate]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setError("");
    const fd=new FormData(e.currentTarget),password=String(fd.get("password")||""),confirm=String(fd.get("confirm")||"");
    if(!token){setError("This activation link is invalid.");return}
    if(password!==confirm){setError("The passwords do not match.");return}
    setBusy(true);
    const s=createSupabaseBrowserClient();
    const {data,error:invokeError}=await s.functions.invoke("activate-staff",{body:{token,password}});
    setBusy(false);
    if(invokeError||data?.error){setError(data?.error||invokeError?.message||"Activation failed.");return}
    setCorporate(String(data?.corporate_email||""));
  }
  if(corporate)return <div className="space-y-5"><Alert tone="success" title="Account activated">Your staff account is active. Sign in with your corporate ReliefBridge email: <strong>{corporate}</strong>.</Alert><Link href="/login" className="inline-flex font-bold text-blue hover:text-navy hover:no-underline">Continue to sign in →</Link></div>;
  return <form onSubmit={submit} className="space-y-5">{error&&<Alert tone="error">{error}</Alert>}<Input label="New password" name="password" type="password" required autoComplete="new-password" hint="At least 12 characters with uppercase, lowercase, and a number."/><Input label="Confirm password" name="confirm" type="password" required autoComplete="new-password"/><Button type="submit" className="w-full" disabled={busy}>{busy?"Activating…":"Activate staff account"}</Button></form>;
}
