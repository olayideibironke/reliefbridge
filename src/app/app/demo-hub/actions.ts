"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export type DemoHubState = {
  ok: boolean;
  message: string | null;
  credentials?: { login_email?: string; password: string; expires_at?: string };
};

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

async function requirePlatformAdmin() {
  const profile = await requireProfile();
  const role = profile.role?.trim().toLowerCase() ?? "";
  if (profile.organization_id !== PLATFORM_ORGANIZATION_ID || !["owner", "admin"].includes(role)) {
    throw new Error("Platform administrator access is required.");
  }
}

async function invoke(body: Record<string, unknown>) {
  await requirePlatformAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Your session could not be verified. Sign in again and retry.");
  }
  const { data, error } = await supabase.functions.invoke("demo-admin", {
    body,
    headers: { Authorization: "Bearer " + accessToken },
  });
  if (error) throw new Error(error.message || "Demo administration failed.");
  if (data?.error) throw new Error(String(data.error));
  return data;
}

export async function createDemoAction(_previous: DemoHubState, formData: FormData): Promise<DemoHubState> {
  const organization_name = value(formData, "organization_name");
  const organization_type = value(formData, "organization_type") || "VOAD";
  const city = value(formData, "city");
  const state = value(formData, "state").toUpperCase();
  const contact_name = value(formData, "contact_name");
  const contact_email = value(formData, "contact_email");
  const duration_days = Number(value(formData, "duration_days") || "7");

  if (!organization_name || !/^[A-Z]{2}$/.test(state)) {
    return { ok: false, message: "Organization name and two-letter state are required." };
  }

  if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
    return { ok: false, message: "Enter a valid contact email." };
  }
  if (![1, 3, 7, 14, 30].includes(duration_days)) {
    return { ok: false, message: "Choose a valid demo duration." };
  }

  try {
    const data = await invoke({ action: "create", organization_name, organization_type, city, state, contact_name, contact_email, duration_days });
    revalidatePath("/app/demo-hub");
    return {
      ok: true,
      message: "Demo created. Copy the credentials now. The password is shown only once.",
      credentials: { login_email: data.login_email, password: data.password, expires_at: data.expires_at },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create demo." };
  }
}

export async function demoControlAction(formData: FormData) {
  const demo_id = value(formData, "demo_id");
  const action = value(formData, "action");
  if (!demo_id || !["set_duration", "disable", "reactivate", "archive"].includes(action)) return;
  const requestedDays = Number(value(formData, "duration_days") || "7");
  const duration_days = [1, 3, 7, 14, 30].includes(requestedDays) ? requestedDays : 7;
  await invoke({ action, demo_id, duration_days });
  revalidatePath("/app/demo-hub");
}


export async function resetDemoPasswordAction(
  _previous: DemoHubState,
  formData: FormData,
): Promise<DemoHubState> {
  const demo_id = value(formData, "demo_id");
  if (!demo_id) return { ok: false, message: "Demo is required." };
  try {
    const data = await invoke({ action: "reset_password", demo_id });
    return {
      ok: true,
      message: "Password reset. Copy the new password now. It is shown only once.",
      credentials: { password: data.password },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not reset password." };
  }
}
