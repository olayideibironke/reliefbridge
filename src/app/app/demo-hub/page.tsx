import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Icons } from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import { CreateDemoForm } from "./CreateDemoForm";
import { demoControlAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo Hub — ReliefBridge",
};

const PLATFORM_ORGANIZATION_ID = "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

type DemoWorkspace = {
  id: string;
  organization_id: string;
  contact_name: string | null;
  contact_email: string | null;
  login_email: string;
  status: "active" | "expired" | "disabled" | "archived";
  starts_at: string;
  expires_at: string;
  last_access_at: string | null;
  organizations: { name: string; state: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function statusClasses(status: DemoWorkspace["status"]) {
  if (status === "active") return "border-green/20 bg-green/10 text-green";
  if (status === "expired") return "border-gold/25 bg-gold/10 text-[#8A5A00]";
  return "border-line bg-surface-2 text-ink-3";
}

export default async function DemoHubPage() {
  const profile = await requireProfile();
  const role = profile.role?.trim().toLowerCase() ?? "";
  const isPlatformAdmin =
    profile.organization_id === PLATFORM_ORGANIZATION_ID &&
    (role === "owner" || role === "admin");

  if (!isPlatformAdmin) redirect("/app");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("demo_workspaces")
    .select("id, organization_id, contact_name, contact_email, login_email, status, starts_at, expires_at, last_access_at, organizations(name,state)")
    .order("created_at", { ascending: false });

  const demos = ((data ?? []) as unknown) as DemoWorkspace[];
  const now = Date.now();
  const active = demos.filter((demo) => demo.status === "active" && new Date(demo.expires_at).getTime() > now).length;
  const expired = demos.filter((demo) => demo.status === "expired" || new Date(demo.expires_at).getTime() <= now).length;

  return (
    <>
      <PageHeader
        eyebrow="Platform Administration"
        title="Demo Hub"
        subtitle="Create, control, expire, and preserve organization demonstrations from one secure workspace."
        breadcrumbs={[{ label: "Administration", href: "/app" }, { label: "Demo Hub" }]}
        actions={
          <Link href="/app/demo-requests" className="inline-flex h-11 items-center justify-center rounded-sm border border-line bg-white px-4 text-[13.5px] font-bold text-navy hover:border-blue hover:text-blue hover:no-underline">
            Demo requests
          </Link>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <section className="grid gap-4 sm:grid-cols-3">
          <Card><CardBody><div className="text-[12px] font-semibold text-ink-3">Total demos</div><div className="rb-numerals mt-2 text-[34px] font-black text-navy">{demos.length}</div><div className="mt-1 text-[12px] text-ink-3">Preserved demo workspaces</div></CardBody></Card>
          <Card><CardBody><div className="text-[12px] font-semibold text-ink-3">Active</div><div className="rb-numerals mt-2 text-[34px] font-black text-navy">{active}</div><div className="mt-1 text-[12px] text-ink-3">Currently available to prospects</div></CardBody></Card>
          <Card><CardBody><div className="text-[12px] font-semibold text-ink-3">Expired</div><div className="rb-numerals mt-2 text-[34px] font-black text-navy">{expired}</div><div className="mt-1 text-[12px] text-ink-3">Access window has ended</div></CardBody></Card>
        </section>

        <Card>
          <CardHeader title="Create organization demo" subtitle="Provision an isolated demonstration workspace with temporary access. Seven days is the default." />
          <CardBody>
            <CreateDemoForm />
          </CardBody>
        </Card>

        {error ? (
          <Card><CardBody><div className="text-red">Could not load demo workspaces. {error.message}</div></CardBody></Card>
        ) : demos.length === 0 ? (
          <EmptyState icon={<Icons.Reports className="h-7 w-7" />} title="No managed demos yet" description="New organization demos created through the Demo Hub will appear here." />
        ) : (
          <Card>
            <div className="border-b border-line px-5 py-4"><h2 className="text-[16px] font-bold text-navy">Managed demonstrations</h2><p className="mt-1 text-[12.5px] text-ink-3">Access status, client identity, expiration, and recent use.</p></div>
            <DataTable className="rounded-none border-0">
              <THead><Tr><Th>Organization</Th><Th>Contact</Th><Th>Login</Th><Th>Status</Th><Th>Expires</Th><Th align="right">Actions</Th></Tr></THead>
              <tbody>{demos.map((demo) => (
                <Tr key={demo.id}>
                  <Td><div className="font-semibold text-navy">{demo.organizations?.name ?? "Demo organization"}</div><div className="mt-1 text-[12px] text-ink-3">{demo.organizations?.state ?? "State not set"}</div></Td>
                  <Td><div className="text-[13px] font-semibold text-ink-2">{demo.contact_name ?? "Not assigned"}</div><div className="mt-1 text-[12px] text-ink-3">{demo.contact_email ?? ""}</div></Td>
                  <Td><span className="text-[13px] font-semibold text-blue">{demo.login_email}</span></Td>
                  <Td><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11.5px] font-bold capitalize ${statusClasses(demo.status)}`}>{demo.status}</span></Td>
                  <Td className="rb-numerals whitespace-nowrap text-[12.5px]">{formatDate(demo.expires_at)}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      <form action={demoControlAction}>
                        <input type="hidden" name="demo_id" value={demo.id} />
                        <input type="hidden" name="action" value="extend" />
                        <Button type="submit" variant="outline" size="sm">+7 days</Button>
                      </form>
                      {demo.status === "active" && (
                        <form action={demoControlAction}>
                          <input type="hidden" name="demo_id" value={demo.id} />
                          <input type="hidden" name="action" value="disable" />
                          <Button type="submit" variant="danger" size="sm">Disable</Button>
                        </form>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}</tbody>
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}
