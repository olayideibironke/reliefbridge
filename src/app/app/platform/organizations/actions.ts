"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export async function organizationControl(formData:FormData){const p=await requireProfile();if(p.organization_id!==PLATFORM||p.role!=="owner")throw new Error("Super Admin access required.");const s=await createSupabaseServerClient();const {data}=await s.auth.getSession();if(!data.session)throw new Error("Sign in again.");const {data:r,error}=await s.functions.invoke("platform-admin",{body:{action:String(formData.get("action")||""),organization_id:String(formData.get("organization_id")||"")},headers:{Authorization:"Bearer "+data.session.access_token}});if(error)throw new Error(error.message);if(r?.error)throw new Error(r.error);revalidatePath("/app/platform/organizations");revalidatePath("/app")}