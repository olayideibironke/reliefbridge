\set ON_ERROR_STOP on
-- Disposable PostgreSQL only. Synthetic fixtures, no Supabase production connection.
create schema if not exists auth;
create schema if not exists private;
create role authenticated;
create role anon;
create table public.profiles(id uuid primary key, organization_id uuid);
create table public.staff_messages(
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  subject text not null,
  body text not null
);
create table public.staff_message_recipients(
  message_id uuid not null references public.staff_messages(id),
  recipient_id uuid not null references public.profiles(id),
  unique(message_id, recipient_id)
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$$;
create function private.is_reliefbridge_internal_user(target uuid)
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id=target)
$$;
insert into public.profiles(id,organization_id) values
 ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000004',null);
\ir ../migrations/20261113_legacy_internal_message_tenant_guard.sql
grant usage on schema public,auth,private to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function private.is_reliefbridge_internal_user(uuid) to authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $test$
declare
  mid uuid;
  before_count bigint;
begin
  mid := public.send_internal_message('00000000-0000-0000-0000-000000000002','Same tenant','Allowed');
  if not exists(select 1 from public.staff_message_recipients where message_id=mid and recipient_id='00000000-0000-0000-0000-000000000002') then
    raise exception 'FAIL: same tenant message was not persisted';
  end if;
  select count(*) into before_count from public.staff_messages;
  begin
    perform public.send_internal_message('00000000-0000-0000-0000-000000000003','Cross tenant','Denied');
    raise exception 'FAIL: cross-tenant send succeeded';
  exception when raise_exception then
    if sqlerrm not like 'Recipient must belong to your organization%' then raise; end if;
  end;
  begin
    perform public.send_internal_message('00000000-0000-0000-0000-000000000004','Null org','Denied');
    raise exception 'FAIL: null-org recipient accepted';
  exception when raise_exception then
    if sqlerrm not like 'Recipient must belong to your organization%' then raise; end if;
  end;
  if (select count(*) from public.staff_messages) <> before_count then
    raise exception 'FAIL: rejected messages persisted';
  end if;
end
$test$;
-- A sender with no organization must also be rejected.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
do $test$
begin
  begin
    perform public.send_internal_message('00000000-0000-0000-0000-000000000002','No org','Denied');
    raise exception 'FAIL: null-org sender accepted';
  exception when raise_exception then
    if sqlerrm not like 'Recipient must belong to your organization%' then raise; end if;
  end;
end
$test$;
do $test$
begin
  if not has_function_privilege('authenticated','public.send_internal_message(uuid,text,text)','EXECUTE') then
    raise exception 'FAIL: authenticated role lost execute';
  end if;
  if has_function_privilege('anon','public.send_internal_message(uuid,text,text)','EXECUTE') then
    raise exception 'FAIL: anon role can execute';
  end if;
end
$test$;
select 'Legacy tenant isolation SQL integration passed' as result;
