import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icons } from "@/components/ui/Icons";
import { LinkButton } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/ui/Badge";
import { DataTable, THead, Tr, Th, Td } from "@/components/ui/Table";
import { Select } from "@/components/ui/Field";
import { fullName, relativeDate } from "@/lib/format";
import {
  NEED_CATEGORIES,
  REFERRAL_STATUSES,
} from "@/lib/constants";
import type {
  NeedCategory,
  Organization,
  Referral,
  ReferralStatus,
  Survivor,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = Referral & {
  survivors: Pick<Survivor, "id" | "first_name" | "last_name"> | null;
  receiver: Pick<Organization, "id" | "name"> | null;
  sender: Pick<Organization, "id" | "name"> | null;
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: "outgoing" | "incoming"; status?: string; category?: string }>;
}) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const direction = sp.direction === "incoming" ? "incoming" : "outgoing";
  const status = REFERRAL_STATUSES.includes(sp.status as ReferralStatus)
    ? (sp.status as ReferralStatus)
    : "";
  const category = NEED_CATEGORIES.includes(sp.category as NeedCategory)
    ? (sp.category as NeedCategory)
    : "";

  const supabase = await createSupabaseServerClient();
  const orgId = profile.organization_id ?? "00000000-0000-0000-0000-000000000000";

  let query = supabase
    .from("referrals")
    .select(
      "*, survivors:survivors!referrals_survivor_id_fkey ( id, first_name, last_name ), sender:organizations!referrals_sending_org_fkey ( id, name ), receiver:organizations!referrals_receiving_org_fkey ( id, name )"
    )
    .order("created_at", { ascending: false })
    .limit(250);

  if (direction === "outgoing") {
    query = query.eq("sending_org", orgId);
  } else {
    query = query.eq("receiving_org", orgId);
  }
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data } = await query;
  const rows = ((data ?? []) as unknown) as Row[];

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Referral exchange"
        subtitle="Send referrals to partner organizations and track what happens to every handoff."
        breadcrumbs={[{ label: "Network", href: "/app" }, { label: "Referral exchange" }]}
        actions={
          <LinkButton href="/app/referrals/new">
            <Icons.Plus className="h-4 w-4" />
            Send referral
          </LinkButton>
        }
      />

      <div className="space-y-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
          <TabLink href="/app/referrals" active={direction === "outgoing"}>
            Outgoing
          </TabLink>
          <TabLink href="/app/referrals?direction=incoming" active={direction === "incoming"}>
            Incoming
          </TabLink>
        </div>

        <Card>
          <CardBody>
            <form
              className="grid items-end gap-3 sm:grid-cols-[200px_180px_auto]"
              action="/app/referrals"
              method="get"
            >
              <input type="hidden" name="direction" value={direction} />
              <Select label="Status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                {REFERRAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select label="Category" name="category" defaultValue={category}>
                <option value="">All categories</option>
                {NEED_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-semibold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  Filter
                </button>
                <Link
                  href={`/app/referrals${direction === "incoming" ? "?direction=incoming" : ""}`}
                  className="inline-flex h-11 items-center rounded-sm border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink-2 hover:border-blue hover:text-blue hover:no-underline"
                >
                  Reset
                </Link>
              </div>
            </form>
          </CardBody>
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icons.Referrals className="h-7 w-7" />}
            title={direction === "outgoing" ? "No outgoing referrals yet" : "No incoming referrals yet"}
            description={
              direction === "outgoing"
                ? "Send a referral to a partner organization to coordinate response on an unmet need."
                : "Partner organizations haven't sent any referrals your way yet."
            }
            action={
              direction === "outgoing" ? (
                <LinkButton href="/app/referrals/new">
                  <Icons.Plus className="h-4 w-4" />
                  Send first referral
                </LinkButton>
              ) : undefined
            }
          />
        ) : (
          <Card>
            <DataTable className="rounded-md border-0">
              <THead>
                <Tr>
                  <Th>Survivor</Th>
                  <Th>{direction === "outgoing" ? "Receiving partner" : "Sending org"}</Th>
                  <Th>Category</Th>
                  <Th>Status</Th>
                  <Th align="right">Created</Th>
                </Tr>
              </THead>
              <tbody>
                {rows.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      {r.survivors ? (
                        <Link
                          href={`/app/referrals/${r.id}`}
                          className="font-semibold text-navy hover:text-blue hover:no-underline"
                        >
                          {fullName(r.survivors.first_name, r.survivors.last_name)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>{direction === "outgoing" ? r.receiver?.name ?? "—" : r.sender?.name ?? "—"}</Td>
                    <Td>{r.category}</Td>
                    <Td>
                      <ReferralStatusBadge status={r.status} />
                    </Td>
                    <Td align="right" className="rb-numerals text-[12.5px] text-ink-3">
                      {relativeDate(r.created_at)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          </Card>
        )}
      </div>
    </>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-sm bg-navy px-3.5 py-2 text-[13px] font-semibold text-white hover:no-underline"
          : "rounded-sm px-3.5 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-navy hover:no-underline"
      }
    >
      {children}
    </Link>
  );
}
