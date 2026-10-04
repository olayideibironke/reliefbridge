import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fullName, relativeDate } from "@/lib/format";
import { sendMessage, messageAction } from "./actions";

const PLATFORM = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

type ProfileLite = { id: string; first_name: string | null; last_name: string | null; email: string | null; role?: string | null; title: string | null };
type MessageRow = { id: string; sender_id: string; subject: string; body: string; sent_at: string };
type RecipientRow = { id: string; message_id: string; recipient_id: string; read_at: string | null; archived_at: string | null; created_at: string };

export default async function MailPage() {
  const p = await requireProfile();
  const role = String(p.role ?? "").toLowerCase();
  if (p.organization_id !== PLATFORM || !["owner", "admin", "manager", "staff"].includes(role)) redirect("/app");

  const s = await createSupabaseServerClient();
  const [{ data: directoryData }, { data: recipientData }, { data: sentData }] = await Promise.all([
    s.from("profiles").select("id,first_name,last_name,email,role,title").eq("organization_id", PLATFORM).eq("access_status", "active").neq("id", p.id).order("first_name"),
    s.from("staff_message_recipients").select("id,message_id,recipient_id,read_at,archived_at,created_at").eq("recipient_id", p.id).is("deleted_at", null).is("archived_at", null).limit(100),
    s.from("staff_messages").select("id,sender_id,subject,body,sent_at").eq("sender_id", p.id).order("sent_at", { ascending: false }).limit(100),
  ]);

  const directory = (directoryData ?? []) as ProfileLite[];
  const recipientRows = (recipientData ?? []) as RecipientRow[];
  const sentRows = (sentData ?? []) as MessageRow[];

  const inboxMessageIds = recipientRows.map((r) => r.message_id);
  const { data: inboxMessageData } = inboxMessageIds.length
    ? await s.from("staff_messages").select("id,sender_id,subject,body,sent_at").in("id", inboxMessageIds)
    : { data: [] as MessageRow[] };
  const inboxMessages = (inboxMessageData ?? []) as MessageRow[];

  const senderIds = [...new Set(inboxMessages.map((m) => m.sender_id))];
  const { data: senderData } = senderIds.length
    ? await s.from("profiles").select("id,first_name,last_name,email,title").in("id", senderIds)
    : { data: [] as ProfileLite[] };
  const senderMap = new Map(((senderData ?? []) as ProfileLite[]).map((x) => [x.id, x]));
  const messageMap = new Map(inboxMessages.map((m) => [m.id, m]));
  const inbox = recipientRows
    .map((r) => ({ ...r, message: messageMap.get(r.message_id), sender: messageMap.get(r.message_id) ? senderMap.get(messageMap.get(r.message_id)!.sender_id) : undefined }))
    .sort((a, b) => (b.message?.sent_at ?? "").localeCompare(a.message?.sent_at ?? ""));

  const sentIds = sentRows.map((m) => m.id);
  const { data: sentRecipientData } = sentIds.length
    ? await s.from("staff_message_recipients").select("message_id,recipient_id").in("message_id", sentIds)
    : { data: [] as { message_id: string; recipient_id: string }[] };
  const sentRecipients = (sentRecipientData ?? []) as { message_id: string; recipient_id: string }[];
  const recipientIds = [...new Set(sentRecipients.map((r) => r.recipient_id))];
  const { data: recipientProfileData } = recipientIds.length
    ? await s.from("profiles").select("id,first_name,last_name,email,title").in("id", recipientIds)
    : { data: [] as ProfileLite[] };
  const recipientMap = new Map(((recipientProfileData ?? []) as ProfileLite[]).map((x) => [x.id, x]));

  return (
    <>
      <PageHeader eyebrow="Communication" title="Internal Mail" subtitle="Private staff-to-staff communication inside ReliefBridge. This is separate from survivor, partner, and public contact channels." />
      <div className="space-y-6 px-6 py-8 md:px-10">
        <Card>
          <CardHeader title="Compose internal message" />
          <CardBody>
            <form action={sendMessage} className="space-y-3">
              <select name="recipient_id" required className="h-11 w-full rounded-sm border border-line bg-white px-3">
                <option value="">Select ReliefBridge staff recipient</option>
                {directory.map((x) => <option key={x.id} value={x.id}>{fullName(x.first_name, x.last_name)} · {x.title || x.role}</option>)}
              </select>
              <input name="subject" required maxLength={200} placeholder="Subject" className="h-11 w-full rounded-sm border border-line px-3" />
              <textarea name="body" required maxLength={20000} rows={5} placeholder="Write a private internal message…" className="w-full rounded-sm border border-line px-3 py-3" />
              <Button type="submit">Send internal message</Button>
            </form>
          </CardBody>
        </Card>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader title="Inbox" subtitle="Messages sent directly to you." />
            <CardBody padded={false}>
              {!inbox.length ? <div className="p-5 text-sm text-ink-2">Your inbox is empty.</div> : <div className="divide-y divide-line">
                {inbox.map((r) => <div key={r.id} className="p-5">
                  <div className="flex justify-between gap-3"><div><div className="font-bold text-navy">{r.message?.subject}</div><div className="mt-1 text-[12px] text-ink-3">From {fullName(r.sender?.first_name, r.sender?.last_name)} · {relativeDate(r.message?.sent_at)}</div></div>{!r.read_at && <span className="h-fit rounded-full bg-blue px-2 py-1 text-[10px] font-bold text-white">NEW</span>}</div>
                  <p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-6 text-ink-2">{r.message?.body}</p>
                  <div className="mt-3 flex gap-2">
                    {!r.read_at && <form action={messageAction}><input type="hidden" name="action" value="read" /><input type="hidden" name="message_id" value={r.message?.id} /><Button type="submit" variant="outline" size="sm">Mark read</Button></form>}
                    <form action={messageAction}><input type="hidden" name="action" value="archive" /><input type="hidden" name="message_id" value={r.message?.id} /><Button type="submit" variant="outline" size="sm">Archive</Button></form>
                  </div>
                </div>)}
              </div>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Sent" subtitle="Messages you have sent to ReliefBridge staff." />
            <CardBody padded={false}>
              {!sentRows.length ? <div className="p-5 text-sm text-ink-2">No sent messages yet.</div> : <div className="divide-y divide-line">
                {sentRows.map((m) => {
                  const names = sentRecipients.filter((r) => r.message_id === m.id).map((r) => recipientMap.get(r.recipient_id)).filter(Boolean).map((x) => fullName(x?.first_name, x?.last_name)).join(", ");
                  return <div key={m.id} className="p-5"><div className="font-bold text-navy">{m.subject}</div><div className="mt-1 text-[12px] text-ink-3">To {names || "Staff"} · {relativeDate(m.sent_at)}</div><p className="mt-3 whitespace-pre-wrap text-[13.5px] leading-6 text-ink-2">{m.body}</p></div>;
                })}
              </div>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
