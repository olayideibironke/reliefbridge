"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import {
  NEED_CATEGORIES,
  NEED_STATUSES,
  PRIORITIES,
} from "@/lib/constants";
import type { NeedCategory, NeedStatus, Priority } from "@/lib/types";
import type { FormState } from "@/lib/forms";

function s(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

export async function createNeedAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }
  const survivor_id = s(formData.get("survivor_id"));
  const category = s(formData.get("category")) as NeedCategory;
  const description = s(formData.get("description"));
  const priority = s(formData.get("priority")) as Priority;
  const status = (s(formData.get("status")) || "open") as NeedStatus;

  const fieldErrors: Record<string, string> = {};
  if (!survivor_id) fieldErrors.survivor_id = "Pick a survivor";
  if (!NEED_CATEGORIES.includes(category)) fieldErrors.category = "Pick a category";
  if (!description) fieldErrors.description = "Required";
  if (!PRIORITIES.includes(priority)) fieldErrors.priority = "Invalid priority";
  if (!NEED_STATUSES.includes(status)) fieldErrors.status = "Invalid status";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("unmet_needs").insert({
    organization_id: profile.organization_id,
    survivor_id,
    category,
    description,
    priority,
    status,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/app/unmet-needs");
  revalidatePath(`/app/survivors/${survivor_id}`);
  revalidatePath("/app");
  redirect("/app/unmet-needs");
}

export async function updateNeedStatusAction(
  id: string,
  next: NeedStatus
) {
  if (!NEED_STATUSES.includes(next)) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("unmet_needs").update({ status: next }).eq("id", id);
  revalidatePath("/app/unmet-needs");
}
