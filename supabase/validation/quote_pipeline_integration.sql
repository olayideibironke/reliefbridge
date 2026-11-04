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
\ir ../migrations/20261103_quote_repeat_guard.sql
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
-- Repeated updates must not generate duplicate sales activities or opportunities.
update public.demo_requests set role_title='Recovery Director'
where work_email='quote@example.test';
do $quote_update$
begin
 if (select count(*) from public.sales_opportunities where contact_email='quote@example.test') <> 1
 then raise exception 'Quote update duplicated an opportunity'; end if;
 if (select count(*) from public.sales_activities where activity_type='Quote') <> 1
 then raise exception 'Quote update duplicated an activity'; end if;
 if (select role_title from public.sales_opportunities where contact_email='quote@example.test') <> 'Recovery Director'
 then raise exception 'Quote update did not synchronize the role'; end if;
end
$quote_update$;

-- Editing an existing demo into a quote must update the opportunity without
-- inventing a second submission activity (the trigger records activities on INSERT only).
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Edited','Demo','edited-demo@example.test','Edited Demo Agency','Other','Director',
'Initial demo inquiry to be edited');
update public.demo_requests
set message='QUOTE REQUEST\nRequested package: Recovery Starter\nOrganizational staff: 2'
where work_email='edited-demo@example.test' and organization_name='Edited Demo Agency';
do $edited_demo_classification$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='edited-demo@example.test' and organization_name='Edited Demo Agency') <> 1
  then raise exception 'Edited demo duplicated an opportunity'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='edited-demo@example.test' and organization_name='Edited Demo Agency') <> 'Quote/Proposal'
  then raise exception 'Edited demo did not update quote classification'; end if;
  if (select count(*) from public.sales_activities sa
      join public.sales_opportunities so on so.id=sa.opportunity_id
      where so.contact_email='edited-demo@example.test') <> 1
  then raise exception 'Editing demo created a false new submission activity'; end if;
end
$edited_demo_classification$;

-- Repeated edits to the same inquiry must remain idempotent for sales activity history.
update public.demo_requests set role_title='Edited Recovery Director'
where work_email='edited-demo@example.test' and organization_name='Edited Demo Agency';
update public.demo_requests set role_title='Edited Recovery Program Director'
where work_email='edited-demo@example.test' and organization_name='Edited Demo Agency';
do $repeat_edit_history$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='edited-demo@example.test' and organization_name='Edited Demo Agency') <> 1
  then raise exception 'Repeated edits duplicated the opportunity'; end if;
  if (select count(*) from public.sales_activities sa
      join public.sales_opportunities so on so.id=sa.opportunity_id
      where so.contact_email='edited-demo@example.test') <> 1
  then raise exception 'Repeated edits fabricated submission history'; end if;
  if (select role_title from public.sales_opportunities
      where contact_email='edited-demo@example.test' and organization_name='Edited Demo Agency')
      <> 'Edited Recovery Program Director'
  then raise exception 'Repeated edits did not synchronize current contact details'; end if;
end
$repeat_edit_history$;

-- Existing prospect should be upgraded in place, not cloned.
insert into public.sales_opportunities
(organization_name,contact_first_name,contact_last_name,contact_email,stage,priority,temperature)
values ('Existing Agency','Existing','Lead','existing@example.test','Prospect','Low','Cold');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Existing','Lead','existing@example.test','Existing Agency','Other','Coordinator',
'QUOTE REQUEST\nRequested package: Recovery Starter\nOrganizational staff: 2\nActive cases: 10');
do $quote_existing$
begin
 if (select count(*) from public.sales_opportunities where contact_email='existing@example.test') <> 1
 then raise exception 'Existing lead was duplicated'; end if;
 if (select stage from public.sales_opportunities where contact_email='existing@example.test') <> 'Quote/Proposal'
 then raise exception 'Existing lead was not promoted to quote stage'; end if;
 if (select count(*) from public.sales_activities where activity_type='Quote') <> 2
 then raise exception 'Existing lead quote activity missing'; end if;
end
$quote_existing$;

