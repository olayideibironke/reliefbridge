import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export async function submitWebsiteIntake(
  request: Record<string, string | null>
): Promise<"accepted" | "limited" | "unavailable"> {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .rpc("submit_website_intake", { request });

    if (error || typeof data !== "boolean") {
      console.error("ReliefBridge website intake could not persist the request.", error?.code);
      return "unavailable";
    }

    return data ? "accepted" : "limited";
  } catch {
    console.error("ReliefBridge website intake is unavailable.");
    return "unavailable";
  }
}
