import ExcelJS from "exceljs";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPORT_RANGES = ["30", "90", "365", "all"] as const;

type ReportRange = (typeof REPORT_RANGES)[number];

type SurvivorRow = {
  id: string;
  first_name: string;
  last_name: string;
  status: string | null;
  disaster_event: string | null;
  state: string | null;
  county: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type RecoveryCaseRow = {
  id: string;
  survivor_id: string | null;
  status: string | null;
  created_at: string;
};

type ReferralRow = {
  id: string;
  survivor_id: string | null;
  sending_org: string;
  receiving_org: string;
  category: string | null;
  status: string | null;
  created_at: string;
};

type UnmetNeedRow = {
  id: string;
  survivor_id: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
};

type OrganizationRow = {
  id: string;
  name: string;
};

type SurvivorNameRow = {
  id: string;
  first_name: string;
  last_name: string;
};

const COLORS = {
  navy: "FF12365A",
  navyDark: "FF082A4A",
  blue: "FF0B6EAD",
  blueSoft: "FFE4F2FC",
  gold: "FFFFB81C",
  green: "FF2E7D32",
  greenSoft: "FFE8F5E9",
  red: "FFC62828",
  redSoft: "FFFFEBEE",
  gray: "FF657789",
  line: "FFD8E1E8",
  surface: "FFF5F8FA",
  white: "FFFFFFFF",
};

function parseRange(value: string | null): ReportRange {
  return REPORT_RANGES.includes(value as ReportRange)
    ? (value as ReportRange)
    : "90";
}

function rangeStart(range: ReportRange): string | null {
  if (range === "all") {
    return null;
  }

  const days = Number(range);
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days + 1);

  return date.toISOString();
}

function rangeLabel(range: ReportRange): string {
  switch (range) {
    case "30":
      return "Last 30 days";

    case "90":
      return "Last 90 days";

    case "365":
      return "Last 12 months";

    case "all":
      return "All available records";
  }
}

function normalizeStatus(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function isClosedCase(status: string | null): boolean {
  const normalized = normalizeStatus(status);

  return (
    normalized === "closed" ||
    normalized === "completed" ||
    normalized === "resolved"
  );
}

function isCompletedReferral(status: string | null): boolean {
  const normalized = normalizeStatus(status);

  return (
    normalized === "completed" ||
    normalized === "closed"
  );
}

function isPendingReferral(status: string | null): boolean {
  const normalized = normalizeStatus(status);

  return ![
    "completed",
    "closed",
    "declined",
    "cancelled",
    "canceled",
  ].includes(normalized);
}

function isOpenNeed(status: string | null): boolean {
  const normalized = normalizeStatus(status);

  return ![
    "closed",
    "completed",
    "resolved",
    "met",
  ].includes(normalized);
}

function safeDate(value: string): Date | null {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function survivorFullName(
  row:
    | SurvivorRow
    | SurvivorNameRow
    | undefined
): string {
  if (!row) {
    return "Unknown survivor";
  }

  return `${row.first_name} ${row.last_name}`.trim();
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "organization";
}

function statusStyle(status: string | null): {
  fill: string;
  font: string;
} {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("completed") ||
    normalized.includes("closed") ||
    normalized.includes("resolved") ||
    normalized === "met"
  ) {
    return {
      fill: COLORS.greenSoft,
      font: COLORS.green,
    };
  }

  if (
    normalized.includes("declined") ||
    normalized.includes("cancel")
  ) {
    return {
      fill: COLORS.redSoft,
      font: COLORS.red,
    };
  }

  if (
    normalized.includes("new") ||
    normalized.includes("open") ||
    normalized.includes("pending")
  ) {
    return {
      fill: COLORS.blueSoft,
      font: COLORS.blue,
    };
  }

  return {
    fill: COLORS.surface,
    font: COLORS.navy,
  };
}

function styleHeader(
  worksheet: ExcelJS.Worksheet,
  columnCount: number
): void {
  const header = worksheet.getRow(1);

  header.height = 28;

  for (let column = 1; column <= columnCount; column += 1) {
    const cell = header.getCell(column);

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: COLORS.navy,
      },
    };

    cell.font = {
      bold: true,
      color: {
        argb: COLORS.white,
      },
      size: 11,
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    cell.border = {
      bottom: {
        style: "thin",
        color: {
          argb: COLORS.gold,
        },
      },
    };
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  worksheet.autoFilter = {
    from: {
      row: 1,
      column: 1,
    },
    to: {
      row: 1,
      column: columnCount,
    },
  };
}

function styleBody(
  worksheet: ExcelJS.Worksheet
): void {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    row.height = 22;

    row.eachCell((cell) => {
      cell.font = {
        color: {
          argb: COLORS.navyDark,
        },
        size: 10,
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };

      cell.border = {
        bottom: {
          style: "hair",
          color: {
            argb: COLORS.line,
          },
        },
      };

      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: COLORS.surface,
          },
        };
      }
    });
  });
}

