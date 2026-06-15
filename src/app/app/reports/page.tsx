import Link from "next/link";
import type {
  ComponentType,
  CSSProperties,
  SVGProps,
} from "react";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

export const metadata = {
  title: "Reports — ReliefBridge",
};

export const dynamic = "force-dynamic";

const REPORT_RANGES = [
  {
    value: "30",
    label: "Last 30 days",
  },
  {
    value: "90",
    label: "Last 90 days",
  },
  {
    value: "365",
    label: "Last 12 months",
  },
  {
    value: "all",
    label: "All available records",
  },
] as const;

type ReportRange =
  (typeof REPORT_RANGES)[number]["value"];

type BaseRow = {
  id: string;
  status: string | null;
  created_at: string;
};

type ReferralRow = BaseRow & {
  category: string | null;
  sending_org: string;
  receiving_org: string;
};

type UnmetNeedRow = BaseRow & {
  category: string | null;
};

type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

type ActivityDatum = {
  key: string;
  label: string;
  value: number;
};

type ReportCard = {
  href: string;
  title: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  band: string;
  value: number;
  valueLabel: string;
  secondary: string;
};

const CHART_COLORS = [
  "#0B6EAD",
  "#FDB022",
  "#2E7D32",
  "#7B61A8",
  "#C44D58",
  "#3C8799",
  "#8A6742",
];

function parseRange(
  value: string | undefined
): ReportRange {
  return REPORT_RANGES.some(
    (option) => option.value === value
  )
    ? (value as ReportRange)
    : "90";
}

function rangeStart(
  range: ReportRange
): string | null {
  if (range === "all") {
    return null;
  }

  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(
    date.getUTCDate() - Number(range) + 1
  );

  return date.toISOString();
}

function selectedRangeLabel(
  range: ReportRange
): string {
  return (
    REPORT_RANGES.find(
      (option) => option.value === range
    )?.label ?? "Last 90 days"
  );
}

function normalizeStatus(
  value: string | null
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function readableLabel(
  value: string | null | undefined
): string {
  const normalized =
    value?.trim() || "Not specified";

  return normalized
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function isClosedCase(
  status: string | null
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "closed",
    "completed",
    "resolved",
  ].includes(normalized);
}

function isCompletedReferral(
  status: string | null
): boolean {
  const normalized =
    normalizeStatus(status);

  return [
    "completed",
    "closed",
  ].includes(normalized);
}

function isPendingReferral(
  status: string | null
): boolean {
  const normalized =
    normalizeStatus(status);

  return ![
    "completed",
    "closed",
    "declined",
    "cancelled",
    "canceled",
  ].includes(normalized);
}

function isOpenNeed(
  status: string | null
): boolean {
  const normalized =
    normalizeStatus(status);

  return ![
    "closed",
    "completed",
    "resolved",
    "met",
  ].includes(normalized);
}

function groupRows<T>(
  rows: T[],
  valueForRow: (row: T) => string | null
): Array<{
  label: string;
  value: number;
}> {
  const counts = new Map<
    string,
    {
      label: string;
      value: number;
    }
  >();

  for (const row of rows) {
    const rawValue =
      valueForRow(row)?.trim() ||
      "Not specified";

    const key = rawValue.toLowerCase();

    const current = counts.get(key);

    if (current) {
      current.value += 1;
    } else {
      counts.set(key, {
        label: readableLabel(rawValue),
        value: 1,
      });
    }
  }

  return Array.from(counts.values()).sort(
    (first, second) =>
      second.value - first.value
  );
}

function chartData(
  values: Array<{
    label: string;
    value: number;
  }>,
  maximumItems = 6
): ChartDatum[] {
  if (values.length <= maximumItems) {
    return values.map((item, index) => ({
      ...item,
      color:
        CHART_COLORS[
          index % CHART_COLORS.length
        ],
    }));
  }

  const visible =
    values.slice(0, maximumItems - 1);

  const remaining = values
    .slice(maximumItems - 1)
    .reduce(
      (sum, item) => sum + item.value,
      0
    );

  return [
    ...visible,
    {
      label: "Other",
      value: remaining,
    },
  ].map((item, index) => ({
    ...item,
    color:
      CHART_COLORS[
        index % CHART_COLORS.length
      ],
  }));
}

function donutBackground(
  data: ChartDatum[]
): string {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  if (total === 0) {
    return "#E6ECF1";
  }

  let currentDegrees = 0;

  const segments = data.map((item) => {
    const start = currentDegrees;

    currentDegrees +=
      (item.value / total) * 360;

    return `${item.color} ${start}deg ${currentDegrees}deg`;
  });

  return `conic-gradient(${segments.join(
    ", "
  )})`;
}

function buildActivityData(
  rows: BaseRow[]
): ActivityDatum[] {
  const months: ActivityDatum[] = [];
  const monthMap = new Map<string, number>();
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - offset,
        1
      )
    );

    const key =
      `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1
      ).padStart(2, "0")}`;

    months.push({
      key,
      label:
        new Intl.DateTimeFormat("en-US", {
          month: "short",
        }).format(date),
      value: 0,
    });

    monthMap.set(key, months.length - 1);
  }

  for (const row of rows) {
    const date = new Date(row.created_at);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const key =
      `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1
      ).padStart(2, "0")}`;

    const index = monthMap.get(key);

    if (index !== undefined) {
      months[index].value += 1;
    }
  }

  return months;
}

function DownloadIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  hint,
  suffix,
}: {
  label: string;
  value: number;
  hint: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="text-[12px] font-semibold text-ink-3">
          {label}
        </div>

        <div className="mt-2 flex items-end gap-1">
          <div className="rb-numerals text-[34px] font-black leading-none tracking-tight text-navy">
            {value.toLocaleString()}
          </div>

          {suffix && (
            <div className="pb-0.5 text-[14px] font-bold text-blue">
              {suffix}
            </div>
          )}
        </div>

        <div className="mt-2 text-[12px] leading-5 text-ink-3">
          {hint}
        </div>
      </CardBody>
    </Card>
  );
}

function HorizontalBarChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
}) {
  const maximum = Math.max(
    ...data.map((item) => item.value),
    0
  );

  return (
    <Card>
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-bold text-navy">
          {title}
        </h2>

        <p className="mt-1 text-[12.5px] leading-5 text-ink-3">
          {subtitle}
        </p>
      </div>

      <CardBody>
        {data.length === 0 ? (
          <div className="grid min-h-[240px] place-items-center rounded-sm border border-dashed border-line bg-surface-2 px-5 text-center text-[13px] text-ink-3">
            No report data is available for this
            period.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => {
              const percentage =
                maximum > 0
                  ? Math.max(
                      (item.value / maximum) *
                        100,
                      4
                    )
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between gap-4">
                    <div className="truncate text-[12.5px] font-semibold text-ink-2">
                      {item.label}
                    </div>

                    <div className="rb-numerals text-[12px] font-bold text-navy">
                      {item.value.toLocaleString()}
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function DonutChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
}) {
  const total = data.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const donutStyle: CSSProperties = {
    background: donutBackground(data),
  };

  return (
    <Card>
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-bold text-navy">
          {title}
        </h2>

        <p className="mt-1 text-[12.5px] leading-5 text-ink-3">
          {subtitle}
        </p>
      </div>

      <CardBody>
        <div className="grid min-h-[240px] items-center gap-7 sm:grid-cols-[170px_minmax(0,1fr)]">
          <div className="relative mx-auto h-40 w-40">
            <div
              className="absolute inset-0 rounded-full"
              style={donutStyle}
            />

            <div className="absolute inset-[25px] grid place-items-center rounded-full bg-white text-center shadow-inner">
              <div>
                <div className="rb-numerals text-[28px] font-black leading-none text-navy">
                  {total.toLocaleString()}
                </div>

                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
                  Total
                </div>
              </div>
            </div>
          </div>

          {data.length === 0 ? (
            <div className="text-center text-[13px] text-ink-3 sm:text-left">
              No report data is available for
              this period.
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item) => {
                const percentage =
                  total > 0
                    ? Math.round(
                        (item.value / total) *
                          100
                      )
                    : 0;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <div className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-2">
                      {item.label}
                    </div>

                    <div className="rb-numerals text-[12px] font-bold text-navy">
                      {item.value}{" "}
                      <span className="font-medium text-ink-3">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function ActivityChart({
  data,
}: {
  data: ActivityDatum[];
}) {
  const maximum = Math.max(
    ...data.map((item) => item.value),
    0
  );

  return (
    <Card>
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-bold text-navy">
          Coordination activity
        </h2>

        <p className="mt-1 text-[12.5px] leading-5 text-ink-3">
          Survivors, cases, referrals, and unmet
          needs added during the last six months.
        </p>
      </div>

      <CardBody>
        <div className="flex h-[245px] items-end gap-3 border-b border-line px-2 pb-8 pt-6 sm:gap-5">
          {data.map((item) => {
            const height =
              maximum > 0
                ? Math.max(
                    (item.value / maximum) *
                      160,
                    item.value > 0 ? 8 : 2
                  )
                : 2;

            return (
              <div
                key={item.key}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div className="rb-numerals mb-2 text-[11px] font-bold text-navy">
                  {item.value}
                </div>

                <div
                  className="w-full max-w-[64px] rounded-t-sm bg-blue transition-all"
                  style={{
                    height,
                  }}
                />

                <div className="absolute mt-[195px] text-[11px] font-semibold text-ink-3">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export default async function ReportsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
  }>;
}) {
  const parameters = await searchParams;

  const selectedRange = parseRange(
    parameters.range
  );

  const fromDate =
    rangeStart(selectedRange);

  const supabase =
    await createSupabaseServerClient();

  const profile = await requireProfile();

  const organizationId =
    profile.organization_id;

  let survivors: BaseRow[] = [];
  let recoveryCases: BaseRow[] = [];
  let referrals: ReferralRow[] = [];
  let unmetNeeds: UnmetNeedRow[] = [];

  const loadingErrors: string[] = [];

  if (organizationId) {
    let survivorsQuery = supabase
      .from("survivors")
      .select("id, status, created_at")
      .eq(
        "organization_id",
        organizationId
      );

    let casesQuery = supabase
      .from("recovery_cases")
      .select("id, status, created_at")
      .eq(
        "organization_id",
        organizationId
      );

    let referralsQuery = supabase
      .from("referrals")
      .select(
        "id, status, category, created_at, sending_org, receiving_org"
      )
      .or(
        `sending_org.eq.${organizationId},receiving_org.eq.${organizationId}`
      );

    let needsQuery = supabase
      .from("unmet_needs")
      .select(
        "id, status, category, created_at"
      )
      .eq(
        "organization_id",
        organizationId
      );

    if (fromDate) {
      survivorsQuery =
        survivorsQuery.gte(
          "created_at",
          fromDate
        );

      casesQuery = casesQuery.gte(
        "created_at",
        fromDate
      );

      referralsQuery =
        referralsQuery.gte(
          "created_at",
          fromDate
        );

      needsQuery = needsQuery.gte(
        "created_at",
        fromDate
      );
    }

    const [
      survivorsResult,
      casesResult,
      referralsResult,
      needsResult,
    ] = await Promise.all([
      survivorsQuery,
      casesQuery,
      referralsQuery,
      needsQuery,
    ]);

    survivors =
      ((survivorsResult.data ??
        []) as unknown) as BaseRow[];

    recoveryCases =
      ((casesResult.data ??
        []) as unknown) as BaseRow[];

    referrals =
      ((referralsResult.data ??
        []) as unknown) as ReferralRow[];

    unmetNeeds =
      ((needsResult.data ??
        []) as unknown) as UnmetNeedRow[];

    for (const result of [
      survivorsResult,
      casesResult,
      referralsResult,
      needsResult,
    ]) {
      if (result.error) {
        loadingErrors.push(
          result.error.message
        );
      }
    }
  } else {
    loadingErrors.push(
      "Your account is not assigned to an organization."
    );
  }

  const closedCaseCount =
    recoveryCases.filter((row) =>
      isClosedCase(row.status)
    ).length;

  const openCaseCount = Math.max(
    recoveryCases.length -
      closedCaseCount,
    0
  );

  const completedReferralCount =
    referrals.filter((row) =>
      isCompletedReferral(row.status)
    ).length;

  const pendingReferralCount =
    referrals.filter((row) =>
      isPendingReferral(row.status)
    ).length;

  const openNeedCount =
    unmetNeeds.filter((row) =>
      isOpenNeed(row.status)
    ).length;

  const caseClosureRate =
    recoveryCases.length > 0
      ? Math.round(
          (closedCaseCount /
            recoveryCases.length) *
            100
        )
      : 0;

  const referralCompletionRate =
    referrals.length > 0
      ? Math.round(
          (completedReferralCount /
            referrals.length) *
            100
        )
      : 0;

  const caseStatusData = chartData(
    groupRows(
      recoveryCases,
      (row) => row.status
    )
  );

  const referralStatusData = chartData(
    groupRows(
      referrals,
      (row) => row.status
    )
  );

  const needCategoryData = chartData(
    groupRows(
      unmetNeeds,
      (row) => row.category
    )
  );

  const workloadData: ChartDatum[] = [
    {
      label: "Open cases",
      value: openCaseCount,
      color: CHART_COLORS[0],
    },
    {
      label: "Pending referrals",
      value: pendingReferralCount,
      color: CHART_COLORS[1],
    },
    {
      label: "Open unmet needs",
      value: openNeedCount,
      color: CHART_COLORS[2],
    },
  ].filter((item) => item.value > 0);

  const combinedActivityRows: BaseRow[] = [
    ...survivors,
    ...recoveryCases,
    ...referrals,
    ...unmetNeeds,
  ];

  const activityData =
    buildActivityData(
      combinedActivityRows
    );

  const recentActivityCount =
    combinedActivityRows.length;

  const reports: ReportCard[] = [
    {
      href: "/app/reports/open-cases",
      title: "Open recovery cases",
      blurb:
        "Active workload by priority, status, and disaster event.",
      icon: Icons.Cases,
      band: "Operations",
      value: openCaseCount,
      valueLabel:
        openCaseCount === 1
          ? "open case"
          : "open cases",
      secondary:
        `${recoveryCases.length.toLocaleString()} total recovery ${
          recoveryCases.length === 1
            ? "case"
            : "cases"
        }`,
    },
    {
      href: "/app/reports/closed-cases",
      title: "Closed cases",
      blurb:
        "Outcomes and time-to-close across resolved recovery cases.",
      icon: Icons.CircleCheck,
      band: "Outcomes",
      value: closedCaseCount,
      valueLabel:
        closedCaseCount === 1
          ? "closed case"
          : "closed cases",
      secondary:
        `${caseClosureRate}% closure rate`,
    },
    {
      href:
        "/app/reports/referral-outcomes",
      title: "Referral outcomes",
      blurb:
        "Acceptance, response, and completed handoffs across partners.",
      icon: Icons.Referrals,
      band: "Network",
      value: referrals.length,
      valueLabel:
        referrals.length === 1
          ? "tracked referral"
          : "tracked referrals",
      secondary:
        `${referralCompletionRate}% completed`,
    },
    {
      href: "/app/reports/unmet-needs",
      title: "Unmet needs dashboard",
      blurb:
        "Distribution and aging of open needs across categories.",
      icon: Icons.Needs,
      band: "Needs",
      value: openNeedCount,
      valueLabel:
        openNeedCount === 1
          ? "open unmet need"
          : "open unmet needs",
      secondary:
        "Requires continued coordination",
    },
    {
      href:
        "/app/reports/org-activity",
      title: "Organization activity",
      blurb:
        "Cases, referrals, survivors, and needs activity over time.",
      icon: Icons.Reports,
      band: "Activity",
      value: recentActivityCount,
      valueLabel:
        recentActivityCount === 1
          ? "activity record"
          : "activity records",
      secondary:
        selectedRangeLabel(
          selectedRange
        ),
    },
  ];

  const exportHref =
    `/app/reports/export?range=${selectedRange}`;

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Organization analytics, visual recovery trends, and funder-ready Excel exports."
        breadcrumbs={[
          {
            label: "Insights",
            href: "/app",
          },
          {
            label: "Reports",
          },
        ]}
        actions={
          <a
            href={exportHref}
            aria-label="Download organization report as an Excel workbook"
            className="group inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md border border-[#D89400] bg-gold px-5 py-3 text-[14px] font-extrabold shadow-[0_8px_20px_rgba(8,42,74,0.18)] transition hover:-translate-y-0.5 hover:bg-[#F2AD00] hover:no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30 sm:w-auto"
            style={{
              color: "#082A4A",
            }}
          >
            <DownloadIcon className="h-5 w-5 shrink-0 text-[#082A4A]" />

            <span className="whitespace-nowrap">
              Download Excel report
            </span>

            <span className="rounded-sm bg-navy/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-navy">
              XLSX
            </span>
          </a>
        }
      />

      <div className="space-y-7 px-6 py-8 md:px-10">
        <Card>
          <CardBody>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.13em] text-blue">
                  Reporting period
                </div>

                <h2 className="mt-2 text-[20px] font-bold text-navy">
                  {selectedRangeLabel(
                    selectedRange
                  )}
                </h2>

                <p className="mt-1 text-[13px] leading-5 text-ink-3">
                  Dashboard metrics and the Excel
                  workbook use the same selected
                  period.
                </p>
              </div>

              <form
                action="/app/reports"
                method="get"
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
              >
                <div>
                  <label
                    htmlFor="range"
                    className="mb-2 block text-[12.5px] font-bold text-navy"
                  >
                    Date range
                  </label>

                  <select
                    id="range"
                    name="range"
                    defaultValue={
                      selectedRange
                    }
                    className="h-11 min-w-[210px] rounded-sm border border-line bg-white px-3.5 text-[14px] text-ink outline-none focus:border-blue focus:ring-2 focus:ring-blue/10"
                  >
                    {REPORT_RANGES.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-blue px-4 text-[13.5px] font-bold text-white hover:bg-navy-light"
                >
                  <Icons.Filter className="h-4 w-4" />
                  Apply
                </button>
              </form>
            </div>
          </CardBody>
        </Card>

        {loadingErrors.length > 0 && (
          <div className="rounded-md border border-red/20 bg-red/5 px-5 py-4 text-[13px] leading-6 text-red">
            Some reporting data could not be
            loaded:{" "}
            {Array.from(
              new Set(loadingErrors)
            ).join(" ")}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Survivors added"
            value={survivors.length}
            hint={
              selectedRange === "all"
                ? "All survivors in your organization"
                : `Added during the ${selectedRangeLabel(
                    selectedRange
                  ).toLowerCase()}`
            }
          />

          <KpiCard
            label="Open recovery cases"
            value={openCaseCount}
            hint={`${closedCaseCount.toLocaleString()} closed during this reporting scope`}
          />

          <KpiCard
            label="Pending referrals"
            value={pendingReferralCount}
            hint={`${completedReferralCount.toLocaleString()} completed handoffs`}
          />

          <KpiCard
            label="Open unmet needs"
            value={openNeedCount}
            hint="Needs still requiring coordination"
          />

          <KpiCard
            label="Case closure rate"
            value={caseClosureRate}
            suffix="%"
            hint="Closed or resolved recovery cases"
          />

          <KpiCard
            label="Referral completion"
            value={referralCompletionRate}
            suffix="%"
            hint="Completed partner handoffs"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <HorizontalBarChart
            title="Recovery cases by status"
            subtitle="Current distribution of recovery-case statuses in the selected period."
            data={caseStatusData}
          />

          <DonutChart
            title="Open workload distribution"
            subtitle="Cases, referrals, and unmet needs currently requiring action."
            data={workloadData}
          />

          <HorizontalBarChart
            title="Referral outcomes"
            subtitle="Partner referral volume grouped by current status."
            data={referralStatusData}
          />

          <DonutChart
            title="Unmet needs by category"
            subtitle="Service categories represented in your organization’s unmet-needs records."
            data={needCategoryData}
          />
        </section>

        <ActivityChart
          data={activityData}
        />

        <section>
          <div className="mb-5">
            <div className="text-[12px] font-bold uppercase tracking-[0.13em] text-blue">
              Detailed reports
            </div>

            <h2 className="mt-2 text-[24px] font-bold tracking-tight text-navy">
              Open a focused operational report
            </h2>

            <p className="mt-2 text-[14px] leading-6 text-ink-2">
              Review case, referral, unmet-needs,
              and organization activity in more
              detail.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => {
              const ReportIcon =
                report.icon;

              return (
                <Link
                  key={report.href}
                  href={report.href}
                  className="group block hover:no-underline"
                >
                  <Card className="h-full transition group-hover:border-blue group-hover:shadow-md">
                    <CardBody>
                      <div className="flex items-start justify-between">
                        <span className="grid h-11 w-11 place-items-center rounded-sm bg-blue-soft text-navy">
                          <ReportIcon className="h-5 w-5" />
                        </span>

                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">
                          {report.band}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end gap-2">
                        <div className="rb-numerals text-[36px] font-black leading-none tracking-tight text-navy">
                          {report.value.toLocaleString()}
                        </div>

                        <div className="pb-1 text-[12.5px] font-semibold text-ink-3">
                          {report.valueLabel}
                        </div>
                      </div>

                      <div className="mt-4 text-[16px] font-bold tracking-tight text-navy group-hover:text-blue">
                        {report.title}
                      </div>

                      <p className="mt-2 text-[13.5px] leading-5 text-ink-2">
                        {report.blurb}
                      </p>

                      <div className="mt-3 rounded-sm border border-line bg-surface-2 px-3 py-2 text-[12.5px] font-semibold text-ink-2">
                        {report.secondary}
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue">
                        Open report

                        <Icons.ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}