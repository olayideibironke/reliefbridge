-- Quote requests are stored in demo_requests for compatibility with the existing intake workflow.
-- Classify quote inquiries by the server-generated message prefix, without changing existing demo records.
-- Apply only after reviewing the current production trigger definition.
create or replace function public.sync_demo_request_to_sales()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  opportunity uuid;
  is_quote boolean := left(coalesce(new.message,''), 13) = 'QUOTE REQUEST';
  target_stage text;
  target_action text;
begin
  target_stage := case when is_quote then 'Quote/Proposal' else 'Demo Requested' end;
  target_action := case when is_quote then 'Review organizational quote request and respond by email' else 'Review demo request and contact prospect' end;

  select so.id into opportunity
  from public.sales_opportunities so
  where so.demo_request_id = new.id
     or (lower(so.contact_email) = lower(new.work_email)
         and lower(so.organization_name) = lower(new.organization_name))
  order by (so.demo_request_id = new.id) desc
  limit 1;

  if opportunity is null then
    insert into public.sales_opportunities(
      demo_request_id,organization_name,contact_first_name,contact_last_name,
      contact_email,contact_phone,role_title,organization_type,state,
      organization_size,recovery_focus,preferred_contact,source,stage,
      priority,temperature,last_activity_at,next_action,notes
    )
    values (
      new.id,new.organization_name,new.first_name,new.last_name,
      new.work_email,new.phone,new.role_title,new.organization_type,new.state,
      new.organization_size,new.recovery_focus,new.preferred_contact,new.source,
      target_stage,'High','Hot',new.created_at,target_action,new.message
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
        stage = case when so.stage in ('Prospect','Contacted','Engaged','Qualified')
                       or (is_quote and so.stage = 'Demo Requested')
                     then target_stage else so.stage end,
        priority = case when so.priority in ('Low','Medium') then 'High' else so.priority end,
        temperature = 'Hot',
        last_activity_at = case when tg_op='INSERT' then new.created_at else so.last_activity_at end,
        next_action = case when so.next_action is null or btrim(so.next_action)=''
                           then target_action else so.next_action end,
        notes = case when is_quote and tg_op='INSERT'
                     then concat_ws(E'\n\n',so.notes,new.message)
                     else coalesce(so.notes,new.message) end,
        updated_at = now()
    where so.id = opportunity;
  end if;

  if tg_op='INSERT' then
    insert into public.sales_activities(opportunity_id,activity_type,summary,details,occurred_at)
    values(opportunity,case when is_quote then 'Quote' else 'Demo Request' end,
           case when is_quote then 'Website quote request submitted' else 'Website demo request submitted' end,
           new.message,new.created_at);
  end if;
  return new;
end
$function$;
revoke all on function public.sync_demo_request_to_sales() from public, anon, authenticated;
