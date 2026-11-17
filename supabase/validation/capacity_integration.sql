-- Disposable PostgreSQL integration fixture only. Never run on production.
\set ON_ERROR_STOP on
create schema if not exists public;
-- Supabase provides these roles; create fixture-only NOLOGIN equivalents.
do $capacity_test$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $capacity_test$;
create table public.organizations (id uuid primary key);
create table public.recovery_cases (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  status text not null
);
create table public.profiles (
  id uuid primary key,
  organization_id uuid references public.organizations(id),
  access_status text not null check (access_status in ('invited','active','disabled'))
);
-- Reproduce the existing live authorization triggers alongside staged capacity guards.
-- Fixture-only auth.uid() reads a session setting; no production function is changed.
create schema auth;
create schema private;
create function auth.uid() returns uuid language sql stable
as $ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $;

create function private.protect_profile_authorization_fields()
returns trigger language plpgsql security definer set search_path = ''
as $
begin
  if auth.uid() is not null and new.id = auth.uid() then
    if new.organization_id is distinct from old.organization_id
       or new.role is distinct from old.role
       or new.access_status is distinct from old.access_status
       or new.invited_by is distinct from old.invited_by
       or new.invited_at is distinct from old.invited_at
       or new.staff_id is distinct from old.staff_id
       or new.email is distinct from old.email
       or new.personal_email is distinct from old.personal_email
       or new.department is distinct from old.department
       or new.must_set_password is distinct from old.must_set_password then
      raise exception 'Protected profile authorization fields cannot be changed by the signed-in user';
    end if;
  end if;
  return new;
end;
$;
-- Fixture adds the protected columns referenced by the live trigger.
alter table public.profiles
  add column role text, add column invited_by uuid, add column invited_at timestamptz,
  add column staff_id uuid, add column email text, add column personal_email text,
  add column department text, add column must_set_password boolean;
create trigger protect_profile_authorization_fields before update on public.profiles
for each row execute function private.protect_profile_authorization_fields();

create function private.prevent_organization_id_change()
returns trigger language plpgsql set search_path = ''
as $
begin
  if auth.uid() is not null
     and new.organization_id is distinct from old.organization_id then
    raise exception 'Organization ownership cannot be changed.';
  end if;
  return new;
end;
$;
create trigger protect_case_organization before update on public.recovery_cases
for each row execute function private.prevent_organization_id_change();

\ir ../migrations/20261102_capacity_configuration.sql
\ir ../migrations/20261102_case_capacity_guard.sql
\ir ../migrations/20261103_staff_capacity_guard.sql

insert into public.organizations values
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002');
insert into public.organization_capacity_policies
 (organization_id, active_case_limit, enforce_case_limit, staff_limit, enforce_staff_limit)
values
 ('00000000-0000-0000-0000-000000000001', 1, true, 1, true);

-- Disabled org remains unrestricted.
insert into public.recovery_cases values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','open'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','open');
insert into public.profiles values
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','active'),
 ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','active');

insert into public.recovery_cases values
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','open');
insert into public.profiles values
 ('20000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','active');

do $$
begin
  begin
    insert into public.recovery_cases values
      ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','open');
    raise exception 'FAIL: over-cap case insert unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active case limit reached' then raise; end if;
  end;
  begin
    insert into public.profiles values
      ('20000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001','active');
    raise exception 'FAIL: over-cap staff insert unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active staff limit reached' then raise; end if;
  end;
end $$;

-- Closing frees capacity. Reopening while full must fail.
update public.recovery_cases set status='closed' where id='10000000-0000-0000-0000-000000000003';
insert into public.recovery_cases values
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','open');
do $$
begin
  begin
    update public.recovery_cases set status='open' where id='10000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: over-cap reopening unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active case limit reached' then raise; end if;
  end;
end $$;

-- Ordinary active edits are permitted at capacity.
update public.recovery_cases set status='follow_up'
where id='10000000-0000-0000-0000-000000000005';
-- Transfers into a full destination must fail.
do $$
begin
  begin
    update public.recovery_cases set organization_id='00000000-0000-0000-0000-000000000001'
    where id='10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: over-cap transfer unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active case limit reached' then raise; end if;
  end;
end $$;

-- Staff deactivation frees a seat; activation at the cap is rejected.
update public.profiles set access_status='disabled'
where id='20000000-0000-0000-0000-000000000003';
insert into public.profiles values
 ('20000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001','active');
do $capacity_extra$
begin
  begin
    update public.profiles set access_status='active'
    where id='20000000-0000-0000-0000-000000000003';
    raise exception 'FAIL: over-cap staff reactivation unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active staff limit reached' then raise; end if;
  end;
  begin
    update public.profiles
    set organization_id='00000000-0000-0000-0000-000000000001'
    where id='20000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: over-cap staff transfer unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization active staff limit reached' then raise; end if;
  end;
end $capacity_extra$;

-- Disabling enforcement immediately restores unrestricted writes.
update public.organization_capacity_policies
set enforce_case_limit=false, enforce_staff_limit=false
where organization_id='00000000-0000-0000-0000-000000000001';
insert into public.recovery_cases values
 ('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','open');
insert into public.profiles values
 ('20000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000001','active');

-- Configuration cannot enable enforcement without an approved numeric limit.
do $capacity_extra$
begin
  begin
    update public.organization_capacity_policies
    set active_case_limit=null, enforce_case_limit=true
    where organization_id='00000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: missing case limit unexpectedly accepted';
  exception when check_violation then null;
  end;
  begin
    update public.organization_capacity_policies
    set staff_limit=null, enforce_staff_limit=true
    where organization_id='00000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: missing staff limit unexpectedly accepted';
  exception when check_violation then null;
  end;
end $capacity_extra$;

-- Verify live authorization triggers still block signed-in self-escalation
-- and case ownership transfer even when capacity enforcement is disabled.
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000008', false);
do $compat$
begin
  begin
    update public.profiles set access_status='disabled'
    where id='20000000-0000-0000-0000-000000000008';
    raise exception 'FAIL: self-service access-status change succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Protected profile authorization fields cannot be changed by the signed-in user' then raise; end if;
  end;
  begin
    update public.recovery_cases
    set organization_id='00000000-0000-0000-0000-000000000002'
    where id='10000000-0000-0000-0000-000000000008';
    raise exception 'FAIL: signed-in case organization transfer succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'Organization ownership cannot be changed.' then raise; end if;
  end;
end $compat$;
select set_config('request.jwt.claim.sub', '', false);
-- Privileged administration can still deactivate staff and transfer cases.
update public.profiles set access_status='disabled'
where id='20000000-0000-0000-0000-000000000008';
update public.recovery_cases set organization_id='00000000-0000-0000-0000-000000000002'
where id='10000000-0000-0000-0000-000000000008';
do $compat$
begin
  if (select access_status from public.profiles where id='20000000-0000-0000-0000-000000000008') <> 'disabled' then
    raise exception 'FAIL: privileged staff deactivation blocked';
  end if;
  if (select organization_id from public.recovery_cases where id='10000000-0000-0000-0000-000000000008')
     <> '00000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'FAIL: privileged case transfer blocked';
  end if;
end $compat$;

select 'capacity integration smoke tests passed' as result;
