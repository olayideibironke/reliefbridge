-- ReliefBridge internal sales pipeline
-- Production schema applied in Supabase on 2026-10-07. This file keeps repository schema history aligned.

create table if not exists public.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  demo_request_id uuid unique references public.demo_requests(id) on delete set null,
  organization_name text not null,
  contact_first_name text,
  contact_last_name text,
  contact_email text not null,
  contact_phone text,
  role_title text,
  organization_type text,
  state text,
  organization_size text,
  recovery_focus text,
  preferred_contact text,
  source text not null default 'Outbound',
  stage text not null default 'Prospect',
  priority text not null default 'Medium',
  temperature text not null default 'Warm',
  owner_id uuid references public.profiles(id) on delete set null,
  last_activity_at timestamptz not null default now(),
  next_action text,
  next_action_at timestamptz,
  demo_scheduled_at timestamptz,
  demo_completed_at timestamptz,
  evaluation_offered_at timestamptz,
  evaluation_starts_at timestamptz,
  evaluation_ends_at timestamptz,
  quote_status text,
  expected_value numeric(12,2),
  notes text,
  outcome_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_stage_valid check (stage in ('Prospect','Contacted','Engaged','Qualified','Demo Requested','Demo Scheduled','Demo Completed','7-Day Evaluation Offered','Evaluation Active','Quote/Proposal','Decision','Won','Lost','Future Follow-Up')),
  constraint sales_priority_valid check (priority in ('Low','Medium','High','Critical')),
  constraint sales_temperature_valid check (temperature in ('Cold','Warm','Hot'))
);

create table if not exists public.sales_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.sales_opportunities(id) on delete cascade,
  activity_type text not null,
  summary text not null,
  details text,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint sales_activity_type_valid check (activity_type in ('Email','Phone','Demo Request','Demo','Evaluation','Quote','Note','Stage Change','Follow-Up','Other'))
);

create unique index if not exists sales_opportunities_email_org_unique on public.sales_opportunities(lower(contact_email),lower(organization_name));
create index if not exists sales_opportunities_stage_idx on public.sales_opportunities(stage);
create index if not exists sales_opportunities_next_action_idx on public.sales_opportunities(next_action_at) where next_action_at is not null;
create index if not exists sales_activities_opportunity_idx on public.sales_activities(opportunity_id,occurred_at desc);

alter table public.sales_opportunities enable row level security;
alter table public.sales_activities enable row level security;

drop policy if exists "platform management sales opportunities" on public.sales_opportunities;
create policy "platform management sales opportunities" on public.sales_opportunities for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid and lower(coalesce(p.role,'')) in ('owner','admin') and p.access_status='active'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid and lower(coalesce(p.role,'')) in ('owner','admin') and p.access_status='active'));

drop policy if exists "platform management sales activities" on public.sales_activities;
create policy "platform management sales activities" on public.sales_activities for all to authenticated
using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid and lower(coalesce(p.role,'')) in ('owner','admin') and p.access_status='active'))
with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid and lower(coalesce(p.role,'')) in ('owner','admin') and p.access_status='active'));

grant select,insert,update,delete on public.sales_opportunities to authenticated;
grant select,insert,update,delete on public.sales_activities to authenticated;

create or replace function public.sync_demo_request_to_sales() returns trigger language plpgsql security definer set search_path=public as $$
declare opportunity uuid;
begin
 insert into public.sales_opportunities(demo_request_id,organization_name,contact_first_name,contact_last_name,contact_email,contact_phone,role_title,organization_type,state,organization_size,recovery_focus,preferred_contact,source,stage,priority,temperature,last_activity_at,next_action,notes)
 values(new.id,new.organization_name,new.first_name,new.last_name,new.work_email,new.phone,new.role_title,new.organization_type,new.state,new.organization_size,new.recovery_focus,new.preferred_contact,new.source,'Demo Requested','High','Hot',new.created_at,'Review demo request and contact prospect',new.message)
 on conflict (demo_request_id) do update set organization_name=excluded.organization_name,contact_first_name=excluded.contact_first_name,contact_last_name=excluded.contact_last_name,contact_email=excluded.contact_email,contact_phone=excluded.contact_phone,role_title=excluded.role_title,organization_type=excluded.organization_type,state=excluded.state,organization_size=excluded.organization_size,recovery_focus=excluded.recovery_focus,preferred_contact=excluded.preferred_contact,updated_at=now()
 returning id into opportunity;
 if tg_op='INSERT' then insert into public.sales_activities(opportunity_id,activity_type,summary,details,occurred_at) values(opportunity,'Demo Request','Website demo request submitted',new.message,new.created_at); end if;
 return new;
end $$;

drop trigger if exists demo_request_sales_sync on public.demo_requests;
create trigger demo_request_sales_sync after insert or update on public.demo_requests for each row execute function public.sync_demo_request_to_sales();
