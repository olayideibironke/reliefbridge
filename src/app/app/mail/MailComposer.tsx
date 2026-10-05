"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { saveDraft, deleteDraft } from "./actions";

type Person={id:string;name:string;detail:string};
type Draft={id:string;recipient_id:string|null;subject:string;body:string;priority?:string;acknowledgment_requested?:boolean;reply_to_message_id?:string|null}|null;
const MAX=25*1024*1024;
const ALLOWED=new Set(["application/pdf","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","text/plain","image/jpeg","image/png","image/webp"]);
function safeName(name:string){return name.replace(/[^\w.\-() ]+/g,"_").replace(/\s+/g," ").slice(0,180).trim()||"attachment"}

export function MailComposer({people,draft}:{people:Person[];draft:Draft}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState(""),[files,setFiles]=useState<File[]>([]);
 async function send(e:React.FormEvent<HTMLFormElement>){
  const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;
  if(submitter?.value==="draft"||submitter?.value==="delete")return;
  e.preventDefault();setError("");setBusy(true);
  const form=e.currentTarget,fd=new FormData(form),to=String(fd.get("recipient_id")||""),cc=String(fd.get("cc_id")||"")||null,bcc=String(fd.get("bcc_id")||"")||null,subject=String(fd.get("subject")||"").trim(),body=String(fd.get("body")||"").trim(),priority=String(fd.get("priority")||"normal"),ack=fd.get("acknowledgment_requested")==="on",replyTo=String(fd.get("reply_to_message_id")||"")||null;
  if(!to||!subject||!body){setError("Choose a recipient and enter both a subject and message.");setBusy(false);return}
  if(new Set([to,cc,bcc].filter(Boolean)).size!==[to,cc,bcc].filter(Boolean).length){setError("Each recipient can only be selected once.");setBusy(false);return}
  for(const f of files){if(f.size>MAX){setError(f.name+" exceeds the 25 MB attachment limit.");setBusy(false);return}if(!ALLOWED.has((f.type||"").toLowerCase())){setError(f.name+" is not an approved attachment type.");setBusy(false);return}}
  const s=createSupabaseBrowserClient(),{data:{user}}=await s.auth.getUser();if(!user){setError("Your session expired. Sign in again before sending.");setBusy(false);return}
  const messageId=crypto.randomUUID(),uploaded:{path:string;file:File}[]=[];
  try{
   for(const file of files){const path=`${user.id}/${messageId}/${crypto.randomUUID()}-${safeName(file.name)}`;const {error:up}=await s.storage.from("staff-mail-attachments").upload(path,file,{contentType:file.type,upsert:false});if(up)throw new Error("Could not attach "+file.name+": "+up.message);uploaded.push({path,file})}
   const {error:sendError}=await s.rpc("send_internal_message_multi",{target_message:messageId,target_to:to,target_cc:cc,target_bcc:bcc,message_subject:subject,message_body:body,target_priority:priority,target_acknowledgment:ack,target_reply_to:replyTo});if(sendError)throw new Error(sendError.message);
   if(uploaded.length){const rows=uploaded.map(x=>({message_id:messageId,uploaded_by:user.id,storage_path:x.path,file_name:safeName(x.file.name),mime_type:x.file.type,size_bytes:x.file.size}));const {error:rowError}=await s.from("staff_message_attachments").insert(rows);if(rowError){await s.storage.from("staff-mail-attachments").remove(uploaded.map(x=>x.path));throw new Error("Message was sent, but the attachment record could not be completed. "+rowError.message)}}
   if(draft?.id)await s.from("staff_message_drafts").delete().eq("id",draft.id);
   router.push("/app/mail?folder=sent&message="+messageId+"&notice=sent");router.refresh();
  }catch(err){if(uploaded.length)await s.storage.from("staff-mail-attachments").remove(uploaded.map(x=>x.path));setError(err instanceof Error?err.message:"Message could not be sent.");setBusy(false)}
 }
 return <form onSubmit={send} className="mx-auto max-w-2xl space-y-4">
  <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-navy">{draft?"Edit draft":"New message"}</h2><a href="/app/mail" className="font-semibold text-navy hover:no-underline">Close</a></div>
  {error?<div className="rounded-sm border border-red/30 bg-red/5 px-4 py-3 text-sm font-semibold text-red">{error}</div>:null}
  <div className="rounded-sm border border-line bg-surface p-4"><div className="mb-3 text-[12px] font-bold uppercase tracking-[.12em] text-navy">Recipients</div><div className="grid gap-3 md:grid-cols-[90px_1fr]">
   <div className="flex h-11 items-center font-bold text-navy">To</div><select name="recipient_id" defaultValue={draft?.recipient_id??""} required className="h-11 w-full rounded-sm border border-line bg-white px-3 text-navy"><option value="">Select ReliefBridge staff recipient</option>{people.map(x=><option key={x.id} value={x.id}>{x.name} · {x.detail}</option>)}</select>
   <div className="flex h-11 items-center font-bold text-navy">Cc</div><select name="cc_id" className="h-11 w-full rounded-sm border border-line bg-white px-3 text-navy"><option value="">Optional CC recipient</option>{people.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
   <div className="flex h-11 items-center font-bold text-navy">Bcc</div><select name="bcc_id" className="h-11 w-full rounded-sm border border-line bg-white px-3 text-navy"><option value="">Optional BCC recipient</option>{people.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
  </div></div>
  <input name="subject" defaultValue={draft?.subject??""} required maxLength={200} placeholder="Subject" className="h-11 w-full rounded-sm border border-line px-3 text-navy placeholder:text-ink-3"/>
  <div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-bold text-navy">Priority<select name="priority" defaultValue={draft?.priority??"normal"} className="mt-2 h-11 w-full rounded-sm border border-line bg-white px-3 font-normal text-navy"><option value="normal">Normal</option><option value="high">High priority</option></select></label><label className="flex items-center gap-3 rounded-sm border border-line px-4 py-3 text-sm font-bold text-navy"><input type="checkbox" name="acknowledgment_requested" defaultChecked={Boolean(draft?.acknowledgment_requested)}/> Require acknowledgment</label></div>{draft?.reply_to_message_id?<input type="hidden" name="reply_to_message_id" value={draft.reply_to_message_id}/>:null}<textarea name="body" defaultValue={draft?.body??""} required maxLength={20000} rows={10} placeholder="Write a private internal message…" className="w-full rounded-sm border border-line px-3 py-3 text-navy placeholder:text-ink-3"/>
  <div className="rounded-sm border border-line"><div className="flex items-center justify-between border-b border-line px-4 py-3"><div><div className="font-bold text-navy">Attachments</div><div className="text-[11px] text-ink-3">Excel, CSV, PDF, Word, TXT and approved images · 25 MB per file</div></div></div><div className="px-4 py-4"><input type="file" multiple accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" onChange={e=>setFiles(Array.from(e.target.files??[]))} className="block w-full text-sm text-ink-2 file:mr-4 file:rounded-sm file:border file:border-navy file:bg-white file:px-4 file:py-2 file:font-bold file:text-navy"/>{files.length?<div className="mt-3 space-y-2">{files.map((f,i)=><div key={i} className="flex items-center justify-between gap-3 rounded-sm border border-line px-3 py-2"><div className="min-w-0 truncate text-xs text-ink-2">{f.name} · {Math.max(1,Math.round(f.size/1024))} KB</div><button type="button" onClick={()=>setFiles(current=>current.filter((_,index)=>index!==i))} className="shrink-0 text-xs font-bold text-red">Remove</button></div>)}</div>:<div className="mt-2 text-xs text-ink-3">No files attached.</div>}</div></div>
  {draft?.id?<input type="hidden" name="draft_id" value={draft.id}/>:null}
  <div className="flex flex-wrap gap-2"><button name="intent" value="send" disabled={busy} className="rounded-sm bg-navy px-5 py-2.5 text-sm font-extrabold !text-white disabled:opacity-60">{busy?"Sending…":"Send message"}</button><button type="submit" name="intent" value="draft" formAction={saveDraft} formNoValidate disabled={busy} className="rounded-sm border border-navy bg-white px-5 py-2.5 text-sm font-bold text-navy hover:bg-surface">Save draft</button>{draft?<button type="submit" name="intent" value="delete" formAction={deleteDraft} formNoValidate disabled={busy} className="rounded-sm border border-line px-4 py-2.5 text-sm font-semibold text-red">Delete draft</button>:null}</div>
 </form>
}
