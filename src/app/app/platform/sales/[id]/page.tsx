import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { addSalesActivityAction, updateSalesCommercialAction, updateSalesPlanAction } from "../actions";
import { QuoteCalculator } from "./QuoteCalculator";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales Opportunity — ReliefBridge" };
const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

type OpportunityDetail = {
  id:string; organization_name:string; contact_first_name:string|null; contact_last_name:string|null; contact_email:string; contact_phone:string|null; role_title:string|null;
  organization_type:string|null; state:string|null; organization_size:string|null; preferred_contact:string|null; stage:string; priority:string; temperature:string; source:string;
  recovery_focus:string|null; last_activity_at:string; next_action:string|null; next_action_at:string|null; demo_scheduled_at:string|null; demo_completed_at:string|null;
  evaluation_offered_at:string|null; evaluation_starts_at:string|null; evaluation_ends_at:string|null; quote_status:string|null; expected_value:number|null; notes:string|null; outcome_reason:string|null;
};
function fmt(v:string|null) { if(!v)return "Not recorded"; const d=new Date(v); return Number.isNaN(d.getTime())?"Not recorded":new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short"}).format(d); }
function datetimeLocal(v:string|null) { if(!v)return ""; const d=new Date(v); if(Number.isNaN(d.getTime()))return ""; const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(d); const get=(type:string)=>parts.find(p=>p.type===type)?.value??""; return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`; }

export default async function OpportunityPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string;error?:string}>}) {
  const profile=await requireProfile();
  const role=typeof profile.role==="string"?profile.role.trim().toLowerCase():"";
  if(profile.organization_id!==PLATFORM_ORGANIZATION_ID||!(role==="owner"||role==="admin"))redirect("/app");

  const {id}=await params;
  const sp=await searchParams;
  const supabase=await createSupabaseServerClient();
  const [{data:o,error:oError},{data:a,error:aError}]=await Promise.all([
    supabase.from("sales_opportunities").select("*").eq("id",id).eq("is_test",false).maybeSingle(),
    supabase.from("sales_activities").select("id,activity_type,summary,details,occurred_at").eq("opportunity_id",id).order("occurred_at",{ascending:false}).limit(100),
  ]);
  if(oError){console.error("Could not load sales opportunity",oError);notFound();}
  if(!o)notFound();
  if(aError)console.error("Could not load sales activity timeline",aError);

  const opportunity=(o as unknown) as OpportunityDetail;
  const activities=((a??[]) as unknown) as Array<{id:string;activity_type:string;summary:string;details:string|null;occurred_at:string}>;
  const name=[opportunity.contact_first_name,opportunity.contact_last_name].filter(Boolean).join(" ");

  return <><PageHeader eyebrow="ReliefBridge Management" title={opportunity.organization_name} subtitle={`${name||"Contact"}${opportunity.role_title?" · "+opportunity.role_title:""} · ${opportunity.stage}`} breadcrumbs={[{label:"Sales Pipeline",href:"/app/platform/sales"},{label:opportunity.organization_name}]} actions={<Link href="/app/platform/sales" className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-4 text-[13px] font-bold text-navy hover:no-underline">Back to pipeline</Link>}/>
  <div className="space-y-6 px-6 py-8 md:px-10">
    {sp.saved==="1"&&<div className="rounded-md border border-green/25 bg-green/10 px-5 py-4 text-[13px] font-semibold text-green">Opportunity updated.</div>}
    {sp.error&&<div className="rounded-md border border-red/25 bg-red/5 px-5 py-4 text-[13px] font-semibold text-red">The requested sales update could not be completed. Please try again.</div>}

    <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
      <div className="space-y-6">
        <Card><CardHeader title="Opportunity profile" subtitle="Internal commercial view of this prospective ReliefBridge organization."/><CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div><b className="text-navy">Contact</b><div className="mt-1 text-sm text-ink-2">{name||"Not recorded"}</div></div>
          <div><b className="text-navy">Email</b><a className="mt-1 block text-sm text-blue" href={"mailto:"+opportunity.contact_email}>{opportunity.contact_email}</a></div>
          <div><b className="text-navy">Phone</b><div className="mt-1 text-sm text-ink-2">{opportunity.contact_phone||"Not recorded"}</div></div>
          <div><b className="text-navy">Organization type</b><div className="mt-1 text-sm text-ink-2">{opportunity.organization_type||"Not recorded"}</div></div>
          <div><b className="text-navy">Organization size</b><div className="mt-1 text-sm text-ink-2">{opportunity.organization_size||"Not recorded"}</div></div>
          <div><b className="text-navy">State</b><div className="mt-1 text-sm text-ink-2">{opportunity.state||"Not recorded"}</div></div>
          <div><b className="text-navy">Source</b><div className="mt-1 text-sm text-ink-2">{opportunity.source}</div></div>
          <div><b className="text-navy">Preferred contact</b><div className="mt-1 text-sm text-ink-2">{opportunity.preferred_contact||"Not recorded"}</div></div>
          <div><b className="text-navy">Last activity</b><div className="mt-1 text-sm text-ink-2">{fmt(opportunity.last_activity_at)}</div></div>
          <div className="sm:col-span-2 lg:col-span-3"><b className="text-navy">Recovery focus</b><div className="mt-1 text-sm text-ink-2">{opportunity.recovery_focus||"Not recorded"}</div></div>
        </CardBody></Card>

        <Card><CardHeader title="Commercial lifecycle" subtitle="Demo, evaluation, quote, expected production value, and final outcome."/><CardBody>
          <form action={updateSalesCommercialAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="opportunity_id" value={id}/>
            <label className="text-[12.5px] font-bold text-navy">Demo scheduled<input type="datetime-local" name="demo_scheduled_at" defaultValue={datetimeLocal(opportunity.demo_scheduled_at)} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Demo completed<input type="datetime-local" name="demo_completed_at" defaultValue={datetimeLocal(opportunity.demo_completed_at)} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Evaluation offered<input type="datetime-local" name="evaluation_offered_at" defaultValue={datetimeLocal(opportunity.evaluation_offered_at)} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Evaluation starts<input type="datetime-local" name="evaluation_starts_at" defaultValue={datetimeLocal(opportunity.evaluation_starts_at)} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Evaluation ends<input type="datetime-local" name="evaluation_ends_at" defaultValue={datetimeLocal(opportunity.evaluation_ends_at)} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Quote status<input name="quote_status" defaultValue={opportunity.quote_status??""} maxLength={100} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Expected production value ($)<input type="number" min="0" step="0.01" name="expected_value" defaultValue={opportunity.expected_value??""} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="text-[12.5px] font-bold text-navy">Outcome / decision reason<input name="outcome_reason" defaultValue={opportunity.outcome_reason??""} maxLength={1000} className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm"/></label>
            <label className="md:col-span-2 text-[12.5px] font-bold text-navy">Internal notes<textarea name="notes" defaultValue={opportunity.notes??""} maxLength={5000} rows={5} className="mt-2 w-full rounded-sm border border-line px-3 py-3 text-sm"/></label>
            <button className="h-11 rounded-sm bg-navy px-4 text-sm font-bold text-white md:col-span-2">Save commercial details</button>
          </form>
        </CardBody></Card>

        <Card><CardHeader title="Activity timeline" subtitle="Chronological sales history for this opportunity."/><CardBody>{activities.length===0?<div className="text-sm text-ink-3">No activity recorded yet.</div>:<div className="space-y-4">{activities.map(x=><div key={x.id} className="border-l-2 border-blue/20 pl-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-surface-2 px-2 py-1 text-[10.5px] font-bold text-navy">{x.activity_type}</span><span className="text-[11.5px] text-ink-3">{fmt(x.occurred_at)}</span></div><div className="mt-2 text-[13.5px] font-semibold text-ink">{x.summary}</div>{x.details&&<div className="mt-1 whitespace-pre-wrap text-[12.5px] leading-5 text-ink-2">{x.details}</div>}</div>)}</div>}</CardBody></Card>
      </div>

      <aside className="space-y-6">
        <Card><CardHeader title="Pipeline status" subtitle="Current internal qualification state."/><CardBody className="space-y-3"><div><b className="text-navy">Stage</b><div className="mt-1 text-sm text-ink-2">{opportunity.stage}</div></div><div><b className="text-navy">Priority</b><div className="mt-1 text-sm text-ink-2">{opportunity.priority}</div></div><div><b className="text-navy">Temperature</b><div className="mt-1 text-sm text-ink-2">{opportunity.temperature}</div></div></CardBody></Card>
        <Card><CardHeader title="Quote calculator" subtitle="Instant ReliefBridge pricing for any organizational user count."/><CardBody><QuoteCalculator opportunityId={id} currentValue={opportunity.expected_value}/></CardBody></Card>
        <Card><CardHeader title="Next action" subtitle="Keep the opportunity moving without losing the follow-up."/><CardBody><form action={updateSalesPlanAction} className="space-y-4"><input type="hidden" name="opportunity_id" value={id}/><div><label className="mb-2 block text-[12.5px] font-bold text-navy">Next action</label><input name="next_action" defaultValue={opportunity.next_action??""} maxLength={500} className="h-11 w-full rounded-sm border border-line px-3 text-sm"/></div><div><label className="mb-2 block text-[12.5px] font-bold text-navy">Follow-up date/time</label><input type="datetime-local" name="next_action_at" defaultValue={datetimeLocal(opportunity.next_action_at)} className="h-11 w-full rounded-sm border border-line px-3 text-sm"/></div><button className="h-11 w-full rounded-sm bg-blue text-sm font-bold text-white">Save next action</button></form></CardBody></Card>
        <Card><CardHeader title="Add activity" subtitle="Record calls, emails, demos, quotes, evaluations, and internal notes."/><CardBody><form action={addSalesActivityAction} className="space-y-4"><input type="hidden" name="opportunity_id" value={id}/><select name="activity_type" className="h-11 w-full rounded-sm border border-line px-3 text-sm">{["Email","Phone","Demo","Evaluation","Quote","Note","Follow-Up","Other"].map(x=><option key={x}>{x}</option>)}</select><input name="summary" required maxLength={300} placeholder="Short activity summary" className="h-11 w-full rounded-sm border border-line px-3 text-sm"/><textarea name="details" maxLength={5000} rows={5} placeholder="Optional details" className="w-full rounded-sm border border-line px-3 py-3 text-sm"/><button className="h-11 w-full rounded-sm bg-navy text-sm font-bold text-white">Add to timeline</button></form></CardBody></Card>
      </aside>
    </div>
  </div></>;
}
