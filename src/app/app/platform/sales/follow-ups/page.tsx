import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sales Follow-Ups — ReliefBridge" };
const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";
const CLOSED = new Set(["Won", "Lost"]);
type Lead = { id: string; organization_name: string; contact_first_name: string | null; contact_last_name: string | null; contact_email: string; stage: string; priority: string; next_action: string | null; next_action_at: string | null; last_activity_at: string; };
const zone = "America/New_York";
const dateKey = (d: Date) => { const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d); const get = (type: string) => parts.find(p => p.type === type)?.value ?? ""; return `${get("year")}-${get("month")}-${get("day")}`; };
const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const dayNumber = (key: string) => Math.floor(Date.parse(key + "T12:00:00Z") / 86400000);
function Summary({ label, value, href }: { label: string; value: number; href: string }) {
  return <Link href={href} className="rounded-md border border-line bg-white p-5 hover:border-blue hover:no-underline"><div className="text-xs font-bold text-ink-3">{label}</div><div className="mt-2 text-3xl font-black text-navy">{value}</div></Link>;
}
export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string }> }) {
  const profile = await requireProfile();
  const role = typeof profile.role === "string" ? profile.role.trim().toLowerCase() : "";
  if (profile.organization_id !== PLATFORM_ORGANIZATION_ID || !["owner", "admin"].includes(role)) redirect("/app");
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("sales_opportunities")
    .select("id,organization_name,contact_first_name,contact_last_name,contact_email,stage,priority,next_action,next_action_at,last_activity_at")
    .eq("is_test", false).order("next_action_at", { ascending: true, nullsFirst: false }).limit(500);
  const all = (data ?? []) as Lead[];
  const today = dayNumber(dateKey(new Date()));
  const due = (lead: Lead) => lead.next_action_at ? dayNumber(dateKey(new Date(lead.next_action_at))) : null;
  const open = all.filter(x => !CLOSED.has(x.stage));
  const overdue = open.filter(x => due(x) !== null && due(x)! < today);
  const todayRows = open.filter(x => due(x) === today);
  const weekRows = open.filter(x => due(x) !== null && due(x)! >= today && due(x)! <= today + 7);
  const unscheduled = open.filter(x => !x.next_action_at);
  const view = ["overdue", "today", "week", "unscheduled", "all"].includes(sp.view ?? "") ? sp.view : "week";
  const bucket = view === "overdue" ? overdue : view === "today" ? todayRows : view === "unscheduled" ? unscheduled : view === "all" ? open : weekRows;
  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = bucket.filter(x => !q || [x.organization_name, x.contact_email, x.contact_first_name, x.contact_last_name, x.next_action].some(v => (v ?? "").toLowerCase().includes(q)));
  return <><PageHeader eyebrow="ReliefBridge Management" title="Follow-Up Tracker" subtitle="Daily outreach audit and next actions. Dates shown in Eastern Time. Internal management only." breadcrumbs={[{ label: "Sales Pipeline", href: "/app/platform/sales" }, { label: "Follow-Ups" }]} actions={<Link href="/app/platform/sales" className="inline-flex h-11 items-center rounded-sm border border-line bg-white px-4 text-sm font-bold text-navy hover:no-underline">Back to pipeline</Link>} />
    <div className="space-y-6 px-6 py-8 md:px-10">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Summary label="Overdue" value={overdue.length} href="?view=overdue" />
        <Summary label="Due today" value={todayRows.length} href="?view=today" />
        <Summary label="Next 7 days" value={weekRows.length} href="?view=week" />
        <Summary label="No follow-up scheduled" value={unscheduled.length} href="?view=unscheduled" />
        <Summary label="Open opportunities" value={open.length} href="?view=all" />
      </section>
      <Card><CardBody>
        <form className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-48 text-xs font-bold text-navy">Search contacts<input name="q" defaultValue={sp.q ?? ""} placeholder="Organization, contact or action" className="mt-2 h-11 w-full rounded-sm border border-line px-3 text-sm" /></label>
          <label className="text-xs font-bold text-navy">View<select name="view" defaultValue={view} className="mt-2 block h-11 rounded-sm border border-line bg-white px-3 text-sm"><option value="week">Next 7 days</option><option value="overdue">Overdue</option><option value="today">Due today</option><option value="unscheduled">Not scheduled</option><option value="all">All open</option></select></label>
          <button className="h-11 rounded-sm bg-navy px-5 text-sm font-bold text-white">Filter</button>
          <Link href="/app/platform/sales/follow-ups" className="inline-flex h-11 items-center rounded-sm border border-line px-4 text-sm font-bold text-navy hover:no-underline">Reset</Link>
        </form>
      </CardBody></Card>
      {error ? <Card><CardBody><p className="text-red">Could not load follow-ups. Please try again.</p></CardBody></Card> :
      <Card><CardBody><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold text-navy">Follow-up queue ({rows.length})</h2><span className="text-xs text-ink-3">Open a record to log a follow-up, add notes, or change its next action.</span></div>
        {rows.length === 0 ? <p className="py-10 text-center text-sm text-ink-3">No opportunities match this view.</p> :
        <div className="divide-y divide-line">{rows.map(x => <div key={x.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0"><Link href={"/app/platform/sales/" + x.id} className="font-bold text-navy hover:text-blue hover:no-underline">{x.organization_name}</Link><div className="mt-1 text-xs text-ink-2">{[x.contact_first_name, x.contact_last_name].filter(Boolean).join(" ") || x.contact_email}</div><div className="mt-1 text-xs text-ink-3">{x.stage} · {x.priority}</div></div>
          <div className="min-w-0 text-sm text-ink-2">{x.next_action || "No next action recorded"}</div>
          <div className={"text-sm font-semibold " + (due(x) !== null && due(x)! < today ? "text-red" : "text-navy")}>{x.next_action_at ? formatDate(x.next_action_at) : "Not scheduled"}</div>
          <Link href={"/app/platform/sales/" + x.id} className="inline-flex h-10 items-center justify-center rounded-sm border border-line px-4 text-xs font-bold text-blue hover:no-underline">Manage →</Link>
        </div>)}</div>}
      </CardBody></Card>}
      <p className="text-xs text-ink-3">Follow-ups are manual. This tracker does not send emails or automatically change opportunity stages. Records marked Won or Lost are excluded from the open queue.</p>
    </div></>;
}
