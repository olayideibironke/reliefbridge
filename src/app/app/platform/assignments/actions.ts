"use server";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export async function assignmentControl(formData:FormData){
 const p=await requireProfile();if(p.organization_id!==PLATFORM||!["owner","admin"].includes(String(p.role||"").toLowerCase()))throw new Error("ReliefBridge administrator access required.");
 const s=await createSupabaseServerClient();const action=String(formData.get("action")||"");
 if(action==="assign"){const [target_type,target_id]=String(formData.get("work_key")||"").split(":");if(!["recovery_case","survivor","unmet_need","referral"].includes(target_type)||!target_id)throw new Error("Choose a valid work item.");const {error}=await s.rpc("assign_staff_work",{target_staff:String(formData.get("staff_id")||""),target_type,target_id,assignment_notes:null});if(error)throw new Error(error.message)}
 else if(action==="unassign"){const {error}=await s.rpc("unassign_staff_work",{assignment_id:String(formData.get("assignment_id")||"")});if(error)throw new Error(error.message)}
 else throw new Error("Invalid assignment action.");
 revalidatePath("/app/platform/assignments");revalidatePath("/app");
}
