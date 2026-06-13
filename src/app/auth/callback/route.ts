import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ensureOrgForCurrentUser } from "@/lib/auth-helpers";

/**
 * Email link / OAuth callback.
 * Exchanges the `?code=` for a Supabase session, then redirects to `next`.
 * For signup links the user lands in /app; for recovery they land in /reset-password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") || "/app";
  const next = nextParam.startsWith("/") ? nextParam : "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureOrgForCurrentUser();
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
