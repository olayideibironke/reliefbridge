-- Opt-in case capacity guard. Existing organizations remain unaffected.
create or replace function public.check_case_capacity()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  cap integer;
  enabled boolean;
  active_count bigint;
begin
  if new.status = 'closed' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status <> 'closed'
       and old.organization_id is not distinct from new.organization_id then
      return new;
    end if;
  end if;

  -- Serialize creations, reopenings, and transfers into an organization.
  -- A transfer of an already-active case must also consume destination capacity.
  perform 1 from public.organizations where id = new.organization_id for update;

  select active_case_limit, enforce_case_limit into cap, enabled
  from public.organization_capacity_policies
  where organization_id = new.organization_id;

  if not coalesce(enabled, false) then return new; end if;
  if cap is null then
    raise exception 'Active case limit is not configured';
  end if;

  select count(*) into active_count from public.recovery_cases
  where organization_id = new.organization_id and status <> 'closed';

  if active_count >= cap then
    raise exception 'Organization active case limit reached';
  end if;
  return new;
end;
$$;

revoke all on function public.check_case_capacity() from public, anon, authenticated;
drop trigger if exists check_case_capacity_trigger on public.recovery_cases;
create trigger check_case_capacity_trigger
before insert or update of status, organization_id on public.recovery_cases
for each row execute function public.check_case_capacity();
