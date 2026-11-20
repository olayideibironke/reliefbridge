begin;

CREATE OR REPLACE FUNCTION public.send_internal_message(target_recipient uuid, message_subject text, message_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare mid uuid; begin if not private.is_reliefbridge_internal_user(auth.uid()) then raise exception 'Active ReliefBridge staff access required'; end if; if not private.is_reliefbridge_internal_user(target_recipient) then raise exception 'Recipient is not active ReliefBridge staff'; end if; if not exists (
    select 1 from public.profiles sender
    join public.profiles recipient on recipient.organization_id = sender.organization_id
    where sender.id = auth.uid() and recipient.id = target_recipient
  ) then
    raise exception 'Recipient must belong to your organization';
  end if;
  if target_recipient=auth.uid() then raise exception 'Choose another staff recipient'; end if; if length(trim(coalesce(message_subject,'')))=0 or length(trim(coalesce(message_body,'')))=0 then raise exception 'Subject and message are required'; end if; insert into public.staff_messages(sender_id,subject,body) values(auth.uid(),left(trim(message_subject),200),left(trim(message_body),20000)) returning id into mid; insert into public.staff_message_recipients(message_id,recipient_id) values(mid,target_recipient); return mid; end $function$
;

-- Serialize quota checks and inserts across application instances. Count only
-- persisted website requests, so a failed insert does not consume capacity.
create function public.submit_website_intake(request jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  intake public.demo_requests%rowtype;
  window_start timestamptz;
  total_requests bigint;
  identity_requests bigint;
begin
  intake := pg_catalog.jsonb_populate_record(null::public.demo_requests, request);
  intake.work_email := lower(btrim(intake.work_email));
  if intake.work_email is null or intake.work_email = '' then
    raise exception 'Work email is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(167941278, 1);
  window_start := pg_catalog.clock_timestamp() - interval '1 hour';

  select count(*), count(*) filter (where lower(btrim(work_email)) = intake.work_email)
  into total_requests, identity_requests
  from public.demo_requests
  where source = 'Website' and created_at >= window_start;

  if total_requests >= 30 or identity_requests >= 3 then
    return false;
  end if;

  insert into public.demo_requests (
    first_name, last_name, work_email, phone, organization_name, organization_type,
    role_title, state, organization_size, recovery_focus, preferred_contact,
    message, status, source, created_at
  ) values (
    intake.first_name, intake.last_name, intake.work_email, intake.phone,
    intake.organization_name, intake.organization_type, intake.role_title,
    intake.state, intake.organization_size, intake.recovery_focus,
    intake.preferred_contact, intake.message, 'New', 'Website', pg_catalog.clock_timestamp()
  );

  return true;
end;
$function$;

revoke all on function public.submit_website_intake(jsonb) from public, anon, authenticated;
grant execute on function public.submit_website_intake(jsonb) to service_role;

commit;
