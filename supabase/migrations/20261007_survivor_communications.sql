create table if not exists public.survivor_communications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 survivor_id uuid not null references public.survivors(id) on delete cascade, sender_profile_id uuid references public.profiles(id) on delete set null,
 channel text not null default 'email' check (channel in ('email')), subject text not null, body text not null,
 status text not null default 'pending' check (status in ('pending','sent','failed')), provider_id text, sent_at timestamptz, error_message text, created_at timestamptz not null default now()
);
create index if not exists survivor_communications_org_survivor_created_idx on public.survivor_communications(organization_id,survivor_id,created_at desc);
alter table public.survivor_communications enable row level security;
grant select on public.survivor_communications to authenticated;
revoke insert,update,delete on public.survivor_communications from anon,authenticated;
drop policy if exists "organization members can view survivor communications" on public.survivor_communications;
create policy "organization members can view survivor communications" on public.survivor_communications for select to authenticated using (organization_id in (select p.organization_id from public.profiles p where p.id=(select auth.uid()) and p.access_status='active') and exists(select 1 from public.organization_capabilities c where c.organization_id=survivor_communications.organization_id and c.communications_mode='staff_survivor'));
create or replace function private.is_reliefbridge_internal_user(target uuid default auth.uid()) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles p join public.organizations o on o.id=p.organization_id left join public.organization_capabilities c on c.organization_id=p.organization_id where p.id=target and lower(coalesce(p.role,'')) in ('owner','admin','manager','staff') and p.access_status='active' and lower(coalesce(o.status,''))='active' and (p.organization_id='9f3cb5cc-aa6f-44cb-8aa9-b0a7bc505142'::uuid or c.communications_mode in ('staff_only','staff_survivor'))); $$;
revoke all on function private.is_reliefbridge_internal_user(uuid) from public,anon; grant execute on function private.is_reliefbridge_internal_user(uuid) to authenticated,service_role;


create or replace function public.send_internal_message_multi(target_message uuid, target_to uuid, target_cc uuid default null, target_bcc uuid default null, message_subject text default '', message_body text default '', target_priority text default 'normal', target_acknowledgment boolean default false, target_reply_to uuid default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare rid uuid; rtype text; tid uuid; sender_org uuid; recipient_org uuid;
begin
 if not private.is_reliefbridge_internal_user(auth.uid()) then raise exception 'Active ReliefBridge staff access required'; end if;
 select organization_id into sender_org from public.profiles where id=auth.uid();
 if sender_org is null then raise exception 'Organization access required'; end if;
 if target_message is null or target_to is null then raise exception 'A recipient is required'; end if;
 if target_priority not in ('normal','high') then raise exception 'Invalid priority'; end if;
 if length(trim(coalesce(message_subject,'')))=0 or length(trim(coalesce(message_body,'')))=0 then raise exception 'Subject and message are required'; end if;
 if exists(select 1 from public.staff_messages where id=target_message) then raise exception 'Message identifier already exists'; end if;
 if target_reply_to is not null then select coalesce(m.thread_id,m.id) into tid from public.staff_messages m where m.id=target_reply_to and (m.sender_id=auth.uid() or exists(select 1 from public.staff_message_recipients r where r.message_id=m.id and r.recipient_id=auth.uid())); if tid is null then raise exception 'Reply target unavailable'; end if; else tid:=target_message; end if;
 insert into public.staff_messages(id,sender_id,subject,body,priority,acknowledgment_requested,thread_id,reply_to_message_id) values(target_message,auth.uid(),left(trim(message_subject),240),left(trim(message_body),100000),target_priority,target_acknowledgment,tid,target_reply_to);
 for rid,rtype in select * from (values(target_to,'to'),(target_cc,'cc'),(target_bcc,'bcc')) v(id,kind) loop
  if rid is null then continue; end if; if rid=auth.uid() then raise exception 'Choose another staff recipient'; end if;
  if not private.is_reliefbridge_internal_user(rid) then raise exception 'Recipient is not active ReliefBridge staff'; end if;
  select organization_id into recipient_org from public.profiles where id=rid; if recipient_org is distinct from sender_org then raise exception 'Recipient must belong to your organization'; end if;
  if exists(select 1 from public.staff_message_recipients where message_id=target_message and recipient_id=rid) then continue; end if;
  insert into public.staff_message_recipients(message_id,recipient_id,recipient_type) values(target_message,rid,rtype);
 end loop; return target_message;
exception when others then delete from public.staff_messages where id=target_message and sender_id=auth.uid(); raise;
end $$;
revoke execute on function public.send_internal_message_multi(uuid,uuid,uuid,uuid,text,text) from anon,authenticated,public;
