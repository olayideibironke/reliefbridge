import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recovery resources — ReliefBridge" };

type Funding = { id:string; case_id:string|null; source_name:string; committed_amount:number; disbursed_amount:number };
type Repair = { id:string; case_id:string|null; project_name:string; contractor_name:string|null; status:string; percent_complete:number };
type Expense = { id:string; case_id:string|null; description:string; amount:number; expense_date:string; document_reference:string|null };
type Donation = { id:string; case_id:string|null; unmet_need_id:string|null; item_name:string; quantity_received:number; quantity_allocated:number; unit:string };
const usd = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(value) || 0);
const number = (value:number) => new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(value) || 0);

export default async function RecoveryResourcesPage({searchParams}:{searchParams:Promise<{case?:string}>}) {
 const profile=await requireProfile();
 const orgId=profile.organization_id;
 const params=await searchParams;
 const caseId=params.case && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(params.case) ? params.case : null;
 const supabase=await createSupabaseServerClient();
 if (!orgId) return <div className="p-8 text-ink-3">An organization is required to view recovery resources.</div>;
 const fundingQuery=supabase.from("recovery_funding").select("id,case_id,source_name,committed_amount,disbursed_amount").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
 const repairsQuery=supabase.from("recovery_repairs").select("id,case_id,project_name,contractor_name,status,percent_complete").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
 const expensesQuery=supabase.from("recovery_expenses").select("id,case_id,description,amount,expense_date,document_reference").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
 const donationsQuery=supabase.from("recovery_donations").select("id,case_id,unmet_need_id,item_name,quantity_received,quantity_allocated,unit").eq("organization_id",orgId).order("created_at",{ascending:false}).limit(200);
 if(caseId){fundingQuery.eq("case_id",caseId);repairsQuery.eq("case_id",caseId);expensesQuery.eq("case_id",caseId);donationsQuery.eq("case_id",caseId);}
 const [f,r,e,d]=await Promise.all([fundingQuery,repairsQuery,expensesQuery,donationsQuery]);
 const missing=[f,r,e,d].some(x=>x.error?.code==="42P01"||x.error?.code==="PGRST205");
 const otherError=[f,r,e,d].find(x=>x.error&&!["42P01","PGRST205"].includes(x.error.code ?? ""));
 const funding=(f.data??[]) as Funding[],repairs=(r.data??[]) as Repair[],expenses=(e.data??[]) as Expense[],donations=(d.data??[]) as Donation[];
 return <>
  <PageHeader eyebrow="Workspace" title="Recovery resources" subtitle="Funding, repair progress, expense records, and donated resources connected to recovery cases." breadcrumbs={[{label:"Workspace",href:"/app"},{label:"Recovery resources"}]}/>
  <div className="space-y-6 px-6 py-8 md:px-10">
   {caseId&&<div className="text-sm"><Link href={`/app/cases/${caseId}`} className="font-semibold text-blue">Return to recovery case</Link> · <Link href="/app/recovery-resources" className="text-ink-3">View all resources</Link></div>}
   {missing?<Card><CardBody><p className="font-semibold text-navy">Recovery resource modules are being prepared.</p><p className="mt-2 text-sm text-ink-3">The resource database migration has not been released. Existing recovery cases remain available.</p></CardBody></Card>:
   otherError?<Card><CardBody><p className="text-red">Unable to load recovery resources. Please try again or contact your administrator.</p></CardBody></Card>:
   <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
     <Metric label="Funding committed" value={usd(funding.reduce((s,x)=>s+Number(x.committed_amount),0))}/>
     <Metric label="Funding disbursed" value={usd(funding.reduce((s,x)=>s+Number(x.disbursed_amount),0))}/>
     <Metric label="Documented expenses" value={usd(expenses.reduce((s,x)=>s+Number(x.amount),0))}/>
     <Metric label="Repair projects" value={String(repairs.length)}/>
    </div>
    <Card><CardHeader title="Funding and allocations" subtitle="Committed funding and disbursements by source"/><CardBody><div className="space-y-3">{funding.length?funding.map(x=><Item key={x.id} title={x.source_name} detail={`Committed ${usd(x.committed_amount)} · Disbursed ${usd(x.disbursed_amount)} · Remaining ${usd(Number(x.committed_amount)-Number(x.disbursed_amount))}`} caseId={x.case_id}/>):<Empty label="No funding records yet"/>}</div></CardBody></Card>
    <Card><CardHeader title="Repair and construction" subtitle="Project milestones and progress"/><CardBody><div className="space-y-3">{repairs.length?repairs.map(x=><div key={x.id} className="rounded-sm border border-line p-4"><Item title={x.project_name} detail={`${x.status.replaceAll("_"," ")} · ${x.contractor_name||"Contractor not assigned"}`} caseId={x.case_id}/><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-blue" style={{width:`${Math.min(100,Math.max(0,x.percent_complete))}%`}}/></div><p className="mt-1 text-xs text-ink-3">{x.percent_complete}% complete</p></div>):<Empty label="No repair projects yet"/>}</div></CardBody></Card>
    <Card><CardHeader title="Expenses and documentation" subtitle="Financial records and supporting document references"/><CardBody><div className="space-y-3">{expenses.length?expenses.map(x=><Item key={x.id} title={x.description} detail={`${usd(x.amount)} · ${x.expense_date} · ${x.document_reference||"No document reference"}`} caseId={x.case_id}/>):<Empty label="No expense records yet"/>}</div></CardBody></Card>
    <Card><CardHeader title="Non-monetary donations" subtitle="Received resources, allocations, and unmet-need links"/><CardBody><div className="space-y-3">{donations.length?donations.map(x=><div key={x.id}><Item title={x.item_name} detail={`Received ${number(x.quantity_received)} ${x.unit} · Allocated ${number(x.quantity_allocated)} · Available ${number(Number(x.quantity_received)-Number(x.quantity_allocated))}`} caseId={x.case_id}/>{x.unmet_need_id&&<p className="px-4 text-xs text-ink-3">Linked to unmet need</p>}</div>):<Empty label="No donated resources yet"/>}</div></CardBody></Card>
   </>}
  </div>
 </>;
}
function Metric({label,value}:{label:string;value:string}){return <Card><CardBody><p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{label}</p><p className="mt-2 text-xl font-bold text-navy">{value}</p></CardBody></Card>}
function Item({title,detail,caseId}:{title:string;detail:string;caseId:string|null}){return <div className="rounded-sm border border-line p-4"><p className="font-semibold text-navy">{title}</p><p className="mt-1 text-sm text-ink-3">{detail}</p>{caseId&&<Link className="mt-2 inline-block text-xs font-semibold text-blue" href={`/app/cases/${caseId}`}>Open recovery case</Link>}</div>}
function Empty({label}:{label:string}){return <p className="rounded-sm border border-dashed border-line p-6 text-center text-sm text-ink-3">{label}</p>}
