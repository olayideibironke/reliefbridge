-- READ ONLY. Full-schema staging preflight, to be run by an authorized database reviewer.
-- This checks the structural prerequisites of the premium migrations.
-- It does not apply migrations, change grants, or establish that staging is ready.

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
