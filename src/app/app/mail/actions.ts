"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
async function staff(){
 const p=await requireProfile();
 if(p.organization_id!==PLATFORM||!["owner","admin","manager","staff"].includes(String(p.role||"").toLowerCase())||p.access_status!=="active") throw new Error("Active ReliefBridge staff access required.");
 return {s:await createSupabaseServerClient(),p};
}
export async function saveDraft(fd:FormData){
 const {s,p}=await staff();
 const values={owner_id:p.id,recipient_id:String(fd.get("recipient_id")||"")||null,subject:String(fd.get("subject")||""),body:String(fd.get("body")||""),priority:String(fd.get("priority")||"normal"),acknowledgment_requested:fd.get("acknowledgment_requested")==="on",reply_to_message_id:String(fd.get("reply_to_message_id")||"")||null,updated_at:new Date().toISOString()},id=String(fd.get("draft_id")||"");
 const {error}=id?await s.from("staff_message_drafts").update(values).eq("id",id):await s.from("staff_message_drafts").insert(values);
 if(error)throw new Error(error.message);
 revalidatePath("/app/mail");redirect("/app/mail?folder=drafts&notice=draft");
}
export async function deleteDraft(fd:FormData){
 const {s}=await staff(),id=String(fd.get("draft_id")||"");
 if(id){const {error}=await s.from("staff_message_drafts").delete().eq("id",id);if(error)throw new Error(error.message)}
 revalidatePath("/app/mail");redirect("/app/mail?folder=drafts");
}
export async function messageAction(fd:FormData){
 const {s}=await staff(),action=String(fd.get("action")||""),id=String(fd.get("message_id")||"");
 const fn=action==="archive"?"archive_internal_message":action==="trash"?"trash_internal_message":action==="restore"?"restore_internal_message":action==="acknowledge"?"acknowledge_internal_message":"mark_internal_message_read";
 const {error}=await s.rpc(fn,{target_message:id});if(error)throw new Error(error.message);
 revalidatePath("/app/mail");redirect(action==="trash"?"/app/mail?folder=trash":action==="restore"?"/app/mail":action==="archive"?"/app/mail?folder=archive":"/app/mail?message="+id);
}
