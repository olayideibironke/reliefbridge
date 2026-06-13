"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isEmail } from "@/lib/utils";
import { ORG_TYPES, US_STATES } from "@/lib/constants";
import type { OrgType } from "@/lib/types";
import type { FormState as AuthState } from "@/lib/forms";

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));
  const next = asString(formData.get("next")) || "/app";

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Required";
  else if (!isEmail(email)) fieldErrors.email = "Enter a valid email";
  if (!password) fieldErrors.password = "Required";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: error.message || "Sign in failed." };
  }

  revalidatePath("/app", "layout");
  redirect(next.startsWith("/") ? next : "/app");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const first_name = asString(formData.get("first_name"));
  const last_name = asString(formData.get("last_name"));
  const email = asString(formData.get("email"));
  const password = asString(formData.get("password"));
  const org_name = asString(formData.get("org_name"));
  const org_type = asString(formData.get("org_type"));
  const org_state = asString(formData.get("org_state"));
  const org_city = asString(formData.get("org_city"));

  const fieldErrors: Record<string, string> = {};
  if (!first_name) fieldErrors.first_name = "Required";
  if (!last_name) fieldErrors.last_name = "Required";
  if (!email) fieldErrors.email = "Required";
  else if (!isEmail(email)) fieldErrors.email = "Enter a valid email";
  if (!password) fieldErrors.password = "Required";
  else if (password.length < 8)
    fieldErrors.password = "Use at least 8 characters";
  if (!org_name) fieldErrors.org_name = "Required";
  if (!org_type) fieldErrors.org_type = "Required";
  else if (!ORG_TYPES.includes(org_type as OrgType))
    fieldErrors.org_type = "Pick from the list";
  if (org_state && !US_STATES.includes(org_state))
    fieldErrors.org_state = "Use a 2-letter state code";

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const origin = await siteOrigin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
      data: {
        first_name,
        last_name,
        org_name,
        org_type,
        org_state,
        org_city,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message || "Sign up failed." };
  }

  // If email confirmation is required, no session yet — surface a clear message.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Check your email to confirm your account. You can sign in once confirmed.",
    };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = asString(formData.get("email"));
  if (!email || !isEmail(email)) {
    return {
      ok: false,
      message: null,
      fieldErrors: { email: "Enter a valid email" },
    };
  }

  const origin = await siteOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message:
      "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = asString(formData.get("password"));
  const confirm = asString(formData.get("confirm"));

  const fieldErrors: Record<string, string> = {};
  if (!password) fieldErrors.password = "Required";
  else if (password.length < 8)
    fieldErrors.password = "Use at least 8 characters";
  if (password !== confirm) fieldErrors.confirm = "Passwords don't match";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/app", "layout");
  redirect("/app");
}
