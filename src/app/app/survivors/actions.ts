"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { US_STATES, SURVIVOR_STATUSES } from "@/lib/constants";
import { isEmail } from "@/lib/utils";
import type { SurvivorStatus } from "@/lib/types";
import type { FormState } from "@/lib/forms";

function s(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}
function emptyToNull(v: string) {
  return v.length ? v : null;
}

export async function createSurvivorAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization before creating survivors." };
  }

  const first_name = s(formData.get("first_name"));
  const last_name = s(formData.get("last_name"));
  const phone = s(formData.get("phone"));
  const email = s(formData.get("email"));
  const disaster_event = s(formData.get("disaster_event"));
  const county = s(formData.get("county"));
  const state = s(formData.get("state")).toUpperCase();
  const status = s(formData.get("status")) || "active";
  const household_size_raw = s(formData.get("household_size"));
  const consent = formData.get("consent_given") === "on";
  const notes = s(formData.get("notes"));

  const fieldErrors: Record<string, string> = {};
  if (!first_name) fieldErrors.first_name = "Required";
  if (!last_name) fieldErrors.last_name = "Required";
  if (email && !isEmail(email)) fieldErrors.email = "Enter a valid email";
  if (state && !US_STATES.includes(state)) fieldErrors.state = "Use a 2-letter state code";
  if (!SURVIVOR_STATUSES.includes(status as SurvivorStatus))
    fieldErrors.status = "Invalid status";
  let household_size: number | null = null;
  if (household_size_raw) {
    const n = Number(household_size_raw);
    if (Number.isNaN(n) || n < 0 || n > 30) fieldErrors.household_size = "Enter a number between 0 and 30";
    else household_size = Math.round(n);
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("survivors")
    .insert({
      organization_id: profile.organization_id,
      first_name,
      last_name,
      phone: emptyToNull(phone),
      email: emptyToNull(email),
      disaster_event: emptyToNull(disaster_event),
      county: emptyToNull(county),
      state: emptyToNull(state),
      status: status as SurvivorStatus,
      household_size,
      notes: emptyToNull(notes),
      consent_given: consent,
      consent_given_at: consent ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not save survivor." };
  }

  revalidatePath("/app/survivors");
  revalidatePath("/app");
  redirect(`/app/survivors/${data.id}`);
}

export async function updateSurvivorAction(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }

  const status = s(formData.get("status"));
  const assigned_case_manager = s(formData.get("assigned_case_manager")) || null;
  const notes = s(formData.get("notes"));

  if (!SURVIVOR_STATUSES.includes(status as SurvivorStatus)) {
    return {
      ok: false,
      message: null,
      fieldErrors: { status: "Invalid status" },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("survivors")
    .update({
      status: status as SurvivorStatus,
      assigned_case_manager,
      notes: emptyToNull(notes),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/app/survivors/${id}`);
  revalidatePath("/app/survivors");
  return { ok: true, message: "Saved." };
}

export async function deleteSurvivorAction(id: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("survivors").delete().eq("id", id);
  revalidatePath("/app/survivors");
  redirect("/app/survivors");
}