-- A prospect who previously requested a demo can later request a written quote.
-- Reuse the existing opportunity and promote its stage without duplicating it.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Demo','Lead','demo@example.test','Fixture Demo Agency','Other','Director',
'QUOTE REQUEST\nRequested package: ReliefBridge Standard\nOrganizational staff: 15\nActive cases: 50');
do $demo_to_quote$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='demo@example.test' and organization_name='Fixture Demo Agency') <> 1
  then raise exception 'Demo-to-quote transition duplicated opportunity'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='demo@example.test' and organization_name='Fixture Demo Agency') <> 'Quote/Proposal'
  then raise exception 'Existing demo opportunity was not promoted to quote stage'; end if;
  if (select next_action from public.sales_opportunities
      where contact_email='demo@example.test' and organization_name='Fixture Demo Agency')
      <> 'Review organizational quote request and respond by email'
  then raise exception 'Demo-to-quote transition retained outdated demo next action'; end if;
  if (select count(*) from public.sales_activities sa
      join public.sales_opportunities so on so.id=sa.opportunity_id
      where so.contact_email='demo@example.test' and sa.activity_type='Quote') <> 1
  then raise exception 'Demo-to-quote activity missing'; end if;
end
$demo_to_quote$;

-- Management-authored next actions must survive automated demo-to-quote progression.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Custom','Followup','custom@example.test','Custom Followup Agency','Other','Director',
'Please schedule a demo');
update public.sales_opportunities
set next_action='Management: confirm procurement requirements before proposing terms'
where contact_email='custom@example.test' and organization_name='Custom Followup Agency';
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Custom','Followup','custom@example.test','Custom Followup Agency','Other','Director',
'QUOTE REQUEST\nRequested package: Enterprise & Multi-agency');
do $custom_action_preservation$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='custom@example.test' and organization_name='Custom Followup Agency') <> 1
  then raise exception 'Custom follow-up opportunity duplicated'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='custom@example.test' and organization_name='Custom Followup Agency') <> 'Quote/Proposal'
  then raise exception 'Custom follow-up opportunity did not advance'; end if;
  if (select next_action from public.sales_opportunities
      where contact_email='custom@example.test' and organization_name='Custom Followup Agency')
      <> 'Management: confirm procurement requirements before proposing terms'
  then raise exception 'Management custom follow-up action was overwritten'; end if;
end
$custom_action_preservation$;

-- Preserve original attribution for an existing sales opportunity.
insert into public.sales_opportunities
(organization_name,contact_first_name,contact_last_name,contact_email,source,stage,priority,temperature)
values ('Referral Agency','Referral','Contact','referral@example.test','Partner Referral','Qualified','High','Warm');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Referral','Contact','referral@example.test','Referral Agency','Other','Director',
'QUOTE REQUEST\nRequested package: Recovery Growth');
do $original_source_attribution$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='referral@example.test' and organization_name='Referral Agency') <> 1
  then raise exception 'Referral opportunity duplicated'; end if;
  if (select source from public.sales_opportunities
      where contact_email='referral@example.test' and organization_name='Referral Agency')
      <> 'Partner Referral'
  then raise exception 'Original referral attribution was overwritten'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='referral@example.test' and organization_name='Referral Agency')
      <> 'Quote/Proposal'
  then raise exception 'Referral opportunity failed to advance to quote'; end if;
end
$original_source_attribution$;

-- Empty historical attribution may be filled from the new inquiry, but not overwritten later.
insert into public.sales_opportunities
(organization_name,contact_first_name,contact_last_name,contact_email,source,stage,priority,temperature)
values ('Unattributed Agency','Unknown','Source','unattributed@example.test','','Prospect','Low','Cold');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Unknown','Source','unattributed@example.test','Unattributed Agency','Other','Director',
'QUOTE REQUEST\nRequested package: Recovery Starter');
do $missing_source_fallback$
begin
  if (select source from public.sales_opportunities
      where contact_email='unattributed@example.test' and organization_name='Unattributed Agency')
      <> 'Website'
  then raise exception 'Missing first-touch attribution did not fall back to website source'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='unattributed@example.test' and organization_name='Unattributed Agency')
      <> 'Quote/Proposal'
  then raise exception 'Unattributed prospect did not advance to quote stage'; end if;
