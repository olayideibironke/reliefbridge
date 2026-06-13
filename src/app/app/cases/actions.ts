"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import {
  CASE_STATUSES,
  PRIORITIES,
} from "@/lib/constants";
import type { CaseStatus, Priority } from "@/lib/types";
import type { FormState } from "@/lib/forms";

function s(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}
function emptyToNull(v: string) {
  return v.length ? v : null;
}

export async function createCaseAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }

  const survivor_id = s(formData.get("survivor_id"));
  const case_manager = s(formData.get("case_manager")) || null;
  const disaster_type = s(formData.get("disaster_type"));
  const priority = s(formData.get("priority")) as Priority;
  const status = s(formData.get("status")) as CaseStatus;
  const primary_need = s(formData.get("primary_need"));
  const notes = s(formData.get("notes"));

  const fieldErrors: Record<string, string> = {};
  if (!survivor_id) fieldErrors.survivor_id = "Pick a survivor";
  if (!PRIORITIES.includes(priority)) fieldErrors.priority = "Invalid priority";
  if (!CASE_STATUSES.includes(status)) fieldErrors.status = "Invalid status";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("recovery_cases")
    .insert({
      organization_id: profile.organization_id,
      survivor_id,
      case_manager,
      disaster_type: emptyToNull(disaster_type),
      priority,
      status,
      primary_need: emptyToNull(primary_need),
      notes: emptyToNull(notes),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not save case." };
  }

  revalidatePath("/app/cases");
  revalidatePath(`/app/survivors/${survivor_id}`);
  revalidatePath("/app");
  redirect(`/app/cases/${data.id}`);
}

export async function updateCaseAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }

  const case_manager = s(formData.get("case_manager")) || null;
  const priority = s(formData.get("priority")) as Priority;
  const status = s(formData.get("status")) as CaseStatus;
  const primary_need = s(formData.get("primary_need"));
  const notes = s(formData.get("notes"));

  const fieldErrors: Record<string, string> = {};
  if (!PRIORITIES.includes(priority)) fieldErrors.priority = "Invalid priority";
  if (!CASE_STATUSES.includes(status)) fieldErrors.status = "Invalid status";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("recovery_cases")
    .update({
      case_manager,
      priority,
      status,
      primary_need: emptyToNull(primary_need),
      notes: emptyToNull(notes),
      closed_at: status === "closed" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/app/cases/${id}`);
  revalidatePath("/app/cases");
  return { ok: true, message: "Saved." };
}

export async function addCaseNoteAction(
  caseId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }
  const body = s(formData.get("body"));
  if (!body) {
    return { ok: false, message: null, fieldErrors: { body: "Note is empty" } };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("case_notes").insert({
    organization_id: profile.organization_id,
    case_id: caseId,
    author_id: profile.id,
    body,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/app/cases/${caseId}`);
  return { ok: true, message: "Note added." };
}

export async function deleteCaseAction(id: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("recovery_cases").delete().eq("id", id);
  revalidatePath("/app/cases");
  redirect("/app/cases");
}
