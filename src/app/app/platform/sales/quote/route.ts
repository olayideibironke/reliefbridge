import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

export async function POST(request: Request) {
  const profile = await requireProfile();
  const role = String(profile.role ?? "").toLowerCase();
  if (profile.organization_id !== PLATFORM_ORGANIZATION_ID || !["owner", "admin"].includes(role)) redirect("/app");

  const formData = await request.formData();
  const id = String(formData.get("opportunity_id") ?? "").trim();
  const users = Number(formData.get("licensed_users"));
  const submittedMonthly = Number(formData.get("monthly_value"));
  if (!id || !Number.isInteger(users) || users < 1 || users > 500) redirect("/app/platform/sales?error=quote");

  const extraUsers = Math.max(0, users - 15);
  const monthly = 749 + extraUsers * 49;
  const annual = monthly * 12;
  if (submittedMonthly !== monthly) redirect(`/app/platform/sales/${id}?error=quote`);

  const summary = `ReliefBridge Complete quote for ${users} licensed organizational users: $749/month base includes up to 15 users; ${extraUsers} additional users × $49/month; total $${monthly.toLocaleString("en-US")}/month; annual contract value $${annual.toLocaleString("en-US")}.`;
  const now = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  const { error: updateError } = await supabase.from("sales_opportunities").update({
    quote_status: "Prepared",
    expected_value: monthly,
    updated_by: profile.id,
    updated_at: now,
    last_activity_at: now,
  }).eq("id", id).eq("is_test", false);
  if (updateError) {
    console.error("Could not save quote", updateError);
    redirect(`/app/platform/sales/${id}?error=quote`);
  }

  const { error: activityError } = await supabase.from("sales_activities").insert({
    opportunity_id: id,
    activity_type: "Quote",
    summary: `Quote prepared: $${monthly.toLocaleString("en-US")}/month for ${users} licensed users`,
    details: summary,
    created_by: profile.id,
    occurred_at: now,
  });
  if (activityError) console.error("Quote saved but activity could not be recorded", activityError);

  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect(`/app/platform/sales/${id}?saved=quote`);
}
