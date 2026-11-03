-- Disposable database only. Test the staged quote-to-sales trigger without production writes.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create table public.demo_requests (
 id uuid primary key default gen_random_uuid(),
 first_name text not null, last_name text not null, work_email text not null,
 phone text, organization_name text not null, organization_type text not null,
 role_title text not null, state text, organization_size text, recovery_focus text,
 preferred_contact text not null default 'Email', source text not null default 'Website',
 message text, created_at timestamptz not null default now()
);
create table public.sales_opportunities (
 id uuid primary key default gen_random_uuid(),
 demo_request_id uuid unique references public.demo_requests(id),
 organization_name text not null, contact_first_name text, contact_last_name text,
 contact_email text, contact_phone text, role_title text, organization_type text,
 state text, organization_size text, recovery_focus text, preferred_contact text,
 source text, stage text not null check(stage in ('Prospect','Contacted','Engaged','Qualified','Demo Requested','Quote/Proposal','Won')),
 priority text, temperature text, last_activity_at timestamptz,
 next_action text, notes text, updated_at timestamptz default now()
);
create table public.sales_activities (
 id uuid primary key default gen_random_uuid(),
 opportunity_id uuid not null references public.sales_opportunities(id),
 activity_type text not null check(activity_type in ('Demo Request','Quote')),
 summary text, details text, occurred_at timestamptz
);
\ir ../migrations/20261102_quote_request_sales_classification.sql
create trigger demo_request_sales_sync after insert or update on public.demo_requests
for each row execute function public.sync_demo_request_to_sales();

insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Quote','Lead','quote@example.test','Fixture Recovery Agency','Other','Director',
'QUOTE REQUEST\nRequested package: Recovery Growth\nOrganizational staff: 3\nActive cases: 20');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Demo','Lead','demo@example.test','Fixture Demo Agency','Other','Director',
'Please schedule a demo');

do $quote_test$
declare
 quote_count int;
 demo_count int;
begin
 select count(*) into quote_count from public.sales_opportunities
 where contact_email='quote@example.test' and stage='Quote/Proposal'
   and next_action='Review organizational quote request and respond by email';
 if quote_count <> 1 then raise exception 'Quote request was not classified'; end if;
 select count(*) into demo_count from public.sales_opportunities
 where contact_email='demo@example.test' and stage='Demo Requested';
 if demo_count <> 1 then raise exception 'Demo request behavior regressed'; end if;
 if (select count(*) from public.sales_activities where activity_type='Quote') <> 1
    or (select count(*) from public.sales_activities where activity_type='Demo Request') <> 1
 then raise exception 'Incorrect sales activity classification'; end if;
end
$quote_test$;
select 'quote pipeline integration passed' as result;