end
$missing_source_fallback$;

-- Won opportunities must not regress when the same contact requests another quote.
insert into public.sales_opportunities
(organization_name,contact_first_name,contact_last_name,contact_email,stage,priority,temperature)
values ('Won Agency','Won','Contact','won@example.test','Won','High','Hot');
update public.sales_opportunities
set next_action='Management: coordinate existing customer renewal',
    notes='Management: signed agreement and customer onboarding complete'
where contact_email='won@example.test' and organization_name='Won Agency';
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Won','Contact','won@example.test','Won Agency','Other','Director',
'QUOTE REQUEST\nRequested package: Enterprise & Multi-agency');
do $won_stage_preservation$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='won@example.test' and organization_name='Won Agency') <> 1
  then raise exception 'Won opportunity duplicated on quote request'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='won@example.test' and organization_name='Won Agency') <> 'Won'
  then raise exception 'Won opportunity regressed after quote request'; end if;
  if (select next_action from public.sales_opportunities
      where contact_email='won@example.test' and organization_name='Won Agency')
      <> 'Management: coordinate existing customer renewal'
  then raise exception 'Won opportunity management action was overwritten'; end if;
  if (select position('Management: signed agreement and customer onboarding complete' in coalesce(notes,'')) > 0
      from public.sales_opportunities
      where contact_email='won@example.test' and organization_name='Won Agency') is not true
  then raise exception 'Won opportunity management notes were lost'; end if;
end
$won_stage_preservation$;

-- An ordinary demo request after a quote must not downgrade the existing opportunity.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Quote','Lead','quote@example.test','Fixture Recovery Agency','Other','Director',
'Following up with a demo request after receiving a quote');
do $quote_to_demo_no_regression$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='quote@example.test' and organization_name='Fixture Recovery Agency') <> 1
  then raise exception 'Quote-stage opportunity duplicated on demo request'; end if;
  if (select stage from public.sales_opportunities
      where contact_email='quote@example.test' and organization_name='Fixture Recovery Agency') <> 'Quote/Proposal'
  then raise exception 'Quote-stage opportunity regressed after demo request'; end if;
end
$quote_to_demo_no_regression$;

-- Security fixture: mirror production's public intake permissions and RLS.
alter table public.demo_requests add column status text not null default 'New';
alter table public.demo_requests enable row level security;
alter table public.sales_opportunities enable row level security;
alter table public.sales_activities enable row level security;
grant usage on schema public to anon;
grant insert on public.demo_requests to anon;
create policy public_intake_insert on public.demo_requests
  for insert to anon with check (status='New' and source='Website');
do $security_checks$
begin
 if has_table_privilege('anon','public.demo_requests','SELECT')
 or has_table_privilege('anon','public.demo_requests','UPDATE')
 or has_table_privilege('anon','public.sales_opportunities','SELECT')
 or has_table_privilege('anon','public.sales_activities','SELECT')
 then raise exception 'Anonymous read or update privilege detected'; end if;
end
$security_checks$;
set role anon;
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Anonymous','Lead','anonymous@example.test','Anonymous Fixture','Other','Director',
'QUOTE REQUEST: Recovery Growth');
-- Anonymous callers cannot spoof privileged intake status or source.
do $anon_negative$
begin
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,status,message)
    values ('Spoof','Status','spoof-status@example.test','Spoof Agency','Other','Director','Approved','QUOTE REQUEST');
    raise exception 'FAIL: anonymous status spoof was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,source,message)
    values ('Spoof','Source','spoof-source@example.test','Spoof Agency','Other','Director','Internal','QUOTE REQUEST');
    raise exception 'FAIL: anonymous source spoof was accepted';
  exception when insufficient_privilege then null;
  end;
end
$anon_negative$;
-- Negative permissions checks execute as the actual anonymous role.
do $anon_access_denied$
begin
  begin
    perform count(*) from public.demo_requests;
    raise exception 'FAIL: anonymous intake SELECT was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.demo_requests set role_title='Tampered'
    where work_email='anonymous@example.test';
    raise exception 'FAIL: anonymous intake UPDATE was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from public.sales_opportunities;
    raise exception 'FAIL: anonymous sales SELECT was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.sales_activities(opportunity_id,activity_type,summary)
    values (gen_random_uuid(),'Quote','Forged');
    raise exception 'FAIL: anonymous sales activity INSERT was allowed';
  exception when insufficient_privilege then null;
  end;
