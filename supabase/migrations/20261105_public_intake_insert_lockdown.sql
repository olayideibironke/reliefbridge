-- STAGED ONLY. Do not apply until both public form actions use a reviewed
-- server-only intake boundary, and full-schema staging tests have passed.
--
-- A public INSERT policy on demo_requests currently allows callers to bypass
-- form validation, honeypots, and any Next.js-only rate limiter by calling the
-- Supabase Data API directly. RLS INSERT policies do not replace SQL privileges.
--
-- This migration intentionally removes direct INSERT from browser-facing roles.
-- Do not remove the existing SELECT/UPDATE privileges used by authorized
-- platform management workflows. Server-side intake must use a narrowly scoped
-- privileged path with atomic, durable abuse checks before this is released.
--
-- IMPORTANT: This migration is a security boundary, NOT a complete rate limiter.
-- Do not enable it until the replacement intake path is deployed and tested
-- in staging. A premature application would block legitimate demo/quote forms.

-- The live schema lacks service_role INSERT; provide only the minimum needed
-- by the server-side INSERT without .select(). Do not grant SELECT or UPDATE.
grant insert on table public.demo_requests to service_role;

revoke insert on table public.demo_requests from anon;
revoke insert on table public.demo_requests from authenticated;
revoke insert on table public.demo_requests from public;

-- Assert that neither browser-facing role inherits table-level INSERT.
-- This checks effective privileges, not merely explicit GRANT statements.
do $intake_privilege_check$
begin
  if not pg_catalog.has_table_privilege('service_role', 'public.demo_requests', 'INSERT') then
    raise exception 'Server-only intake role lacks required INSERT privilege';
  end if;
  if pg_catalog.has_table_privilege('anon', 'public.demo_requests', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.demo_requests', 'INSERT')
  then
    raise exception
      'Public intake INSERT privilege remains available; review role inheritance and grants';
  end if;
end
$intake_privilege_check$;
