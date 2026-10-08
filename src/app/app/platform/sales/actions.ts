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

function parseEasternDateTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const target = Date.parse(value + ":00Z");
  if (!Number.isFinite(target)) return null;
  const zone = "America/New_York";
  const partsFor = (ms: number) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ms));
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  };
  for (const offsetHours of [4, 5]) {
    const candidate = target + offsetHours * 3600000;
    if (partsFor(candidate) === value) return new Date(candidate).toISOString();
  }
  return null;
}

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
    const parsed = parseEasternDateTime(at);
    if (!parsed) redirect(`/app/platform/sales/${id}?error=date`);
    nextActionAt = parsed;
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
    const parsed = parseEasternDateTime(value);
    return parsed ?? undefined;
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

export async function completeSalesFollowUpAction(formData: FormData) {
  const profile = await requireSalesManager();
  const id = read(formData.get("opportunity_id"));
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/app/platform/sales/follow-ups?error=invalid");
  const supabase = await createSupabaseServerClient();
  const { data: current, error: readError } = await supabase.from("sales_opportunities")
    .select("id,organization_name,next_action,next_action_at,is_test").eq("id", id).eq("is_test", false).maybeSingle();
  if (readError || !current || !current.next_action_at) redirect("/app/platform/sales/follow-ups?error=missing");
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase.from("sales_opportunities")
    .update({ next_action_at: null, next_action: null, last_activity_at: now, updated_by: profile.id, updated_at: now })
    .eq("id", id).eq("next_action_at", current.next_action_at).select("id").maybeSingle();
  if (updateError || !updated) redirect("/app/platform/sales/follow-ups?error=update");
  const { error: activityError } = await supabase.from("sales_activities").insert({
    opportunity_id: id, activity_type: "Follow-Up", summary: "Follow-up completed",
    details: JSON.stringify({ action: current.next_action || "Follow up", scheduled_at: current.next_action_at }),
    created_by: profile.id, occurred_at: now,
  });
  if (activityError) {
    console.error("Follow-up completion audit insert failed", activityError);
    const { error: rollbackError } = await supabase.from("sales_opportunities").update({
      next_action: current.next_action, next_action_at: current.next_action_at, updated_by: profile.id, updated_at: new Date().toISOString(),
    }).eq("id", id).is("next_action_at", null);
    if (rollbackError) console.error("Follow-up completion rollback failed", rollbackError);
    redirect("/app/platform/sales/follow-ups?error=activity");
  }
  revalidatePath("/app/platform/sales/follow-ups");
  revalidatePath("/app/platform/sales");
  revalidatePath(`/app/platform/sales/${id}`);
  redirect("/app/platform/sales/follow-ups?view=completed&saved=1");
}
