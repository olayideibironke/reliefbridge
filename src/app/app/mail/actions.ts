"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const BUCKET="staff-mail-attachments";
const MAX_FILE_BYTES=25*1024*1024;
const ALLOWED=new Set(["application/pdf","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword","text/plain","image/jpeg","image/png","image/webp"]);

async function staff(){
 const p=await requireProfile();
 if(p.organization_id!==PLATFORM||!["owner","admin","manager","staff"].includes(String(p.role||"").toLowerCase())||p.access_status!=="active") throw new Error("Active ReliefBridge staff access required.");
 return {s:await createSupabaseServerClient(),p};
}
function recipients(fd:FormData){
 return [...new Set(["recipient_id","cc_id","bcc_id"].map(k=>String(fd.get(k)||"").trim()).filter(Boolean))];
}
function safeName(name:string){return name.replace(/[^\w.\-() ]+/g,"_").replace(/\s+/g," ").slice(0,180).trim()||"attachment";}
async function storeAttachments(s:any,p:any,messageId:string,fd:FormData){
 const files=fd.getAll("attachments").filter((x):x is File=>x instanceof File&&x.size>0);
 for(const file of files){
  if(file.size>MAX_FILE_BYTES) throw new Error(file.name+" exceeds the 25 MB attachment limit.");
  const mime=(file.type||"application/octet-stream").toLowerCase();
  if(!ALLOWED.has(mime)) throw new Error(file.name+" is not an approved attachment type.");
  const id=crypto.randomUUID(),name=safeName(file.name),path=`${p.id}/${messageId}/${id}-${name}`;
  const {error:uploadError}=await s.storage.from(BUCKET).upload(path,file,{contentType:mime,upsert:false});
  if(uploadError) throw new Error("Attachment upload failed: "+uploadError.message);
  const {error:rowError}=await s.from("staff_message_attachments").insert({id,message_id:messageId,uploaded_by:p.id,storage_path:path,file_name:name,mime_type:mime,size_bytes:file.size});
  if(rowError){await s.storage.from(BUCKET).remove([path]);throw new Error("Attachment record failed: "+rowError.message);}
 }
}
export async function sendMessage(fd:FormData){
 const {s,p}=await staff(),to=recipients(fd),subject=String(fd.get("subject")||"").trim(),body=String(fd.get("body")||"").trim();
 if(!to.length||!subject||!body) throw new Error("At least one recipient, a subject, and a message are required.");
 const sentIds:string[]=[];
 for(const recipient of to){
  const {data,error}=await s.rpc("send_internal_message",{target_recipient:recipient,message_subject:subject,message_body:body});
  if(error) throw new Error(error.message);
  const messageId=typeof data==="string"?data:Array.isArray(data)?String(data[0]?.id||data[0]||""):String(data?.id||data||"");
  if(messageId)sentIds.push(messageId); else {const {data:latest}=await s.from("staff_messages").select("id").eq("sender_id",p.id).eq("subject",subject).order("sent_at",{ascending:false}).limit(1).maybeSingle();if(latest?.id&&!sentIds.includes(latest.id))sentIds.push(latest.id);}
 }
 for(const messageId of sentIds)await storeAttachments(s,p,messageId,fd);
 const draft=String(fd.get("draft_id")||"");if(draft)await s.from("staff_message_drafts").delete().eq("id",draft);
 revalidatePath("/app/mail");redirect("/app/mail?folder=sent&notice=sent");
}
export async function saveDraft(fd:FormData){
 const {s,p}=await staff();const values={owner_id:p.id,recipient_id:String(fd.get("recipient_id")||"")||null,subject:String(fd.get("subject")||""),body:String(fd.get("body")||""),updated_at:new Date().toISOString()},id=String(fd.get("draft_id")||"");
 const {error}=id?await s.from("staff_message_drafts").update(values).eq("id",id):await s.from("staff_message_drafts").insert(values);if(error)throw new Error(error.message);
 revalidatePath("/app/mail");redirect("/app/mail?folder=drafts&notice=draft");
}
export async function deleteDraft(fd:FormData){const {s}=await staff();const id=String(fd.get("draft_id")||"");if(id)await s.from("staff_message_drafts").delete().eq("id",id);revalidatePath("/app/mail");redirect("/app/mail?folder=drafts")}
export async function messageAction(fd:FormData){const {s}=await staff(),action=String(fd.get("action")||""),id=String(fd.get("message_id")||"");const fn=action==="archive"?"archive_internal_message":action==="trash"?"trash_internal_message":action==="restore"?"restore_internal_message":"mark_internal_message_read";const {error}=await s.rpc(fn,{target_message:id});if(error)throw new Error(error.message);revalidatePath("/app/mail");redirect(action==="trash"?"/app/mail?folder=trash":action==="restore"?"/app/mail":action==="archive"?"/app/mail?folder=archive":"/app/mail?message="+id)}
