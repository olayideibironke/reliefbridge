"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { ORG_TYPES, US_STATES } from "@/lib/constants";
import type { OrgType } from "@/lib/types";
import { isEmail } from "@/lib/utils";
import type { FormState } from "@/lib/forms";

function s(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}
function emptyToNull(v: string) {
  return v.length ? v : null;
}

export async function updateOrgAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  if (!profile.organization_id) {
    return { ok: false, message: "Set up your organization first." };
  }

  const name = s(formData.get("name"));
  const type = s(formData.get("type")) as OrgType;
  const city = s(formData.get("city"));
  const state = s(formData.get("state")).toUpperCase();
  const website = s(formData.get("website"));
  const phone = s(formData.get("phone"));
  const email = s(formData.get("email"));
  const description = s(formData.get("description"));

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Required";
  if (!ORG_TYPES.includes(type)) fieldErrors.type = "Pick a valid type";
  if (state && !US_STATES.includes(state)) fieldErrors.state = "Use a 2-letter code";
  if (email && !isEmail(email)) fieldErrors.email = "Enter a valid email";
  if (website && !/^https?:\/\//.test(website))
    fieldErrors.website = "Include http(s)://";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      type,
      city: emptyToNull(city),
      state: emptyToNull(state),
      website: emptyToNull(website),
      phone: emptyToNull(phone),
      email: emptyToNull(email),
      description: emptyToNull(description),
    })
    .eq("id", profile.organization_id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/settings/organization");
  revalidatePath("/app", "layout");
  return { ok: true, message: "Organization profile saved." };
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  const first_name = s(formData.get("first_name"));
  const last_name = s(formData.get("last_name"));
  const title = s(formData.get("title"));
  const phone = s(formData.get("phone"));

  const fieldErrors: Record<string, string> = {};
  if (!first_name) fieldErrors.first_name = "Required";
  if (!last_name) fieldErrors.last_name = "Required";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name,
      last_name,
      title: emptyToNull(title),
      phone: emptyToNull(phone),
    })
    .eq("id", profile.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/settings/profile");
  revalidatePath("/app", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function updateNotificationsAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const profile = await requireProfile();
  const settings = {
    new_case: formData.get("new_case") === "on",
    new_referral: formData.get("new_referral") === "on",
    referral_status_change: formData.get("referral_status_change") === "on",
    weekly_digest: formData.get("weekly_digest") === "on",
  };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ notification_settings: settings })
    .eq("id", profile.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/app/settings/notifications");
  return { ok: true, message: "Notification settings saved." };
}
