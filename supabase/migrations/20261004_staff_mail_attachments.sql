-- ReliefBridge staff mail attachments
create table if not exists public.staff_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.staff_messages(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  created_at timestamptz not null default now()
);
create index if not exists staff_message_attachments_message_idx on public.staff_message_attachments(message_id);
alter table public.staff_message_attachments enable row level security;

drop policy if exists "staff mail attachments read" on public.staff_message_attachments;
create policy "staff mail attachments read" on public.staff_message_attachments for select to authenticated using (
  exists(select 1 from public.staff_messages m where m.id=message_id and m.sender_id=auth.uid())
  or exists(select 1 from public.staff_message_recipients r where r.message_id=message_id and r.recipient_id=auth.uid())
);
drop policy if exists "staff mail attachments insert" on public.staff_message_attachments;
create policy "staff mail attachments insert" on public.staff_message_attachments for insert to authenticated with check (
  uploaded_by=auth.uid() and exists(select 1 from public.staff_messages m where m.id=message_id and m.sender_id=auth.uid())
);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('staff-mail-attachments','staff-mail-attachments',false,26214400,array[
'application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel','text/csv',
'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword','text/plain','image/jpeg','image/png','image/webp'
])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "staff mail storage insert" on storage.objects;
create policy "staff mail storage insert" on storage.objects for insert to authenticated with check (
 bucket_id='staff-mail-attachments' and (storage.foldername(name))[1]=auth.uid()::text
);
drop policy if exists "staff mail storage read" on storage.objects;
create policy "staff mail storage read" on storage.objects for select to authenticated using (
 bucket_id='staff-mail-attachments' and exists(
  select 1 from public.staff_message_attachments a
  join public.staff_messages m on m.id=a.message_id
  where a.storage_path=name and (
   m.sender_id=auth.uid() or exists(select 1 from public.staff_message_recipients r where r.message_id=m.id and r.recipient_id=auth.uid())
  )
 )
);

-- SECURITY DEFINER staff RPCs must never be callable anonymously.
revoke execute on function public.get_my_work_assignments() from public, anon;
grant execute on function public.get_my_work_assignments() to authenticated;
revoke execute on function public.restore_internal_message(uuid) from public, anon;
grant execute on function public.restore_internal_message(uuid) to authenticated;
revoke execute on function public.trash_internal_message(uuid) from public, anon;
grant execute on function public.trash_internal_message(uuid) to authenticated;
revoke execute on function public.archive_internal_message(uuid) from anon;
revoke execute on function public.mark_internal_message_read(uuid) from anon;
revoke execute on function public.send_internal_message(uuid,text,text) from anon;


-- One-message multi-recipient delivery for professional To / Cc / Bcc handling.
alter table public.staff_message_recipients add column if not exists recipient_type text not null default 'to' check (recipient_type in ('to','cc','bcc'));

create or replace function public.send_internal_message_multi(
 target_message uuid, target_to uuid, target_cc uuid default null, target_bcc uuid default null,
 message_subject text default '', message_body text default ''
) returns uuid language plpgsql security definer set search_path='' as $$
declare rid uuid; rtype text;
begin
 if not private.is_reliefbridge_internal_user(auth.uid()) then raise exception 'Active ReliefBridge staff access required'; end if;
 if target_message is null or target_to is null then raise exception 'A recipient is required'; end if;
 if length(trim(coalesce(message_subject,'')))=0 or length(trim(coalesce(message_body,'')))=0 then raise exception 'Subject and message are required'; end if;
 if exists(select 1 from public.staff_messages where id=target_message) then raise exception 'Message identifier already exists'; end if;
 insert into public.staff_messages(id,sender_id,subject,body) values(target_message,auth.uid(),left(trim(message_subject),200),left(trim(message_body),20000));
 for rid,rtype in select * from (values(target_to,'to'),(target_cc,'cc'),(target_bcc,'bcc')) v(id,kind)
 loop
   if rid is null then continue; end if;
   if rid=auth.uid() then raise exception 'Choose another staff recipient'; end if;
   if not private.is_reliefbridge_internal_user(rid) then raise exception 'Recipient is not active ReliefBridge staff'; end if;
   if exists(select 1 from public.staff_message_recipients where message_id=target_message and recipient_id=rid) then continue; end if;
   insert into public.staff_message_recipients(message_id,recipient_id,recipient_type) values(target_message,rid,rtype);
 end loop;
 return target_message;
exception when others then
 delete from public.staff_messages where id=target_message and sender_id=auth.uid();
 raise;
end $$;
revoke execute on function public.send_internal_message_multi(uuid,uuid,uuid,uuid,text,text) from public,anon;
grant execute on function public.send_internal_message_multi(uuid,uuid,uuid,uuid,text,text) to authenticated;

create or replace function public.get_sent_message_recipients(target_messages uuid[])
returns table(message_id uuid,recipient_id uuid,recipient_type text) language sql stable security definer set search_path='' as $$
 select r.message_id,r.recipient_id,r.recipient_type
 from public.staff_message_recipients r join public.staff_messages m on m.id=r.message_id
 where m.sender_id=auth.uid() and r.message_id=any(target_messages) and private.is_reliefbridge_internal_user(auth.uid())
$$;
revoke execute on function public.get_sent_message_recipients(uuid[]) from public,anon;
grant execute on function public.get_sent_message_recipients(uuid[]) to authenticated;
