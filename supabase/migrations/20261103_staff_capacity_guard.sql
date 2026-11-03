-- Opt-in staff-seat enforcement. No existing organization is enabled by default.
alter table public.organization_capacity_policies
  add column if not exists staff_limit integer check (staff_limit >= 1),
  add column if not exists enforce_staff_limit boolean not null default false;

alter table public.organization_capacity_policies
  add constraint staff_limit_required_when_enabled
  check (not enforce_staff_limit or staff_limit is not null);

create or replace function public.check_staff_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  cap integer;
  enabled boolean;
  active_count bigint;
begin
  if new.organization_id is null or new.access_status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.access_status = 'active'
     and old.organization_id is not distinct from new.organization_id then
    return new;
  end if;

  -- Serialize staff activations and transfers into the destination organization.
  perform 1 from public.organizations where id = new.organization_id for update;

  select staff_limit, enforce_staff_limit into cap, enabled
  from public.organization_capacity_policies
  where organization_id = new.organization_id;

  if not coalesce(enabled, false) then return new; end if;
  if cap is null then
    raise exception 'Staff limit is not configured';
  end if;

  select count(*) into active_count
  from public.profiles
  where organization_id = new.organization_id and access_status = 'active';

  if active_count >= cap then
    raise exception 'Organization active staff limit reached';
  end if;
  return new;
end;
$$;

revoke all on function public.check_staff_capacity() from public, anon, authenticated;
drop trigger if exists check_staff_capacity_trigger on public.profiles;
create trigger check_staff_capacity_trigger
before insert or update of access_status, organization_id on public.profiles
for each row execute function public.check_staff_capacity();
