import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Louisiana VOAD Dashboard — ReliefBridge",
};

const POWER_BI_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiOGNiYmYyNzctOWE5NC00YzVjLThkMDgtNDhiNzkzYmVjMDIxIiwidCI6IjNlNDEwNjM1LWI1MmMtNGE4Zi1hOTlmLTM5YTViOGVjNzc5YiJ9";

export default function LouisianaVoadDashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Partner intelligence"
        title="Louisiana VOAD dashboard"
        subtitle="Interactive partner dashboard provided by Louisiana VOAD and hosted in Microsoft Power BI."
        breadcrumbs={[
          { label: "Reports", href: "/app/reports" },
          { label: "Louisiana VOAD dashboard" },
        ]}
        actions={
          <a
            href={POWER_BI_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-sm border border-line bg-surface px-4 py-2.5 text-[13px] font-semibold text-navy transition hover:border-blue hover:text-blue hover:no-underline"
          >
            Open in Power BI
          </a>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="overflow-hidden rounded-sm border border-line bg-surface shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[16px] font-bold text-navy">
              Sample Dashboard
            </h2>
            <p className="mt-1 text-[12.5px] leading-5 text-ink-3">
              Source: Louisiana VOAD. This report is hosted and maintained in the partner&apos;s Microsoft Power BI environment.
            </p>
          </div>

          <div className="relative min-h-[520px] w-full bg-surface-2">
            <iframe
              title="Louisiana VOAD Sample Dashboard"
              src={POWER_BI_URL}
              allowFullScreen
              className="block h-[70vh] min-h-[520px] w-full border-0"
            />
          </div>
        </div>

        <div className="mt-4 rounded-sm border border-line bg-surface px-5 py-4 text-[12.5px] leading-5 text-ink-3">
          ReliefBridge displays this dashboard as partner-provided external content. The underlying report and data remain hosted in Microsoft Power BI and are not stored in ReliefBridge.
        </div>
      </div>
    </div>
  );
}
