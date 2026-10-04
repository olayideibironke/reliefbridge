"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
async function staff(){const p=await requireProfile();if(p.organization_id!==PLATFORM||!["owner","admin","manager","staff"].includes(String(p.role||"").toLowerCase())||p.access_status!=="active")throw new Error("Active ReliefBridge staff access required.");return createSupabaseServerClient()}
export async function sendMessage(fd:FormData){const s=await staff();const {error}=await s.rpc("send_internal_message",{target_recipient:String(fd.get("recipient_id")||""),message_subject:String(fd.get("subject")||""),message_body:String(fd.get("body")||"")});if(error)throw new Error(error.message);revalidatePath("/app/mail")}
export async function messageAction(fd:FormData){const s=await staff();const action=String(fd.get("action")||""),id=String(fd.get("message_id")||"");const fn=action==="archive"?"archive_internal_message":"mark_internal_message_read";const {error}=await s.rpc(fn,{target_message:id});if(error)throw new Error(error.message);revalidatePath("/app/mail")}
