"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import {
  NEED_CATEGORIES,
  REFERRAL_STATUSES,
} from "@/lib/constants";
import type { NeedCategory, ReferralStatus } from "@/lib/types";
import type { FormState } from "@/lib/forms";

function s(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

export async function createReferralAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }

  const survivor_id = s(formData.get("survivor_id"));
  const receiving_org = s(formData.get("receiving_org"));
  const category = s(formData.get("category")) as NeedCategory;
  const notes = s(formData.get("notes"));

  const fieldErrors: Record<string, string> = {};
  if (!survivor_id) fieldErrors.survivor_id = "Pick a survivor";
  if (!receiving_org) fieldErrors.receiving_org = "Pick a partner organization";
  else if (receiving_org === profile.organization_id)
    fieldErrors.receiving_org = "Can't refer to your own organization";
  if (!NEED_CATEGORIES.includes(category)) fieldErrors.category = "Pick a category";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("referrals")
    .insert({
      survivor_id,
      sending_org: profile.organization_id,
      receiving_org,
      category,
      status: "Pending",
      notes: notes || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not send referral." };
  }

  revalidatePath("/app/referrals");
  revalidatePath(`/app/survivors/${survivor_id}`);
  revalidatePath("/app");
  redirect(`/app/referrals/${data.id}`);
}

export async function updateReferralStatusAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const next = s(formData.get("status")) as ReferralStatus;
  if (!REFERRAL_STATUSES.includes(next)) {
    return { ok: false, message: "Invalid status." };
  }
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { status: next };
  if (next === "Accepted" || next === "Declined") {
    patch.responded_at = new Date().toISOString();
  }
  if (next === "Completed") {
    patch.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from("referrals").update(patch).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/app/referrals/${id}`);
  revalidatePath("/app/referrals");
  revalidatePath("/app");
  return { ok: true, message: `Marked ${next}.` };
}

export async function updateReferralNotesAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const notes = s(formData.get("notes"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("referrals")
    .update({ notes: notes || null })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/app/referrals/${id}`);
  return { ok: true, message: "Notes updated." };
}
