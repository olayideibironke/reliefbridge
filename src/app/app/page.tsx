import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { OrganizationDashboard } from "./OrganizationDashboard";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export const dynamic="force-dynamic";
export default async function DashboardPage(){
 const profile=await requireProfile();const isAdmin=profile.organization_id===PLATFORM&&["owner","admin"].includes((profile.role??"").toLowerCase());
 if(!isAdmin)return <OrganizationDashboard/>;
 const s=await createSupabaseServerClient();
 const [orgs,users,survivors,cases,needs,refs,demos,requests]=await Promise.all([
 s.from("organizations").select("id",{count:"exact",head:true}).eq("is_demo_network",false),
 s.from("profiles").select("id",{count:"exact",head:true}).eq("access_status","active"),
 s.from("survivors").select("id",{count:"exact",head:true}),
 s.from("recovery_cases").select("id",{count:"exact",head:true}).eq("status","open"),
 s.from("unmet_needs").select("id",{count:"exact",head:true}).eq("status","open"),
 s.from("referrals").select("id",{count:"exact",head:true}).eq("status","Pending"),
 s.from("demo_workspaces").select("id",{count:"exact",head:true}).eq("status","active").gt("expires_at",new Date().toISOString()),
 s.from("demo_requests").select("id",{count:"exact",head:true})
 ]);
 const metrics=[["Organizations",orgs.count??0,"Registered platform organizations",Icons.Building],["Platform users",users.count??0,"Active user profiles",Icons.Partners],["Survivors",survivors.count??0,"Records across the platform",Icons.Survivors],["Open cases",cases.count??0,"Recovery cases requiring work",Icons.Cases],["Open unmet needs",needs.count??0,"Needs requiring coordination",Icons.Needs],["Pending referrals",refs.count??0,"Referrals awaiting action",Icons.Referrals],["Active demos",demos.count??0,"Managed demonstrations currently active",Icons.Reports],["Demo requests",requests.count??0,"Requests recorded in Demo Hub",Icons.Mail]] as const;
 return <><PageHeader eyebrow="Platform Administration" title="ReliefBridge Command Center" subtitle="System-wide oversight for organizations, operations, demonstrations, and administrative access." actions={<><LinkButton href="/app/platform/organizations" variant="outline">Organizations</LinkButton><LinkButton href="/app/platform/staff">Staff Management</LinkButton></>}/>
 <div className="space-y-8 px-6 py-8 md:px-10"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,value,detail,Icon])=><Card key={label}><CardBody><div className="flex items-start justify-between"><div><div className="text-[13px] font-bold text-ink-2">{label}</div><div className="rb-numerals mt-2 text-[36px] font-black text-navy">{value.toLocaleString()}</div><div className="mt-2 text-[12.5px] text-ink-3">{detail}</div></div><span className="grid h-10 w-10 place-items-center rounded-sm bg-blue-soft text-blue"><Icon className="h-5 w-5"/></span></div></CardBody></Card>)}</section>
 <section className="grid gap-5 lg:grid-cols-3"><Card><CardBody><div className="text-[12px] font-bold uppercase tracking-[.14em] text-blue">Organization control</div><h2 className="mt-2 text-xl font-black text-navy">Manage the ReliefBridge network</h2><p className="mt-2 text-sm leading-6 text-ink-2">Review participating organizations and control platform access from one administrative workspace.</p><div className="mt-5"><LinkButton href="/app/platform/organizations" variant="outline" size="sm">Open organizations</LinkButton></div></CardBody></Card><Card><CardBody><div className="text-[12px] font-bold uppercase tracking-[.14em] text-blue">Administration</div><h2 className="mt-2 text-xl font-black text-navy">Staff and access</h2><p className="mt-2 text-sm leading-6 text-ink-2">Invite administrators, disable access, and preserve the protected Super Admin role.</p><div className="mt-5"><LinkButton href="/app/platform/staff" variant="outline" size="sm">Manage staff</LinkButton></div></CardBody></Card><Card><CardBody><div className="text-[12px] font-bold uppercase tracking-[.14em] text-blue">Oversight</div><h2 className="mt-2 text-xl font-black text-navy">Administrative history</h2><p className="mt-2 text-sm leading-6 text-ink-2">Review recorded administrative actions for accountability and platform oversight.</p><div className="mt-5"><LinkButton href="/app/platform/activity" variant="outline" size="sm">View activity log</LinkButton></div></CardBody></Card></section></div></>;
}