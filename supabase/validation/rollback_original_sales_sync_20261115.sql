-- READ-ONLY SNAPSHOT captured 2026-11-15 from production.
-- ROLLBACK REFERENCE ONLY. Never run without reviewed staging restore rehearsal.
-- Restores original sales-sync behavior, not other migrations or grants.
-- Does not remove or modify existing sales data by itself.
CREATE OR REPLACE FUNCTION public.sync_demo_request_to_sales()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;
