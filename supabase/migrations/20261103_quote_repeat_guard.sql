-- Quote-only duplicate-submission cooldown. Staged, not applied to production.
-- This is not IP-based rate limiting; edge-level abuse controls remain a release gate.
create or replace function public.guard_repeated_quote_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $guard$
declare
  normalized_email text;
  normalized_org text;
begin
  if left(coalesce(new.message, ''), 13) <> 'QUOTE REQUEST' then
    return new;
  end if;
  normalized_email := lower(btrim(new.work_email));
  normalized_org := lower(btrim(new.organization_name));
  -- Serialize requests for the same email + organization to prevent races.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(normalized_email || ':' || normalized_org, 0)
  );
  if exists (
    select 1 from public.demo_requests d
    where lower(btrim(d.work_email)) = normalized_email
      and lower(btrim(d.organization_name)) = normalized_org
      and left(coalesce(d.message, ''), 13) = 'QUOTE REQUEST'
      and d.created_at >= pg_catalog.now() - interval '10 minutes'
  ) then
    raise exception 'A recent quote request has already been received'
      using errcode = 'RB001';
  end if;
  return new;
end
$guard$;

drop trigger if exists quote_request_repeat_guard on public.demo_requests;
create trigger quote_request_repeat_guard
before insert on public.demo_requests
for each row execute function public.guard_repeated_quote_request();

revoke all on function public.guard_repeated_quote_request() from public, anon, authenticated;