function styleStatusColumn(
  worksheet: ExcelJS.Worksheet,
  columnNumber: number
): void {
  worksheet
    .getColumn(columnNumber)
    .eachCell((cell, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const value =
        typeof cell.value === "string"
          ? cell.value
          : null;

      const style = statusStyle(value);

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: style.fill,
        },
      };

      cell.font = {
        bold: true,
        color: {
          argb: style.font,
        },
        size: 10,
      };
    });
}

function styleDateColumn(
  worksheet: ExcelJS.Worksheet,
  columnNumber: number
): void {
  worksheet.getColumn(columnNumber).numFmt =
    "mmm d, yyyy h:mm AM/PM";
}

function addSummarySheet({
  workbook,
  organizationName,
  range,
  survivorCount,
  openCaseCount,
  closedCaseCount,
  pendingReferralCount,
  completedReferralCount,
  openNeedCount,
}: {
  workbook: ExcelJS.Workbook;
  organizationName: string;
  range: ReportRange;
  survivorCount: number;
  openCaseCount: number;
  closedCaseCount: number;
  pendingReferralCount: number;
  completedReferralCount: number;
  openNeedCount: number;
}): void {
  const worksheet =
    workbook.addWorksheet("Summary", {
      views: [
        {
          showGridLines: false,
        },
      ],
    });

  worksheet.columns = [
    { width: 27 },
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];

  worksheet.mergeCells("A1:F1");
  worksheet.getCell("A1").value =
    "ReliefBridge Organization Report";

  worksheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.navy,
    },
  };

  worksheet.getCell("A1").font = {
    bold: true,
    size: 22,
    color: {
      argb: COLORS.white,
    },
  };

  worksheet.getCell("A1").alignment = {
    vertical: "middle",
  };

  worksheet.getRow(1).height = 42;

  worksheet.mergeCells("A2:F2");
  worksheet.getCell("A2").value =
    "Disaster Recovery Coordination";

  worksheet.getCell("A2").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.navyDark,
    },
  };

  worksheet.getCell("A2").font = {
    bold: true,
    size: 11,
    color: {
      argb: COLORS.gold,
    },
  };

  worksheet.getRow(2).height = 25;

  worksheet.getCell("A4").value = "Organization";
  worksheet.getCell("B4").value = organizationName;

  worksheet.getCell("A5").value = "Reporting period";
  worksheet.getCell("B5").value = rangeLabel(range);

  worksheet.getCell("A6").value = "Generated";
  worksheet.getCell("B6").value = new Date();
  worksheet.getCell("B6").numFmt =
    "mmm d, yyyy h:mm AM/PM";

  for (const cellAddress of ["A4", "A5", "A6"]) {
    worksheet.getCell(cellAddress).font = {
      bold: true,
      color: {
        argb: COLORS.gray,
      },
    };
  }

  worksheet.mergeCells("A8:F8");
  worksheet.getCell("A8").value =
    "Operational Summary";

  worksheet.getCell("A8").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: COLORS.blueSoft,
    },
  };

  worksheet.getCell("A8").font = {
    bold: true,
    size: 14,
    color: {
      argb: COLORS.navy,
    },
  };

  worksheet.getRow(8).height = 28;

  const metrics = [
    ["Survivors", survivorCount],
    ["Open recovery cases", openCaseCount],
    ["Closed recovery cases", closedCaseCount],
    ["Pending referrals", pendingReferralCount],
    ["Completed referrals", completedReferralCount],
    ["Open unmet needs", openNeedCount],
  ];

  metrics.forEach(([label, value], index) => {
    const rowNumber = 10 + index;

    worksheet.getCell(`A${rowNumber}`).value =
      label;

    worksheet.getCell(`B${rowNumber}`).value =
      value;

    worksheet.getCell(`A${rowNumber}`).font = {
      bold: true,
      color: {
        argb: COLORS.navy,
      },
    };

    worksheet.getCell(`B${rowNumber}`).font = {
      bold: true,
      size: 16,
      color: {
        argb: COLORS.blue,
      },
    };

    worksheet.getCell(`A${rowNumber}`).border = {
      bottom: {
        style: "thin",
        color: {
          argb: COLORS.line,
        },
      },
    };

    worksheet.getCell(`B${rowNumber}`).border = {
      bottom: {
        style: "thin",
        color: {
          argb: COLORS.line,
        },
      },
    };
  });

  worksheet.mergeCells("D10:F10");
  worksheet.getCell("D10").value =
    "Workbook sections";

  worksheet.getCell("D10").font = {
    bold: true,
    color: {
      argb: COLORS.navy,
    },
  };

  const sheetLinks = [
    ["Survivors", "Survivors"],
    ["Recovery Cases", "Recovery Cases"],
    ["Referrals", "Referrals"],
    ["Unmet Needs", "Unmet Needs"],
  ];

  sheetLinks.forEach(([label, sheetName], index) => {
    const rowNumber = 11 + index;

    worksheet.mergeCells(
      `D${rowNumber}:F${rowNumber}`
    );

    worksheet.getCell(`D${rowNumber}`).value = {
      text: label,
      hyperlink: `#'${sheetName}'!A1`,
    };

    worksheet.getCell(`D${rowNumber}`).font = {
      bold: true,
      color: {
        argb: COLORS.blue,
      },
      underline: true,
    };
  });

  worksheet.mergeCells("A19:F19");
  worksheet.getCell("A19").value =
    "This workbook contains only records available to the signed-in ReliefBridge organization under its database access policies.";

  worksheet.getCell("A19").font = {
    italic: true,
    size: 10,
    color: {
      argb: COLORS.gray,
    },
  };

  worksheet.getCell("A19").alignment = {
    wrapText: true,
    vertical: "middle",
  };

  worksheet.getRow(19).height = 36;
}

