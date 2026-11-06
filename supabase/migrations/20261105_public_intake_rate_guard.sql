-- STAGED ONLY: apply with the server-only public intake and INSERT lockdown.
-- Limits cover ordinary demos and quotes regardless of user-controlled message.
-- Advisory transaction lock serializes checks, preventing concurrent over-admission.
create or replace function public.guard_public_intake_volume()
returns trigger language plpgsql security definer set search_path = '' as $guard$
declare
  normalized_email text := lower(btrim(coalesce(new.work_email, '')));
  normalized_org text := lower(btrim(coalesce(new.organization_name, '')));
  recent_count bigint;
begin
  -- One transaction-wide lock for all public intake attempts. The fixed key
  -- protects global and per-identity counters against races across instances.
  perform pg_catalog.pg_advisory_xact_lock(9472031001);

  select count(*) into recent_count
  from public.demo_requests d
  where d.created_at >= pg_catalog.now() - interval '1 hour';
  if recent_count >= 120 then
    raise exception 'Public intake temporarily limited' using errcode = 'RB002';
  end if;

  select count(*) into recent_count
  from public.demo_requests d
  where lower(btrim(d.work_email)) = normalized_email
    and d.created_at >= pg_catalog.now() - interval '1 hour';
  if recent_count >= 3 then
    raise exception 'Public intake temporarily limited' using errcode = 'RB002';
  end if;

  select count(*) into recent_count
  from public.demo_requests d
  where lower(btrim(d.organization_name)) = normalized_org
    and d.created_at >= pg_catalog.now() - interval '1 hour';
  if recent_count >= 10 then
    raise exception 'Public intake temporarily limited' using errcode = 'RB002';
  end if;

  return new;
end
$guard$;

drop trigger if exists public_intake_volume_guard on public.demo_requests;
create trigger public_intake_volume_guard
before insert on public.demo_requests
for each row execute function public.guard_public_intake_volume();

revoke all on function public.guard_public_intake_volume() from public, anon, authenticated;
