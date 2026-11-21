import { isEmail } from "./utils";

export const QUOTE_PACKAGES = [
  "Recovery Starter",
  "Recovery Growth",
  "ReliefBridge Standard",
  "Enterprise & Multi-agency",
] as const;

const read = (form: FormData, key: string) =>
  typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";

export function validateQuoteForm(form: FormData) {
  const first = read(form, "first_name"), last = read(form, "last_name");
  const email = read(form, "work_email").toLowerCase();
  const organization = read(form, "organization_name");
  const role = read(form, "role_title"), plan = read(form, "package");
  const staffRaw = read(form, "staff_count"), casesRaw = read(form, "active_cases");
  const staff = Number(staffRaw), cases = Number(casesRaw);
  const notes = read(form, "notes");
  const containsControl = (value: string) =>
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
  const errors: Record<string, string> = {};

  if (!first || first.length > 80) errors.first_name = "Enter a first name (up to 80 characters).";
  if (!last || last.length > 80) errors.last_name = "Enter a last name (up to 80 characters).";
  if (!isEmail(email) || email.length > 254) errors.work_email = "Enter a valid work email.";
  if (organization.length < 2 || organization.length > 180) errors.organization_name = "Enter an organization name (2–180 characters).";
  if (role.length < 2 || role.length > 120) errors.role_title = "Enter your role or job title.";
  if (!QUOTE_PACKAGES.some(value => value === plan)) errors.package = "Choose a package.";
  if (!/^\d+$/.test(staffRaw) || !Number.isSafeInteger(staff) || staff < 1 || staff > 100000) errors.staff_count = "Enter a valid staff count.";
  if (!/^\d+$/.test(casesRaw) || !Number.isSafeInteger(cases) || cases < 0 || cases > 10000000) errors.active_cases = "Enter a valid active case count.";
  if (notes.length > 1500) errors.notes = "Keep additional details under 1,500 characters.";
  for (const [key, value] of Object.entries({first_name:first,last_name:last,work_email:email,organization_name:organization,role_title:role,notes})) {
    if (containsControl(value)) errors[key] = "Remove unsupported control characters.";
  }

  return {
    errors,
    payload: {
      first_name: first, last_name: last, work_email: email,
      organization_name: organization, organization_type: "Other",
      role_title: role, preferred_contact: "Email",
      message: [
        "QUOTE REQUEST", "Requested package: " + plan,
        "Organizational staff: " + staff, "Active cases: " + cases,
        "Notes: " + (notes || "None"),
      ].join("\n"),
      status: "New", source: "Website",
    },
  };
}
