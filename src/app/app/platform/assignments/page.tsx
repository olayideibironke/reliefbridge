import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card,CardBody,CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { assignmentControl } from "./actions";
import { fullName,relativeDate } from "@/lib/format";
const PLATFORM="9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
export default async function AssignmentsPage(){
 const p=await requireProfile();if(p.organization_id!==PLATFORM||String(p.role||"").toLowerCase()!=="owner")redirect("/app");
 const s=await createSupabaseServerClient();
 const [{data:staff},{data:workItems,error:workError},{data:assignments}]=await Promise.all([
  s.from("profiles").select("id,first_name,last_name,email,staff_id,role").eq("organization_id",PLATFORM).in("role",["manager","staff"]).eq("access_status","active").order("first_name"),
  s.rpc("get_assignable_staff_work"),
  s.from("staff_work_assignments").select("id,staff_id,work_id,work_type,assigned_at,notes").is("unassigned_at",null).order("assigned_at",{ascending:false})
 ]);
 const staffMap=new Map((staff??[]).map(x=>[x.id,x]));
 const workMap=new Map((workItems??[]).map((x:any)=>[x.work_type+":"+x.work_id,x.label]));
 const assignmentLabel=(a:any)=>workMap.get(a.work_type+":"+a.work_id)??a.work_type.replaceAll("_"," ");
 const options=(workItems??[]).map((x:any)=>({type:x.work_type,id:x.work_id,label:x.label}));
 return <><PageHeader eyebrow="Operations" title="Work Assignments" subtitle="Assign operational records to active ReliefBridge Managers and Staff. Assignment scope controls what each worker can read."/>
 <div className="space-y-6 px-6 py-8 md:px-10">
 <Card><CardHeader title="Assign work" subtitle="Only active Manager and Staff accounts appear here. Managed demo records are excluded from staff assignment."/><CardBody>\n {workError?<p className="mb-3 text-sm text-red">Could not load assignable work. {workError.message}</p>:null}
 {!(staff??[]).length?<p className="text-sm text-ink-2">There are no active Manager or Staff accounts yet. Activate a staff account before assigning work.</p>:
 <form action={assignmentControl} className="grid gap-3 lg:grid-cols-[1fr_2fr_auto]"><input type="hidden" name="action" value="assign"/><select name="staff_id" required className="h-11 rounded-sm border border-line bg-white px-3"><option value="">Select staff member</option>{(staff??[]).map(x=><option key={x.id} value={x.id}>{fullName(x.first_name,x.last_name)} · {x.staff_id||x.role}</option>)}</select><select name="work_key" required className="h-11 rounded-sm border border-line bg-white px-3"><option value="">Select work item</option>{options.map((x:any)=><option key={x.type+":"+x.id} value={x.type+":"+x.id}>{x.label}</option>)}</select><Button type="submit">Assign work</Button></form>}
 </CardBody></Card>
 <Card><CardHeader title="Active assignments" subtitle="Unassigning closes the active assignment but preserves its history and audit event."/><CardBody padded={false}>
 {!(assignments??[]).length?<div className="p-5 text-sm text-ink-2">No active work assignments.</div>:<div className="divide-y divide-line">{(assignments??[]).map(a=>{const st:any=staffMap.get(a.staff_id);return <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div><div className="font-bold text-navy">{st?fullName(st.first_name,st.last_name):"Staff member"}</div><div className="mt-1 text-[12.5px] text-ink-2">{assignmentLabel(a)}</div><div className="mt-1 text-[11.5px] text-ink-3">Assigned {relativeDate(a.assigned_at)}</div></div><form action={assignmentControl}><input type="hidden" name="action" value="unassign"/><input type="hidden" name="assignment_id" value={a.id}/><Button type="submit" variant="outline" size="sm">Unassign</Button></form></div>})}</div>}
 </CardBody></Card></div></>;
}
