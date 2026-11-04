-- READ ONLY. Full-schema staging preflight, to be run by an authorized database reviewer.
-- This checks the structural prerequisites of the premium migrations.
-- It does not apply migrations, change grants, or establish that staging is ready.

-- Fail closed on missing schema prerequisites; this anonymous block makes no writes.
do $premium_preflight$
declare
  missing text;
begin
  select string_agg(name, ', ' order by name) into missing
  from (values ('organizations'),('profiles'),('recovery_cases'),('demo_requests'),
               ('sales_opportunities'),('sales_activities')) as t(name)
  where to_regclass('public.' || name) is null;
  if missing is not null then
    raise exception 'Premium staging preflight: missing tables: %', missing;
  end if;

  with required(table_name,column_name) as (
    values
      ('profiles','organization_id'),('profiles','access_status'),
      ('recovery_cases','organization_id'),('recovery_cases','status'),
      ('demo_requests','work_email'),('demo_requests','organization_name'),
      ('demo_requests','message'),('demo_requests','status'),('demo_requests','source'),
      ('sales_opportunities','demo_request_id'),('sales_opportunities','contact_email'),
      ('sales_opportunities','organization_name'),('sales_opportunities','stage'),
      ('sales_opportunities','next_action'),('sales_opportunities','source'),
      ('sales_activities','opportunity_id'),('sales_activities','activity_type')
  )
  select string_agg(r.table_name || '.' || r.column_name, ', ' order by r.table_name,r.column_name)
  into missing
  from required r
  left join information_schema.columns c
    on c.table_schema='public' and c.table_name=r.table_name
   and c.column_name=r.column_name
  where c.column_name is null;
  if missing is not null then
    raise exception 'Premium staging preflight: missing columns: %', missing;
  end if;

  select string_agg(c.relname, ', ' order by c.relname) into missing
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in
    ('demo_requests','sales_opportunities','sales_activities')
    and not c.relrowsecurity;
  if missing is not null then
    raise exception 'Premium staging preflight: RLS disabled on: %', missing;
  end if;

  if not exists (
    select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='demo_requests'
      and t.tgname='demo_request_sales_sync' and not t.tgisinternal
      and t.tgenabled in ('O','A')
  ) then
    raise exception 'Premium staging preflight: original demo_request_sales_sync trigger missing';
  end if;
  if to_regprocedure('public.sync_demo_request_to_sales()') is null then
    raise exception 'Premium staging preflight: original sales-sync function missing';
  end if;
  raise notice 'PASS: required schema objects, RLS and original sales sync exist';
end
$premium_preflight$;

with required_tables(name) as (
  values ('organizations'),('profiles'),('recovery_cases'),('demo_requests'),
         ('sales_opportunities'),('sales_activities')
)
select name as required_table,
       to_regclass('public.' || name) is not null as present
from required_tables
order by name;

with required_columns(table_name,column_name) as (
  values
    ('profiles','organization_id'),('profiles','access_status'),
    ('recovery_cases','organization_id'),('recovery_cases','status'),
    ('demo_requests','work_email'),('demo_requests','organization_name'),
    ('demo_requests','message'),('demo_requests','status'),('demo_requests','source'),
    ('sales_opportunities','demo_request_id'),('sales_opportunities','contact_email'),
    ('sales_opportunities','organization_name'),('sales_opportunities','stage'),
    ('sales_opportunities','next_action'),('sales_opportunities','source'),
    ('sales_activities','opportunity_id'),('sales_activities','activity_type')
)
select r.table_name,r.column_name,c.column_name is not null as present
from required_columns r
left join information_schema.columns c
  on c.table_schema='public' and c.table_name=r.table_name
 and c.column_name=r.column_name
order by r.table_name,r.column_name;

select c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('demo_requests','sales_opportunities','sales_activities')
 and c.relkind in ('r','p')
order by c.relname;

select tgname as trigger_name,pg_get_triggerdef(t.oid) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('demo_requests','profiles','recovery_cases')
 and not t.tgisinternal
order by c.relname,tgname;

select p.proname as function_name,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='sync_demo_request_to_sales';

select conrelid::regclass::text as table_name,conname,
       pg_get_constraintdef(oid) as constraint_definition
from pg_constraint
where connamespace='public'::regnamespace
 and conrelid in ('public.sales_opportunities'::regclass,'public.sales_activities'::regclass)
 and contype='c'
order by table_name,conname;
