-- ReliefBridge sales pipeline hardening and internal test-data isolation.
-- Mirrors production corrections applied on 2026-10-07.

alter table public.sales_opportunities
  add column if not exists is_test boolean not null default false;

update public.sales_opportunities
set is_test = true, updated_at = now()
where id in (
  '104509b8-848b-49fe-b6fa-360469e4a212'::uuid,
  '934a2d81-d927-4fe9-b4a2-e306289fe14d'::uuid,
  '33152df6-720e-4872-89cc-096f64b429f4'::uuid,
  'b94f4fa0-038f-4415-927a-2432da5aa69f'::uuid
);

create or replace function public.sync_demo_request_to_sales()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opportunity uuid;
begin
  select so.id into opportunity
  from public.sales_opportunities so
  where so.demo_request_id = new.id
     or (
       lower(so.contact_email) = lower(new.work_email)
       and lower(so.organization_name) = lower(new.organization_name)
     )
  order by (so.demo_request_id = new.id) desc
  limit 1;

  if opportunity is null then
    insert into public.sales_opportunities(
      demo_request_id,organization_name,contact_first_name,contact_last_name,
      contact_email,contact_phone,role_title,organization_type,state,
      organization_size,recovery_focus,preferred_contact,source,stage,
      priority,temperature,last_activity_at,next_action,notes
    )
    values(
      new.id,new.organization_name,new.first_name,new.last_name,
      new.work_email,new.phone,new.role_title,new.organization_type,new.state,
      new.organization_size,new.recovery_focus,new.preferred_contact,new.source,
      'Demo Requested','High','Hot',new.created_at,
      'Review demo request and contact prospect',new.message
    )
    returning id into opportunity;
  else
    update public.sales_opportunities so
    set demo_request_id = coalesce(so.demo_request_id,new.id),
        organization_name = new.organization_name,
        contact_first_name = new.first_name,
        contact_last_name = new.last_name,
        contact_email = new.work_email,
        contact_phone = new.phone,
        role_title = new.role_title,
        organization_type = new.organization_type,
        state = new.state,
        organization_size = new.organization_size,
        recovery_focus = new.recovery_focus,
        preferred_contact = new.preferred_contact,
        source = coalesce(nullif(new.source,''),so.source),
        stage = case when so.stage in ('Prospect','Contacted','Engaged','Qualified') then 'Demo Requested' else so.stage end,
        priority = case when so.priority in ('Low','Medium') then 'High' else so.priority end,
        temperature = 'Hot',
        last_activity_at = case when tg_op='INSERT' then new.created_at else so.last_activity_at end,
        next_action = case when so.next_action is null or btrim(so.next_action)='' then 'Review demo request and contact prospect' else so.next_action end,
        notes = coalesce(so.notes,new.message),
        updated_at = now()
    where so.id = opportunity;
  end if;

  if tg_op='INSERT' then
    insert into public.sales_activities(opportunity_id,activity_type,summary,details,occurred_at)
    values(opportunity,'Demo Request','Website demo request submitted',new.message,new.created_at);
  end if;
  return new;
end
$$;

revoke execute on function public.sync_demo_request_to_sales() from public, anon, authenticated;

drop policy if exists "platform management sales opportunities" on public.sales_opportunities;
create policy "platform management sales opportunities"
on public.sales_opportunities for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid
      and lower(coalesce(p.role,'')) in ('owner','admin')
      and p.access_status='active'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid
      and lower(coalesce(p.role,'')) in ('owner','admin')
      and p.access_status='active'
  )
);

drop policy if exists "platform management sales activities" on public.sales_activities;
create policy "platform management sales activities"
on public.sales_activities for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid
      and lower(coalesce(p.role,'')) in ('owner','admin')
      and p.access_status='active'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid
      and lower(coalesce(p.role,'')) in ('owner','admin')
      and p.access_status='active'
  )
);
