"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isEmail } from "@/lib/utils";

export type QuoteState = { ok: boolean; message: string; errors?: Record<string,string> };
const packages = ["Recovery Starter","Recovery Growth","ReliefBridge Standard","Enterprise & Multi-agency"] as const;
const read = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";

export async function requestQuoteAction(_previous: QuoteState, form: FormData): Promise<QuoteState> {
  if (read(form,"website")) return {ok:true,message:"Thank you. Your inquiry has been received."};
  const first = read(form,"first_name"), last = read(form,"last_name");
  const email = read(form,"work_email").toLowerCase(), organization = read(form,"organization_name");
  const role = read(form,"role_title"), plan = read(form,"package");
  const staffRaw = read(form,"staff_count"), casesRaw = read(form,"active_cases");
  const staff = Number(staffRaw), cases = Number(casesRaw);
  const notes = read(form,"notes");
  const containsControl = (value: string) => /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
  const errors: Record<string,string> = {};
  if (!first || first.length > 80) errors.first_name = "Enter a first name (up to 80 characters).";
  if (!last || last.length > 80) errors.last_name = "Enter a last name (up to 80 characters).";
  if (!isEmail(email) || email.length > 254) errors.work_email = "Enter a valid work email.";
  if (organization.length < 2 || organization.length > 180) errors.organization_name = "Enter an organization name (2–180 characters).";
  if (role.length < 2 || role.length > 120) errors.role_title = "Enter your role or job title.";
  if (!packages.includes(plan as typeof packages[number])) errors.package = "Choose a package.";
  if (!/^\d+$/.test(staffRaw) || !Number.isSafeInteger(staff) || staff < 1 || staff > 100000) errors.staff_count = "Enter a valid staff count.";
  if (!/^\d+$/.test(casesRaw) || !Number.isSafeInteger(cases) || cases < 0 || cases > 10000000) errors.active_cases = "Enter a valid active case count.";
  if (notes.length > 1500) errors.notes = "Keep additional details under 1,500 characters.";
  for (const [key, value] of Object.entries({first_name:first,last_name:last,work_email:email,organization_name:organization,role_title:role,notes})) {
    if (containsControl(value)) errors[key] = "Remove unsupported control characters.";
  }
  if (Object.keys(errors).length) return {ok:false,message:"Please correct the highlighted fields.",errors};

  const message = ["QUOTE REQUEST", "Requested package: "+plan, "Organizational staff: "+staff, "Active cases: "+cases, "Notes: "+(notes || "None")].join("\n");
  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.from("demo_requests").insert({
    first_name:first,last_name:last,work_email:email,organization_name:organization,
    organization_type:"Other",role_title:role,preferred_contact:"Email",
    message,status:"New",source:"Website"
  });
  if (error) {
    // The database duplicate guard uses P0001. Do not expose database internals.
    if (error.code === "P0001" && error.message.includes("A recent quote request has already been received")) {
      return {ok:true,message:"We recently received a quote request from your organization. There is no need to submit it again right now. Our team will review it and respond by email."};
    }
    console.error("Quote request persistence failed",error);
    return {ok:false,message:"We could not save your request. Please try again."};
  }
  return {ok:true,message:"Your quote request has been saved. Our team will review your organization’s needs and follow up by email. No call is required."};
}
