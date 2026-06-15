"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireProfile } from "@/lib/session";

const PLATFORM_ORGANIZATION_ID =
  "9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142";

const DEMO_REQUEST_STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Demo Scheduled",
  "Closed",
] as const;

type DemoRequestStatus =
  (typeof DEMO_REQUEST_STATUSES)[number];

type CurrentRequest = {
  contacted_at: string | null;
};

function readString(
  value: FormDataEntryValue | null
): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidStatus(
  value: string
): value is DemoRequestStatus {
  return DEMO_REQUEST_STATUSES.includes(
    value as DemoRequestStatus
  );
}

function errorRedirect(
  requestId: string,
  message: string
): never {
  redirect(
    `/app/demo-requests/${requestId}?error=${encodeURIComponent(
      message
    )}`
  );
}

export async function updateDemoRequestAction(
  formData: FormData
): Promise<void> {
  const profile = await requireProfile();

  const role =
    typeof profile.role === "string"
      ? profile.role.trim().toLowerCase()
      : "";

  const isPlatformAdmin =
    profile.organization_id === PLATFORM_ORGANIZATION_ID &&
    (role === "owner" || role === "admin");

  if (!isPlatformAdmin) {
    redirect("/app");
  }

  const requestId = readString(
    formData.get("request_id")
  );

  const status = readString(formData.get("status"));

  const internalNotes = readString(
    formData.get("internal_notes")
  );

  if (!requestId) {
    redirect("/app/demo-requests");
  }

  if (!isValidStatus(status)) {
    errorRedirect(
      requestId,
      "Select a valid demo-request status."
    );
  }

  if (internalNotes.length > 5000) {
    errorRedirect(
      requestId,
      "Internal notes must be 5,000 characters or fewer."
    );
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: currentData,
    error: currentError,
  } = await supabase
    .from("demo_requests")
    .select("contacted_at")
    .eq("id", requestId)
    .maybeSingle();

  if (currentError || !currentData) {
    console.error(
      "Could not load the demo request before updating:",
      currentError
    );

    errorRedirect(
      requestId,
      "The demo request could not be loaded."
    );
  }

  const currentRequest =
    currentData as unknown as CurrentRequest;

  const updateValues: {
    status: DemoRequestStatus;
    internal_notes: string | null;
    contacted_at?: string;
  } = {
    status,
    internal_notes: internalNotes || null,
  };

  if (
    status !== "New" &&
    !currentRequest.contacted_at
  ) {
    updateValues.contacted_at =
      new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from("demo_requests")
    .update(updateValues)
    .eq("id", requestId);

  if (updateError) {
    console.error(
      "Could not update the ReliefBridge demo request:",
      updateError
    );

    errorRedirect(
      requestId,
      "The request could not be updated. Please try again."
    );
  }

  revalidatePath("/app/demo-requests");
  revalidatePath(`/app/demo-requests/${requestId}`);

  redirect(
    `/app/demo-requests/${requestId}?saved=1`
  );
}