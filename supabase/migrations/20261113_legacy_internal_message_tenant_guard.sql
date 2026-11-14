-- STAGED ONLY. Do not apply to production without a separate approved rollout.
-- Restore tenant isolation to the legacy single-recipient messaging RPC.
create or replace function public.send_internal_message(
  target_recipient uuid,
  message_subject text,
  message_body text
) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  mid uuid;
  sender_org uuid;
  recipient_org uuid;
begin
  if not private.is_reliefbridge_internal_user(auth.uid()) then
    raise exception 'Active ReliefBridge staff access required';
  end if;
  if not private.is_reliefbridge_internal_user(target_recipient) then
    raise exception 'Recipient is not active ReliefBridge staff';
  end if;
  if target_recipient = auth.uid() then
    raise exception 'Choose another staff recipient';
  end if;
  select organization_id into sender_org from public.profiles where id = auth.uid();
  select organization_id into recipient_org from public.profiles where id = target_recipient;
  if sender_org is null or recipient_org is distinct from sender_org then
    raise exception 'Recipient must belong to your organization';
  end if;
  if length(trim(coalesce(message_subject, ''))) = 0
     or length(trim(coalesce(message_body, ''))) = 0 then
    raise exception 'Subject and message are required';
  end if;
  insert into public.staff_messages(sender_id, subject, body)
  values(auth.uid(), left(trim(message_subject), 200), left(trim(message_body), 20000))
  returning id into mid;
  insert into public.staff_message_recipients(message_id, recipient_id)
  values(mid, target_recipient);
  return mid;
end;
$function$;

-- Explicitly retain the existing authenticated-only callable contract.
revoke all on function public.send_internal_message(uuid,text,text) from public, anon;
grant execute on function public.send_internal_message(uuid,text,text) to authenticated;
