import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { updateSalesOpportunityAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales Pipeline — ReliefBridge" };

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const STAGES = ["Prospect","Contacted","Engaged","Qualified","Demo Requested","Demo Scheduled","Demo Completed","7-Day Evaluation Offered","Evaluation Active","Quote/Proposal","Decision","Won","Lost","Future Follow-Up"] as const;
type Stage = typeof STAGES[number];
type Opportunity = { id:string; organization_name:string; contact_first_name:string|null; contact_last_name:string|null; contact_email:string; contact_phone:string|null; role_title:string|null; stage:string; priority:string; temperature:string; source:string; next_action:string|null; next_action_at:string|null; last_activity_at:string; created_at:string; demo_request_id:string|null; recovery_focus:string|null; notes:string|null; is_test:boolean };
const activeStages = new Set<Stage>(STAGES.filter(s => !["Won","Lost","Future Follow-Up"].includes(s)));

function badge(value:string) {
  if (value === "Hot" || value === "Critical") return "border-red/20 bg-red/5 text-red";
  if (value === "High" || value === "Qualified" || value === "Won") return "border-green/20 bg-green/10 text-green";
  if (value.includes("Demo") || value.includes("Evaluation") || value === "Quote/Proposal") return "border-blue/20 bg-blue-soft text-blue";
  return "border-line bg-surface-2 text-ink-2";
}
function fmt(v:string|null) {
  if (!v) return "Not scheduled";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "Not scheduled" : new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short"}).format(d);
}
function Kpi({label,value,hint}:{label:string;value:number;hint:string}) {
  return <Card><CardBody><div className="text-[12px] font-semibold text-ink-3">{label}</div><div className="rb-numerals mt-2 text-[34px] font-black tracking-tight text-navy">{value}</div><div className="mt-1 text-[12px] leading-5 text-ink-3">{hint}</div></CardBody></Card>;
}

export default async function SalesPipelinePage({searchParams}:{searchParams:Promise<{stage?:string;q?:string;saved?:string;error?:string}>}) {
  const profile = await requireProfile();
  const role = typeof profile.role === "string" ? profile.role.trim().toLowerCase() : "";
  if (profile.organization_id !== PLATFORM_ORGANIZATION_ID || !(role === "owner" || role === "admin")) redirect("/app");

  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {data,error} = await supabase.from("sales_opportunities")
    .select("id,organization_name,contact_first_name,contact_last_name,contact_email,contact_phone,role_title,stage,priority,temperature,source,next_action,next_action_at,last_activity_at,created_at,demo_request_id,recovery_focus,notes,is_test")
    .eq("is_test",false)
    .order("last_activity_at",{ascending:false})
    .limit(500);

  const all = ((data ?? []) as unknown) as Opportunity[];
  const q = (sp.q ?? "").trim().toLowerCase();
  const selected = STAGES.includes(sp.stage as Stage) ? (sp.stage as Stage) : "";
  const rows = all.filter(o => (!selected || o.stage === selected) && (!q || [o.organization_name,o.contact_first_name,o.contact_last_name,o.contact_email,o.role_title,o.recovery_focus].some(v => (v ?? "").toLowerCase().includes(q))));

  const now = Date.now();
  const newLeads = all.filter(o => now - new Date(o.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000).length;
  const active = all.filter(o => activeStages.has(o.stage as Stage)).length;
  const demos = all.filter(o => ["Demo Requested","Demo Scheduled"].includes(o.stage)).length;
  const evals = all.filter(o => ["7-Day Evaluation Offered","Evaluation Active"].includes(o.stage)).length;
  const quotes = all.filter(o => o.stage === "Quote/Proposal").length;
  const won = all.filter(o => o.stage === "Won").length;
  const stageCounts = STAGES.map(stage => ({stage,count:all.filter(o => o.stage === stage).length}));

  return <><PageHeader eyebrow="ReliefBridge Management" title="Sales Pipeline" subtitle="Internal opportunity management for qualified disaster-recovery organizations, demonstrations, evaluations, quotes, and production decisions." breadcrumbs={[{label:"Administration",href:"/app"},{label:"Sales Pipeline"}]} actions={<Link href="/app/demo-requests" className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-4 text-[13px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline">Demo request inbox</Link>}/>
  <div className="space-y-6 px-6 py-8 md:px-10">
    {sp.saved === "1" && <div className="rounded-md border border-green/25 bg-green/10 px-5 py-4 text-[13.5px] font-semibold text-green">Opportunity updated successfully.</div>}
    {sp.error && <div className="rounded-md border border-red/25 bg-red/5 px-5 py-4 text-[13.5px] font-semibold text-red">The requested sales update could not be completed. Please try again.</div>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <Kpi label="New Leads" value={newLeads} hint="Created in the last 30 days"/>
      <Kpi label="Active Opportunities" value={active} hint="Open pipeline"/>
      <Kpi label="Demo Requests" value={demos} hint="Requested or scheduled"/>
      <Kpi label="Evaluations" value={evals} hint="Offered or active"/>
      <Kpi label="Quotes Pending" value={quotes} hint="Quote or proposal stage"/>
      <Kpi label="Won" value={won} hint="Closed successfully"/>
    </section>

    <Card><CardBody><div className="mb-3 text-[13px] font-bold text-navy">Pipeline by stage</div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{stageCounts.map(x=><Link key={x.stage} href={"/app/platform/sales?stage="+encodeURIComponent(x.stage)} className="rounded-sm border border-line bg-surface-2 px-3 py-3 hover:border-blue hover:no-underline"><div className="text-[11px] font-semibold leading-4 text-ink-3">{x.stage}</div><div className="rb-numerals mt-1 text-xl font-black text-navy">{x.count}</div></Link>)}</div></CardBody></Card>

    <Card><CardBody><form className="grid items-end gap-3 md:grid-cols-[minmax(0,1fr)_240px_auto]"><div><label className="mb-2 block text-[13px] font-bold text-navy">Search pipeline</label><input name="q" defaultValue={sp.q??""} placeholder="Organization, contact, email, role, recovery focus" className="h-11 w-full rounded-sm border border-line bg-white px-3.5 text-[14px] outline-none focus:border-blue"/></div><div><label className="mb-2 block text-[13px] font-bold text-navy">Stage</label><select name="stage" defaultValue={selected} className="h-11 w-full rounded-sm border border-line bg-white px-3.5 text-[14px]"><option value="">All stages</option>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div><div className="flex gap-2"><button className="h-11 rounded-sm bg-blue px-4 text-[13px] font-bold text-white">Filter</button><Link href="/app/platform/sales" className="inline-flex h-11 items-center rounded-sm border border-line px-4 text-[13px] font-bold text-navy hover:no-underline">Reset</Link></div></form></CardBody></Card>

    {error ? <Card><CardBody><div className="text-red">Could not load sales pipeline: {error.message}</div></CardBody></Card> :
    <div className="grid gap-5 xl:grid-cols-2">{rows.map(o=><Card key={o.id} className={o.temperature==="Hot"?"ring-1 ring-red/15":""}><CardBody>
      <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className={"rounded-full border px-2.5 py-1 text-[11px] font-bold "+badge(o.temperature)}>{o.temperature}</span><span className={"rounded-full border px-2.5 py-1 text-[11px] font-bold "+badge(o.priority)}>{o.priority} priority</span></div><h2 className="mt-3 text-[18px] font-bold text-navy"><Link href={"/app/platform/sales/"+o.id} className="hover:text-blue hover:no-underline">{o.organization_name}</Link></h2><p className="mt-1 text-[13px] text-ink-2">{[o.contact_first_name,o.contact_last_name].filter(Boolean).join(" ")||"Contact"}{o.role_title?(" · "+o.role_title):""}</p><a href={"mailto:"+o.contact_email} className="mt-1 block text-[12.5px] text-blue hover:no-underline">{o.contact_email}</a></div><span className={"shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold "+badge(o.stage)}>{o.stage}</span></div>
      {o.recovery_focus&&<div className="mt-4 rounded-sm border border-line bg-surface-2 px-4 py-3 text-[12.5px] leading-5 text-ink-2"><span className="font-bold text-navy">Recovery focus: </span>{o.recovery_focus}</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><div className="text-[10.5px] font-bold uppercase tracking-[.12em] text-ink-3">Next action</div><div className="mt-1 text-[13px] font-semibold text-ink-2">{o.next_action||"No next action recorded"}</div></div><div><div className="text-[10.5px] font-bold uppercase tracking-[.12em] text-ink-3">Due</div><div className="mt-1 text-[13px] text-ink-2">{fmt(o.next_action_at)}</div></div></div>
      <form action={updateSalesOpportunityAction} className="mt-5 grid min-w-0 gap-3 border-t border-line pt-4 sm:grid-cols-2 2xl:grid-cols-[minmax(150px,1fr)_minmax(110px,140px)_minmax(110px,140px)_auto]"><input type="hidden" name="opportunity_id" value={o.id}/><select name="stage" defaultValue={o.stage} className="h-10 min-w-0 w-full rounded-sm border border-line bg-white px-2 text-[12px]">{STAGES.map(s=><option key={s}>{s}</option>)}</select><select name="priority" defaultValue={o.priority} className="h-10 min-w-0 w-full rounded-sm border border-line bg-white px-2 text-[12px]">{["Low","Medium","High","Critical"].map(s=><option key={s}>{s}</option>)}</select><select name="temperature" defaultValue={o.temperature} className="h-10 min-w-0 w-full rounded-sm border border-line bg-white px-2 text-[12px]">{["Cold","Warm","Hot"].map(s=><option key={s}>{s}</option>)}</select><button className="h-10 w-full rounded-sm bg-navy px-4 text-[12px] font-bold text-white sm:col-span-2 2xl:col-span-1 2xl:w-auto">Update</button></form>
      <div className="mt-3 flex flex-wrap gap-4"><Link href={"/app/platform/sales/"+o.id} className="inline-flex text-[12px] font-bold text-blue hover:no-underline">Open opportunity →</Link>{o.demo_request_id&&<Link href={"/app/demo-requests/"+o.demo_request_id} className="inline-flex text-[12px] font-bold text-blue hover:no-underline">Open original demo request →</Link>}</div>
    </CardBody></Card>)}</div>}

    {!error&&rows.length===0&&<Card><CardBody><div className="py-10 text-center text-[14px] text-ink-3">No opportunities match these filters.</div></CardBody></Card>}
  </div></>;
}
