import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export type PublicIntakePayload = {
  first_name: string;
  last_name: string;
  work_email: string;
  phone?: string | null;
  organization_name: string;
  organization_type: string;
  role_title: string;
  state?: string | null;
  organization_size?: string | null;
  recovery_focus?: string | null;
  preferred_contact: string;
  message?: string | null;
  status: "New";
  source: "Website";
};

export type IntakeResult =
  | { ok: true }
  | { ok: false; reason: "limited" | "duplicate" | "unavailable" };

/**
 * Public actions must validate every field before calling this privileged path.
 * The staged database trigger enforces shared, atomic limits across instances.
 * Never expose this client or the service-role credential to browser bundles.
 */
export async function persistPublicIntake(payload: PublicIntakePayload): Promise<IntakeResult> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("demo_requests").insert({
      first_name: payload.first_name,
      last_name: payload.last_name,
      work_email: payload.work_email,
      phone: payload.phone ?? null,
      organization_name: payload.organization_name,
      organization_type: payload.organization_type,
      role_title: payload.role_title,
      state: payload.state ?? null,
      organization_size: payload.organization_size ?? null,
      recovery_focus: payload.recovery_focus ?? null,
      preferred_contact: payload.preferred_contact,
      message: payload.message ?? null,
      status: "New",
      source: "Website",
    });
    if (!error) return { ok: true };
    if (error.code === "RB001") return { ok: false, reason: "duplicate" };
    if (error.code === "RB002") return { ok: false, reason: "limited" };
    console.error("Public intake persistence failed", error.code);
    return { ok: false, reason: "unavailable" };
  } catch {
    console.error("Public intake persistence unavailable");
    return { ok: false, reason: "unavailable" };
  }
}
