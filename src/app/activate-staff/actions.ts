"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function activateStaff(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!token) redirect("/activate-staff?error=invalid");
  if (password.length < 12) redirect(`/activate-staff?token=${encodeURIComponent(token)}&error=short`);
  if (password !== confirmPassword) redirect(`/activate-staff?token=${encodeURIComponent(token)}&error=mismatch`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.functions.invoke("staff-activate", {
    body: { token, password },
  });

  if (error || !data?.ok) {
    const message = encodeURIComponent(data?.error || "Activation failed. Please try again.");
    redirect(`/activate-staff?token=${encodeURIComponent(token)}&error=${message}`);
  }

  redirect("/login?staffActivated=1");
}
