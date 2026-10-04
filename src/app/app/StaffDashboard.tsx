import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card,CardBody,CardHeader } from "@/components/ui/Card";
import { CaseStatusBadge,PriorityBadge } from "@/components/ui/Badge";
import { fullName,relativeDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export async function StaffDashboard({profile}:{profile:Profile}){
 const s=await createSupabaseServerClient();
 const {data:assignments,error}=await s.from("staff_work_assignments").select("id,work_type,work_id,assigned_at,notes").eq("staff_id",profile.id).is("unassigned_at",null).order("assigned_at",{ascending:false});
 const caseIds=(assignments??[]).filter(a=>a.work_type==="recovery_case").map(a=>a.work_id);
 const {data:cases}=caseIds.length?await s.from("recovery_cases").select("id,priority,status,primary_need,disaster_type,opened_at,survivors:survivors!recovery_cases_survivor_id_fkey(id,first_name,last_name,state)").in("id",caseIds):{data:[]};
 const byId=new Map((cases??[]).map((c:any)=>[c.id,c]));
 const counts=(assignments??[]).reduce((m:any,a:any)=>(m[a.work_type]=(m[a.work_type]||0)+1,m),{});
 return <><PageHeader eyebrow="Staff Operations" title="My Work" subtitle="Your ReliefBridge assignments. Access is limited to work specifically assigned to you."/>
 <div className="space-y-6 px-6 py-8 md:px-10">
 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Recovery cases",counts.recovery_case||0],["Survivors",counts.survivor||0],["Unmet needs",counts.unmet_need||0],["Referrals",counts.referral||0]].map(([l,v])=><Card key={String(l)}><CardBody><div className="text-[12.5px] font-bold text-ink-2">{l}</div><div className="rb-numerals mt-2 text-[32px] font-black text-navy">{v}</div></CardBody></Card>)}</section>
 {error?<Card><CardBody><div className="text-red">Could not load your assignments.</div></CardBody></Card>:
 !(assignments??[]).length?<Card><CardHeader title="No work assigned yet"/><CardBody><p className="text-sm leading-6 text-ink-2">Your account is active, but no ReliefBridge work has been assigned to you yet. Your manager or Super Admin can assign work when it is ready.</p></CardBody></Card>:
 <Card><CardHeader title="Active assignments" subtitle="Only records within your assignment scope are available here."/><CardBody className="space-y-3">{(assignments??[]).map((a:any)=>{const c=byId.get(a.work_id) as any;if(a.work_type==="recovery_case"&&c)return <Link key={a.id} href={"/app/cases/"+c.id} className="block rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-bold text-navy">{fullName(c.survivors?.first_name,c.survivors?.last_name)}</div><div className="mt-1 text-[12.5px] text-ink-3">{c.primary_need||c.disaster_type||"Recovery case"}{c.survivors?.state?" · "+c.survivors.state:""}</div></div><div className="flex items-center gap-2"><PriorityBadge priority={c.priority}/><CaseStatusBadge status={c.status}/></div></div><div className="mt-2 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></Link>;if(a.work_type==="unmet_need")return <Link key={a.id} href="/app/unmet-needs" className="flex items-center justify-between rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div><div className="font-bold capitalize text-navy">Unmet need</div><div className="mt-1 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></div><span className="text-sm font-bold text-blue">View assigned needs →</span></Link>;const route=a.work_type==="survivor"?"/app/survivors/":"/app/referrals/";return <Link key={a.id} href={route+a.work_id) className="flex items-center justify-between rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div><div className="font-bold capitalize text-navy">{a.work_type.replace("_"," ")}</div><div className="mt-1 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></div><span className="text-sm font-bold text-blue">Open →</span></Link>})}</CardBody></Card>}
 </div></>;
}
