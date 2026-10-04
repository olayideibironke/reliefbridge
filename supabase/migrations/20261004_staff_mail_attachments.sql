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
revoke execute on function public.get_my_work_assignments() from anon;
revoke execute on function public.restore_internal_message(uuid) from anon;
revoke execute on function public.trash_internal_message(uuid) from anon;
revoke execute on function public.archive_internal_message(uuid) from anon;
revoke execute on function public.mark_internal_message_read(uuid) from anon;
revoke execute on function public.send_internal_message(uuid,text,text) from anon;