end
$anon_access_denied$;
reset role;
do $security_result$
begin
 if (select count(*) from public.sales_opportunities where contact_email='anonymous@example.test' and stage='Quote/Proposal') <> 1
 then raise exception 'Anonymous quote did not create a classified opportunity'; end if;
end
$security_result$;

-- Repeated identical quote requests are blocked, but different organizations and demos remain allowed.
do $repeat_guard_test$
begin
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Quote','Lead','quote@example.test','Fixture Recovery Agency','Other','Director','QUOTE REQUEST again');
    raise exception 'FAIL: duplicate quote was accepted';
  exception when sqlstate 'RB001' then null;
  end;
end
$repeat_guard_test$;
-- Normalization: capitalization and surrounding spaces must not bypass cooldown.
do $normalized_repeat$
begin
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Quote','Lead',' QUOTE@EXAMPLE.TEST ',' Fixture Recovery Agency ','Other','Director','QUOTE REQUEST normalized duplicate');
    raise exception 'FAIL: normalized duplicate quote was accepted';
  exception when sqlstate 'RB001' then null;
  end;
end
$normalized_repeat$;

-- A rejected duplicate must not create an intake row, sales activity, or new opportunity.
do $rejected_quote_atomicity$
begin
  if (select count(*) from public.demo_requests
      where lower(btrim(work_email))='quote@example.test'
        and lower(btrim(organization_name))='fixture recovery agency'
        and left(coalesce(message,''),13)='QUOTE REQUEST') <> 1
  then raise exception 'Rejected quote created an unexpected intake record'; end if;
  if (select count(*) from public.sales_opportunities
      where lower(contact_email)='quote@example.test'
        and lower(organization_name)='fixture recovery agency') <> 1
  then raise exception 'Rejected quote created an unexpected sales opportunity'; end if;
  if (select count(*) from public.sales_activities sa
      join public.sales_opportunities so on so.id=sa.opportunity_id
      where lower(so.contact_email)='quote@example.test'
        and lower(so.organization_name)='fixture recovery agency'
        and sa.activity_type='Quote') <> 1
  then raise exception 'Rejected quote created an unexpected sales activity'; end if;
end
$rejected_quote_atomicity$;

insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Quote','Lead','quote@example.test','Different Organization','Other','Director','QUOTE REQUEST for another organization');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Quote','Lead','quote@example.test','Fixture Recovery Agency','Other','Director','Ordinary demo inquiry');

-- A different email at the same organization must not be blocked by another person's request.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Second','Contact','another@example.test','Fixture Recovery Agency','Other','Coordinator',
'QUOTE REQUEST from a different contact');

-- An ordinary demo submission is not subject to the quote-only cooldown.
do $demo_compatibility$
begin
  if (select count(*) from public.demo_requests
      where work_email='quote@example.test'
        and organization_name='Fixture Recovery Agency'
        and left(coalesce(message,''),13)<>'QUOTE REQUEST') <> 2
  then raise exception 'Ordinary demo requests were not both preserved'; end if;
end
$demo_compatibility$;

-- A quote request outside the cooldown must be accepted.
update public.demo_requests
set created_at = now() - interval '11 minutes'
where work_email = 'quote@example.test'
  and organization_name = 'Fixture Recovery Agency'
  and left(coalesce(message,''),13) = 'QUOTE REQUEST';
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Quote','Lead','quote@example.test','Fixture Recovery Agency','Other','Director',
'QUOTE REQUEST after cooldown');
do $cooldown_expiry$
begin
 if (select count(*) from public.demo_requests
     where work_email='quote@example.test'
       and organization_name='Fixture Recovery Agency'
       and left(coalesce(message,''),13)='QUOTE REQUEST') <> 2
 then raise exception 'Expired cooldown incorrectly blocked a new request'; end if;
end
$cooldown_expiry$;

select 'quote pipeline integration passed' as result;
