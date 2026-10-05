"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
async function invoke(body:Record<string,unknown>){const p=await requireProfile();if(p.organization_id!==PLATFORM||!["owner","admin"].includes((p.role??"").toLowerCase()))throw new Error("Platform administrator access required.");const s=await createSupabaseServerClient();const {data}=await s.auth.getSession();if(!data.session)throw new Error("Sign in again.");const {data:r,error}=await s.functions.invoke("platform-admin",{body,headers:{Authorization:"Bearer "+data.session.access_token}});if(error)throw new Error(error.message);if(r?.error)throw new Error(r.error);return r}
export async function createStaff(formData:FormData){await invoke({action:"create_staff",first_name:String(formData.get("first_name")||""),last_name:String(formData.get("last_name")||""),personal_email:String(formData.get("personal_email")||""),title:String(formData.get("title")||""),department:String(formData.get("department")||""),role:String(formData.get("role")||"")});revalidatePath("/app/platform/staff")}
export async function staffControl(formData:FormData){await invoke({action:String(formData.get("action")||""),user_id:String(formData.get("user_id")||"")});revalidatePath("/app/platform/staff")}