export async function GET(
  request: Request
): Promise<Response> {
  const profile = await requireProfile();
  const organizationId = profile.organization_id;

  if (!organizationId) {
    return new Response(
      "Your account is not assigned to an organization.",
      {
        status: 400,
      }
    );
  }

  const requestUrl = new URL(request.url);
  const selectedRange = parseRange(
    requestUrl.searchParams.get("range")
  );

  const fromDate = rangeStart(selectedRange);
  const supabase =
    await createSupabaseServerClient();

  let survivorsQuery = supabase
    .from("survivors")
    .select(
      "id, first_name, last_name, status, disaster_event, state, county, email, phone, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  let casesQuery = supabase
    .from("recovery_cases")
    .select(
      "id, survivor_id, status, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  let referralsQuery = supabase
    .from("referrals")
    .select(
      "id, survivor_id, sending_org, receiving_org, category, status, created_at"
    )
    .or(
      `sending_org.eq.${organizationId},receiving_org.eq.${organizationId}`
    )
    .order("created_at", {
      ascending: false,
    });

  let needsQuery = supabase
    .from("unmet_needs")
    .select(
      "id, survivor_id, category, status, created_at"
    )
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  if (fromDate) {
    survivorsQuery = survivorsQuery.gte(
      "created_at",
      fromDate
    );

    casesQuery = casesQuery.gte(
      "created_at",
      fromDate
    );

    referralsQuery = referralsQuery.gte(
      "created_at",
      fromDate
    );

    needsQuery = needsQuery.gte(
      "created_at",
      fromDate
    );
  }

  const [
    organizationResult,
    survivorsResult,
    casesResult,
    referralsResult,
    needsResult,
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle(),

    survivorsQuery,
    casesQuery,
    referralsQuery,
    needsQuery,
  ]);

  const firstError =
    organizationResult.error ??
    survivorsResult.error ??
    casesResult.error ??
    referralsResult.error ??
    needsResult.error;

  if (firstError) {
    console.error(
      "ReliefBridge report export failed:",
      firstError
    );

    return new Response(
      "The report data could not be loaded.",
      {
        status: 500,
      }
    );
  }

  const organization =
    organizationResult.data as
      | OrganizationRow
      | null;

  const organizationName =
    organization?.name ??
    "ReliefBridge Organization";

  const survivors =
    ((survivorsResult.data ?? []) as unknown) as SurvivorRow[];

  const recoveryCases =
    ((casesResult.data ?? []) as unknown) as RecoveryCaseRow[];

  const referrals =
    ((referralsResult.data ?? []) as unknown) as ReferralRow[];

  const unmetNeeds =
    ((needsResult.data ?? []) as unknown) as UnmetNeedRow[];

  const referencedSurvivorIds = Array.from(
    new Set(
      [
        ...recoveryCases.map(
          (row) => row.survivor_id
        ),
        ...referrals.map(
          (row) => row.survivor_id
        ),
        ...unmetNeeds.map(
          (row) => row.survivor_id
        ),
      ].filter(
        (value): value is string =>
          typeof value === "string" &&
          value.length > 0
      )
    )
  );

  let referencedSurvivors: SurvivorNameRow[] =
    [];

  if (referencedSurvivorIds.length > 0) {
    const { data, error } = await supabase
      .from("survivors")
      .select(
        "id, first_name, last_name"
      )
      .in("id", referencedSurvivorIds);

    if (error) {
      console.error(
        "Could not load survivor names for report export:",
        error
      );
    } else {
      referencedSurvivors =
        ((data ?? []) as unknown) as SurvivorNameRow[];
    }
  }

  const survivorNameMap = new Map<
    string,
    SurvivorNameRow
  >();

  for (const survivor of survivors) {
    survivorNameMap.set(survivor.id, survivor);
  }

  for (const survivor of referencedSurvivors) {
    survivorNameMap.set(survivor.id, survivor);
  }

  const partnerOrganizationIds = Array.from(
    new Set(
      referrals
        .flatMap((referral) => [
          referral.sending_org,
          referral.receiving_org,
        ])
        .filter(
          (value) =>
            value &&
            value !== organizationId
        )
    )
  );

  const partnerNameMap = new Map<
    string,
    string
  >();

  if (partnerOrganizationIds.length > 0) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .in("id", partnerOrganizationIds);

    if (error) {
      console.error(
        "Could not load partner names for report export:",
        error
      );
    } else {
      const organizations =
        ((data ?? []) as unknown) as OrganizationRow[];

      for (const partner of organizations) {
        partnerNameMap.set(
          partner.id,
          partner.name
        );
      }
    }
  }

  const openCaseCount =
    recoveryCases.filter(
      (row) => !isClosedCase(row.status)
    ).length;

  const closedCaseCount =
    recoveryCases.length - openCaseCount;

  const pendingReferralCount =
    referrals.filter((row) =>
      isPendingReferral(row.status)
    ).length;

  const completedReferralCount =
    referrals.filter((row) =>
      isCompletedReferral(row.status)
    ).length;

  const openNeedCount =
    unmetNeeds.filter((row) =>
      isOpenNeed(row.status)
    ).length;

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "ReliefBridge";
  workbook.lastModifiedBy = "ReliefBridge";
  workbook.company = "Westforge Holdings";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject =
    "Disaster recovery coordination report";
  workbook.title = `${organizationName} ReliefBridge Report`;

  addSummarySheet({
    workbook,
    organizationName,
    range: selectedRange,
    survivorCount: survivors.length,
    openCaseCount,
    closedCaseCount,
    pendingReferralCount,
    completedReferralCount,
    openNeedCount,
  });

  const survivorSheet =
    workbook.addWorksheet("Survivors");

  survivorSheet.columns = [
    {
      header: "Survivor ID",
      key: "id",
      width: 38,
    },
    {
      header: "Survivor",
      key: "name",
      width: 25,
    },
    {
      header: "Status",
      key: "status",
      width: 18,
    },
    {
      header: "Disaster Event",
      key: "disaster_event",
      width: 28,
    },
    {
      header: "County",
      key: "county",
      width: 20,
    },
    {
      header: "State",
      key: "state",
      width: 10,
    },
    {
      header: "Email",
      key: "email",
      width: 30,
    },
    {
      header: "Phone",
      key: "phone",
      width: 18,
    },
    {
      header: "Added",
      key: "created_at",
      width: 22,
    },
  ];

  for (const survivor of survivors) {
    survivorSheet.addRow({
      id: survivor.id,
      name: survivorFullName(survivor),
      status:
        survivor.status ?? "Not specified",
      disaster_event:
        survivor.disaster_event ?? "",
      county: survivor.county ?? "",
      state: survivor.state ?? "",
      email: survivor.email ?? "",
      phone: survivor.phone ?? "",
      created_at:
        safeDate(survivor.created_at) ??
        survivor.created_at,
    });
  }

  styleHeader(survivorSheet, 9);
  styleBody(survivorSheet);
  styleStatusColumn(survivorSheet, 3);
  styleDateColumn(survivorSheet, 9);

  const caseSheet =
    workbook.addWorksheet("Recovery Cases");

  caseSheet.columns = [
    {
      header: "Case ID",
      key: "id",
      width: 38,
    },
    {
      header: "Survivor",
      key: "survivor",
      width: 25,
    },
    {
      header: "Status",
      key: "status",
      width: 18,
    },
    {
      header: "Created",
      key: "created_at",
      width: 22,
    },
  ];

  for (const recoveryCase of recoveryCases) {
    caseSheet.addRow({
      id: recoveryCase.id,
      survivor: recoveryCase.survivor_id
        ? survivorFullName(
            survivorNameMap.get(
              recoveryCase.survivor_id
            )
          )
        : "Not linked",
      status:
        recoveryCase.status ??
        "Not specified",
      created_at:
        safeDate(recoveryCase.created_at) ??
        recoveryCase.created_at,
    });
  }

  styleHeader(caseSheet, 4);
  styleBody(caseSheet);
  styleStatusColumn(caseSheet, 3);
  styleDateColumn(caseSheet, 4);

  const referralSheet =
    workbook.addWorksheet("Referrals");

  referralSheet.columns = [
    {
      header: "Referral ID",
      key: "id",
      width: 38,
    },
    {
      header: "Survivor",
      key: "survivor",
      width: 25,
    },
    {
      header: "Direction",
      key: "direction",
      width: 14,
    },
    {
      header: "Partner Organization",
      key: "partner",
      width: 28,
    },
    {
      header: "Category",
      key: "category",
      width: 22,
    },
    {
      header: "Status",
      key: "status",
      width: 18,
    },
    {
      header: "Created",
      key: "created_at",
      width: 22,
    },
  ];

  for (const referral of referrals) {
    const isOutgoing =
      referral.sending_org === organizationId;

    const isIncoming =
      referral.receiving_org === organizationId;

    const partnerId = isOutgoing
      ? referral.receiving_org
      : referral.sending_org;

    const direction =
      isOutgoing && isIncoming
        ? "Internal"
        : isOutgoing
          ? "Outgoing"
          : "Incoming";

    referralSheet.addRow({
      id: referral.id,
      survivor: referral.survivor_id
        ? survivorFullName(
            survivorNameMap.get(
              referral.survivor_id
            )
          )
        : "Not linked",
      direction,
      partner:
        partnerNameMap.get(partnerId) ??
        partnerId,
      category:
        referral.category ?? "Not specified",
      status:
        referral.status ?? "Not specified",
      created_at:
        safeDate(referral.created_at) ??
        referral.created_at,
    });
  }

  styleHeader(referralSheet, 7);
  styleBody(referralSheet);
  styleStatusColumn(referralSheet, 6);
  styleDateColumn(referralSheet, 7);

  const needSheet =
    workbook.addWorksheet("Unmet Needs");

  needSheet.columns = [
    {
      header: "Need ID",
      key: "id",
      width: 38,
    },
    {
      header: "Survivor",
      key: "survivor",
      width: 25,
    },
    {
      header: "Category",
      key: "category",
      width: 24,
    },
    {
      header: "Status",
      key: "status",
      width: 18,
    },
    {
      header: "Created",
      key: "created_at",
      width: 22,
    },
  ];

  for (const need of unmetNeeds) {
    needSheet.addRow({
      id: need.id,
      survivor: need.survivor_id
        ? survivorFullName(
            survivorNameMap.get(
              need.survivor_id
            )
          )
        : "Not linked",
      category:
        need.category ?? "Not specified",
      status:
        need.status ?? "Not specified",
      created_at:
        safeDate(need.created_at) ??
        need.created_at,
    });
  }

  styleHeader(needSheet, 5);
  styleBody(needSheet);
  styleStatusColumn(needSheet, 4);
  styleDateColumn(needSheet, 5);

  const workbookBuffer =
    await workbook.xlsx.writeBuffer();

  const fileName =
    `ReliefBridge-${slugify(
      organizationName
    )}-${selectedRange}-day-report.xlsx`;

  return new Response(
    new Uint8Array(workbookBuffer),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="${fileName}"`,
        "Cache-Control":
          "private, no-store, max-age=0",
      },
    }
  );
}