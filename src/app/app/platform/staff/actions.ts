"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
async function invoke(body:Record<string,unknown>){const p=await requireProfile();if(p.organization_id!==PLATFORM||!["owner","admin"].includes((p.role??"").toLowerCase()))throw new Error("Platform administrator access required.");const s=await createSupabaseServerClient();const {data}=await s.auth.getSession();if(!data.session)throw new Error("Sign in again.");const {data:r,error}=await s.functions.invoke("platform-admin",{body,headers:{Authorization:"Bearer "+data.session.access_token}});if(error)throw new Error(error.message);if(r?.error)throw new Error(r.error);return r}
export async function inviteAdmin(formData:FormData){await invoke({action:"invite",first_name:String(formData.get("first_name")||""),last_name:String(formData.get("last_name")||""),email:String(formData.get("email")||"")});revalidatePath("/app/platform/staff")}
export async function staffControl(formData:FormData){await invoke({action:String(formData.get("action")||""),user_id:String(formData.get("user_id")||"")});revalidatePath("/app/platform/staff")}
