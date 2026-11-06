-- ReliefBridge capacity release preflight. READ ONLY.
-- Run against the intended environment before applying staged migrations.
-- This script does not create, update, or delete customer records.

-- Confirm the live status values used by the capacity guards.
select 'case_status' as category, status as value, count(*) as record_count
from public.recovery_cases
group by status
union all
select 'staff_access_status', access_status, count(*)
from public.profiles
group by access_status
order by category, value;

-- Review organization-level baseline counts without exposing survivor details.
select o.id as organization_id,
  (select count(*) from public.recovery_cases c
   where c.organization_id = o.id and c.status <> 'closed') as active_cases,
  (select count(*) from public.profiles p
   where p.organization_id = o.id and p.access_status = 'active') as active_staff
from public.organizations o
order by o.id;

-- Existing authorization triggers must be understood before adding new ones.
select c.relname as table_name, t.tgname as trigger_name,
       pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('profiles', 'recovery_cases')
  and not t.tgisinternal
order by c.relname, t.tgname;

-- Do not enable enforcement until written limits are approved and
-- baseline counts are reviewed. This preflight intentionally contains
-- no UPDATE statements or activation commands.
