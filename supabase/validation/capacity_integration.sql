-- Disposable PostgreSQL integration fixture only. Never run on production.
\set ON_ERROR_STOP on
create schema if not exists public;
create table public.organizations (id uuid primary key);
create table public.recovery_cases (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  status text not null
);
create table public.profiles (
  id uuid primary key,
  organization_id uuid references public.organizations(id),
  access_status text not null
);
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
select 'capacity integration smoke tests passed' as result;
