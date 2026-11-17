import Link from "next/link";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocale, t } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card,CardBody,CardHeader } from "@/components/ui/Card";
import { CaseStatusBadge,PriorityBadge } from "@/components/ui/Badge";
import { fullName,relativeDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export async function StaffDashboard({profile}:{profile:Profile}){
 const locale=parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
 const s=await createSupabaseServerClient();
 const {data:assignments,error}=await s.rpc("get_my_work_assignments");
 const work=assignments??[];
 const caseIds=work.filter((a:any)=>a.work_type==="recovery_case").map((a:any)=>a.work_id);
 const {data:cases}=caseIds.length?await s.from("recovery_cases").select("id,priority,status,primary_need,disaster_type,opened_at,survivors:survivors!recovery_cases_survivor_id_fkey(id,first_name,last_name,state)").in("id",caseIds):{data:[]};
 const byId=new Map((cases??[]).map((c:any)=>[c.id,c]));
 const counts=work.reduce((m:any,a:any)=>(m[a.work_type]=(m[a.work_type]||0)+1,m),{});
 return <><PageHeader eyebrow={t(locale,"staffOperations")} title={t(locale,"myWork")} subtitle={t(locale,"staffAssignmentSubtitle")}/>
 <div className="space-y-6 px-6 py-8 md:px-10">
 <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[t(locale,"recoveryCases"),counts.recovery_case||0],[t(locale,"survivors"),counts.survivor||0],[t(locale,"unmetNeeds"),counts.unmet_need||0],[t(locale,"referrals"),counts.referral||0]].map(([l,v])=><Card key={String(l)}><CardBody><div className="text-[12.5px] font-bold text-ink-2">{l}</div><div className="rb-numerals mt-2 text-[32px] font-black text-navy">{v}</div></CardBody></Card>)}</section>
 {error?<Card><CardHeader title={t(locale,"assignmentsUnavailable")}/><CardBody><p className="text-sm leading-6 text-ink-2">{t(locale,"assignmentsUnavailableHelp")}</p></CardBody></Card>:
 !work.length?<Card><CardHeader title={t(locale,"noAssignments")}/><CardBody><p className="text-sm leading-6 text-ink-2">{t(locale,"noAssignmentsHelp")}</p></CardBody></Card>:
 <Card><CardHeader title={t(locale,"activeAssignments")} subtitle={t(locale,"activeAssignmentsHelp")}/><CardBody className="space-y-3">{work.map((a:any)=>{const c=byId.get(a.work_id) as any;if(a.work_type==="recovery_case"&&c)return <Link key={a.id} href={"/app/cases/"+c.id} className="block rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-bold text-navy">{fullName(c.survivors?.first_name,c.survivors?.last_name)}</div><div className="mt-1 text-[12.5px] text-ink-3">{c.primary_need||c.disaster_type||"Recovery case"}{c.survivors?.state?" · "+c.survivors.state:""}</div></div><div className="flex items-center gap-2"><PriorityBadge priority={c.priority}/><CaseStatusBadge status={c.status}/></div></div><div className="mt-2 text-[11.5px] text-ink-3">{t(locale,"assigned")} {relativeDate(a.assigned_at)}</div></Link>;if(a.work_type==="unmet_need")return <Link key={a.id} href="/app/unmet-needs" className="flex items-center justify-between rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div><div className="font-bold capitalize text-navy">{t(locale,"unmetNeed")}</div><div className="mt-1 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></div><span className="text-sm font-bold text-blue">{t(locale,"viewAssignedNeeds")} →</span></Link>;const route=a.work_type==="survivor"?"/app/survivors/":"/app/referrals/";return <Link key={a.id} href={route+a.work_id} className="flex items-center justify-between rounded-sm border border-line p-4 hover:border-blue hover:no-underline"><div><div className="font-bold capitalize text-navy">{a.work_type.replace("_"," ")}</div><div className="mt-1 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></div><span className="text-sm font-bold text-blue">{t(locale,"open")} →</span></Link>})}</CardBody></Card>}
 </div></>;
}
