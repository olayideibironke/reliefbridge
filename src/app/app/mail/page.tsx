import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card,CardBody,CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { sendMessage,messageAction } from "./actions";
import { fullName,relativeDate } from "@/lib/format";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export default async function MailPage(){
 const p=await requireProfile();if(p.organization_id!==PLATFORM||!["owner","admin","manager","staff"].includes(String(p.role||"").toLowerCase()))redirect("/app");
 const s=await createSupabaseServerClient();
 const [{data:directory},{data:inbox},{data:sent}]=await Promise.all([
  s.from("profiles").select("id,first_name,last_name,email,role,title").eq("organization_id",PLATFORM).eq("access_status","active").neq("id",p.id).order("first_name"),
  s.from("staff_message_recipients").select("id,read_at,archived_at,created_at,message:staff_messages!staff_message_recipients_message_id_fkey(id,subject,body,sent_at,sender:profiles!staff_messages_sender_id_fkey(first_name,last_name,email,title))").eq("recipient_id",p.id).is("deleted_at",null).is("archived_at",null).order("created_at",{ascending:false}).limit(100),
  s.from("staff_messages").select("id,subject,body,sent_at,recipients:staff_message_recipients!staff_message_recipients_message_id_fkey(recipient:profiles!staff_message_recipients_recipient_id_fkey(first_name,last_name,email,title))").eq("sender_id",p.id).order("sent_at",{ascending:false}).limit(100)
 ]);
 return <><PageHeader eyebrow="Communication" title="Internal Mail" subtitle="Private staff-to-staff communication inside ReliefBridge. This is separate from survivor, partner, and public contact channels."/>
 <div className="space-y-6 px-6 py-8 md:px-10">
 <Card><CardHeader title="Compose internal message"/><CardBody><form action={sendMessage} className="space-y-3"><select name="recipient_id" required className="h-11 w-full rounded-sm border border-line bg-white px-3"><option value="">Select ReliefBridge staff recipient</option>{(directory??[]).map(x=><option key={x.id} value={x.id}>{fullName(x.first_name,x.last_name)} · {x.title||x.role}</option>)}</select><input name="subject" required maxLength={200} placeholder="Subject" className="h-11 w-full rounded-sm border border-line px-3"/><textarea name="body" required maxLength={20000} rows={5} placeholder="Write a private internal message…" className="w-full rounded-sm border border-line px-3 py-3"/><Button type="submit">Send internal message</Button></form></CardBody></Card>
 <div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader title="Inbox" subtitle="Messages sent directly to you."/><CardBody padded={false}>{!(inbox??[]).length?<div className="p-5 text-sm text-ink-2">Your inbox is empty.</div>:<div className="divide-y divide-line">{(inbox??[]).map((r:any)=>{const m=r.message;return <div key={r.id} className="p-5"><div className="flex justify-between gap-3"><div><div className="font-bold text-navy">{m?.subject}</div><div className="mt-1 text-[12px] text-ink-3">From {fullName(m?.sender?.first_name,m?.sender?.last_name)} · {relativeDate(m?.sent_at)}</div></div>{!r.read_at&&<span className="h-fit rounded-full bg-blue px-2 py-1 text-[10px] font-bold text-white">NEW</span>}</div><p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-6 text-ink-2">{m?.body}</p><div className="mt-3 flex gap-2">{!r.read_at&&<form action={messageAction}><input type="hidden" name="action" value="read"/><input type="hidden" name="message_id" value={m?.id}/><Button type="submit" variant="outline" size="sm">Mark read</Button></form>}<form action={messageAction}><input type="hidden" name="action" value="archive"/><input type="hidden" name="message_id" value={m?.id}/><Button type="submit" variant="outline" size="sm">Archive</Button></form></div></div>})}</div>}</CardBody></Card>
 <Card><CardHeader title="Sent" subtitle="Messages you have sent to ReliefBridge staff."/><CardBody padded={false}>{!(sent??[]).length?<div className="p-5 text-sm text-ink-2">No sent messages yet.</div>:<div className="divide-y divide-line">{(sent??[]).map((m:any)=><div key={m.id} className="p-5"><div className="font-bold text-navy">{m.subject}</div><div className="mt-1 text-[12px] text-ink-3">To {m.recipients?.map((x:any)=>fullName(x.recipient?.first_name,x.recipient?.last_name)).join(", ")||"Staff"} · {relativeDate(m.sent_at)}</div><p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-6 text-ink-2">{m.body}</p></div>)}</div>}</CardBody></Card></div>
 </div></>;
}
