import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icons } from "@/components/ui/Icons";
import { Badge } from "@/components/ui/Badge";
import type { Organization } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const org = data as Organization;
  const isMe = org.id === profile.organization_id;

  return (
    <>
      <PageHeader
        eyebrow={isMe ? "Your organization" : "Partner organization"}
        title={org.name}
        subtitle={
          [org.type, [org.city, org.state].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        breadcrumbs={[
          { label: "Network", href: "/app" },
          { label: "Partner organizations", href: "/app/partners" },
          { label: org.name },
        ]}
        actions={
          <>
            {!isMe && (
              <LinkButton href={`/app/referrals/new?org=${org.id}`}>
                <Icons.Referrals className="h-4 w-4" />
                Refer survivor
              </LinkButton>
            )}
            {isMe && (
              <LinkButton href="/app/settings/organization" variant="outline">
                <Icons.Edit className="h-4 w-4" />
                Edit profile
              </LinkButton>
            )}
          </>
        }
      />

      <div className="grid gap-6 px-6 py-8 md:px-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Organization profile" />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13.5px]">
                <Field
                  label="Type"
                  node={<Badge tone="blue">{org.type}</Badge>}
                />
                <Field label="Location" value={[org.city, org.state].filter(Boolean).join(", ")} />
                <Field
                  label="Website"
                  node={
                    org.website ? (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue hover:text-navy-light"
                      >
                        {org.website}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <Field label="Email" value={org.email} />
                <Field label="Phone" value={org.phone} />
              </dl>

              {org.description && (
                <div className="mt-6">
                  <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
                    About
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-ink-2">
                    {org.description}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Coordination" />
            <CardBody className="space-y-3 text-[13.5px] text-ink-2">
              <p>
                Send a referral to this organization for survivors in their
                service area and category.
              </p>
              {!isMe ? (
                <LinkButton href={`/app/referrals/new`} className="w-full justify-center">
                  Send a referral
                </LinkButton>
              ) : (
                <Link
                  href="/app/settings/organization"
                  className="text-[13px] font-semibold text-blue hover:text-navy-light hover:no-underline"
                >
                  Edit your organization profile →
                </Link>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  node,
}: {
  label: string;
  value?: string | null;
  node?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-ink">{node ?? value ?? "—"}</dd>
    </div>
  );
}
