"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
const PLATFORM_ORGANIZATION_ID="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const STAGES=["Prospect","Contacted","Engaged","Qualified","Demo Requested","Demo Scheduled","Demo Completed","7-Day Evaluation Offered","Evaluation Active","Quote/Proposal","Decision","Won","Lost","Future Follow-Up"];
const PRIORITIES=["Low","Medium","High","Critical"], TEMPERATURES=["Cold","Warm","Hot"];
const read=(v:FormDataEntryValue|null)=>typeof v==="string"?v.trim():"";
export async function updateSalesOpportunityAction(formData:FormData){
 const profile=await requireProfile();const role=typeof profile.role==="string"?profile.role.trim().toLowerCase():"";
 if(profile.organization_id!==PLATFORM_ORGANIZATION_ID||!(role==="owner"||role==="admin"))redirect("/app");
 const id=read(formData.get("opportunity_id")),stage=read(formData.get("stage")),priority=read(formData.get("priority")),temperature=read(formData.get("temperature"));
 if(!id||!STAGES.includes(stage)||!PRIORITIES.includes(priority)||!TEMPERATURES.includes(temperature))redirect("/app/platform/sales");
 const supabase=await createSupabaseServerClient();
 const {data:current}=await supabase.from("sales_opportunities").select("stage,priority,temperature").eq("id",id).maybeSingle();
 const {error}=await supabase.from("sales_opportunities").update({stage,priority,temperature,updated_by:profile.id,last_activity_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",id);
 if(error){console.error("Could not update sales opportunity",error);redirect("/app/platform/sales");}
 if(current&&current.stage!==stage)await supabase.from("sales_activities").insert({opportunity_id:id,activity_type:"Stage Change",summary:`Stage changed from ${current.stage} to ${stage}`,created_by:profile.id});
 revalidatePath("/app/platform/sales");redirect("/app/platform/sales?saved=1");
}