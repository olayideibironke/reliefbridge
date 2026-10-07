"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const STAGES = ["Prospect","Contacted","Engaged","Qualified","Demo Requested","Demo Scheduled","Demo Completed","7-Day Evaluation Offered","Evaluation Active","Quote/Proposal","Decision","Won","Lost","Future Follow-Up"];
const PRIORITIES = ["Low","Medium","High","Critical"];
const TEMPERATURES = ["Cold","Warm","Hot"];
const ACTIVITY_TYPES = ["Email","Phone","Demo","Evaluation","Quote","Note","Follow-Up","Other"];
const read = (v: FormDataEntryValue | null) => typeof v === "string" ? v.trim() : "";

async function requireSalesManager() {
  const profile = await requireProfile();
  const role = typeof profile.role === "string" ? profile.role.trim().toLowerCase() : "";
  if (profile.organization_id !== PLATFORM_ORGANIZATION_ID || !(role === "owner" || role === "admin")) redirect("/app");
  return profile;
}

export async function updateSalesOpportunityAction(formData: FormData) {
  const profile = await requireSalesManager();
  const id = read(formData.get("opportunity_id"));
  const stage = read(formData.get("stage"));
  const priority = read(formData.get("priority"));
  const temperature = read(formData.get("temperature"));
  if (!id || !STAGES.includes(stage) || !PRIORITIES.includes(priority) || !TEMPERATURES.includes(temperature)) redirect("/app/platform/sales");

  const supabase = await createSupabaseServerClient();
  const { data: current, error: readError } = await supabase.from("sales_opportunities").select("stage").eq("id", id).maybeSingle();
  if (readError || !current) {
    console.error("Could not load sales opportunity", readError);
    redirect("/app/platform/sales?error=load");
  }

  const currentRecord = current as unknown as { stage?: unknown };
  const previousStage = typeof currentRecord.stage === "string" ? currentRecord.stage : null;
  const stageChanged = previousStage !== stage;
  const now = new Date().toISOString();
  const changes: { stage: string; priority: string; temperature: string; updated_by: string; updated_at: string; last_activity_at?: string } = {
    stage, priority, temperature, updated_by: profile.id, updated_at: now,
  };
  if (stageChanged) changes.last_activity_at = now;

  const { error } = await supabase.from("sales_opportunities").update(changes).eq("id", id);
  if (error) {
    console.error("Could not update sales opportunity", error);
    redirect("/app/platform/sales?error=update");
  }

  if (stageChanged && previousStage) {
    const { error: activityError } = await supabase.from("sales_activities").insert({
      opportunity_id: id,
      activity_type: "Stage Change",
      summary: `Stage changed from ${previousStage} to ${stage}`,
      created_by: profile.id,
      occurred_at: now,
    });
    if (activityError) {
      console.error("Opportunity updated but stage activity could not be recorded", activityError);
      redirect("/app/platform/sales?error=activity");
    }
  }

  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect("/app/platform/sales?saved=1");
}

export async function updateSalesPlanAction(formData: FormData) {
  const profile = await requireSalesManager();
  const id = read(formData.get("opportunity_id"));
  const next = read(formData.get("next_action"));
  const at = read(formData.get("next_action_at"));
  if (!id) redirect("/app/platform/sales");

  let nextActionAt: string | null = null;
  if (at) {
    const parsed = new Date(at);
    if (Number.isNaN(parsed.getTime())) redirect(`/app/platform/sales/${id}?error=date`);
    nextActionAt = parsed.toISOString();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sales_opportunities").update({
    next_action: next || null,
    next_action_at: nextActionAt,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) {
    console.error("Could not update sales plan", error);
    redirect(`/app/platform/sales/${id}?error=plan`);
  }

  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect(`/app/platform/sales/${id}?saved=1`);
}

export async function updateSalesCommercialAction(formData: FormData) {
  const profile = await requireSalesManager();
  const id = read(formData.get("opportunity_id"));
  if (!id) redirect("/app/platform/sales");

  const demoScheduled = read(formData.get("demo_scheduled_at"));
  const demoCompleted = read(formData.get("demo_completed_at"));
  const evaluationOffered = read(formData.get("evaluation_offered_at"));
  const evaluationStarts = read(formData.get("evaluation_starts_at"));
  const evaluationEnds = read(formData.get("evaluation_ends_at"));
  const quoteStatus = read(formData.get("quote_status"));
  const expectedValueRaw = read(formData.get("expected_value"));
  const outcomeReason = read(formData.get("outcome_reason"));
  const notes = read(formData.get("notes"));

  const parseDate = (value: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  };
  const dates = [demoScheduled, demoCompleted, evaluationOffered, evaluationStarts, evaluationEnds].map(parseDate);
  if (dates.some(v => v === undefined)) redirect(`/app/platform/sales/${id}?error=date`);

  let expectedValue: number | null = null;
  if (expectedValueRaw) {
    expectedValue = Number(expectedValueRaw);
    if (!Number.isFinite(expectedValue) || expectedValue < 0) redirect(`/app/platform/sales/${id}?error=value`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sales_opportunities").update({
    demo_scheduled_at: dates[0] ?? null,
    demo_completed_at: dates[1] ?? null,
    evaluation_offered_at: dates[2] ?? null,
    evaluation_starts_at: dates[3] ?? null,
    evaluation_ends_at: dates[4] ?? null,
    quote_status: quoteStatus || null,
    expected_value: expectedValue,
    outcome_reason: outcomeReason || null,
    notes: notes || null,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) {
    console.error("Could not update commercial sales details", error);
    redirect(`/app/platform/sales/${id}?error=commercial`);
  }

  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect(`/app/platform/sales/${id}?saved=1`);
}

export async function addSalesActivityAction(formData: FormData) {
  const profile = await requireSalesManager();
  const id = read(formData.get("opportunity_id"));
  const type = read(formData.get("activity_type"));
  const summary = read(formData.get("summary"));
  const details = read(formData.get("details"));
  if (!id || !ACTIVITY_TYPES.includes(type) || !summary) redirect("/app/platform/sales");

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error: activityError } = await supabase.from("sales_activities").insert({
    opportunity_id: id, activity_type: type, summary, details: details || null, created_by: profile.id, occurred_at: now,
  });
  if (activityError) {
    console.error("Could not add sales activity", activityError);
    redirect(`/app/platform/sales/${id}?error=activity`);
  }

  const { error: updateError } = await supabase.from("sales_opportunities").update({
    last_activity_at: now, updated_by: profile.id, updated_at: now,
  }).eq("id", id);
  if (updateError) {
    console.error("Activity recorded but opportunity timestamp could not be updated", updateError);
    redirect(`/app/platform/sales/${id}?error=timestamp`);
  }

  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect(`/app/platform/sales/${id}?saved=1`);
}
