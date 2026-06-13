-- =====================================================================
-- ReliefBridge — canonical schema
-- Idempotent. Safe to re-run.
-- If you have existing tables from earlier dev work whose column shape
-- differs from this file, drop them first or migrate by hand.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 2. Helper — returns the org_id of the currently authenticated user
-- ---------------------------------------------------------------------
create or replace function public.auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- ---------------------------------------------------------------------
-- 3. Organizations
-- ---------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in (
    'LTRG','VOAD','Nonprofit','Church','County','State',
    'Housing Partner','Legal Aid','Mental Health','Volunteer Group'
  )),
  city text,
  state text,
  website text,
  phone text,
  email text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orgs_type on public.organizations(type);
create index if not exists idx_orgs_state on public.organizations(state);

-- ---------------------------------------------------------------------
-- 4. Profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  first_name text,
  last_name text,
  email text unique,
  title text,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  phone text,
  notification_settings jsonb not null default jsonb_build_object(
    'new_case', true,
    'new_referral', true,
    'referral_status_change', true,
    'weekly_digest', true
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_org on public.profiles(organization_id);

-- ---------------------------------------------------------------------
-- 5. Survivors
-- ---------------------------------------------------------------------
create table if not exists public.survivors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  disaster_event text,
  county text,
  state text,
  status text not null default 'active' check (status in ('active','closed','referred_out','duplicate')),
  assigned_case_manager uuid references public.profiles(id) on delete set null,
  household_size int,
  notes text,
  consent_given boolean not null default false,
  consent_given_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_survivors_org on public.survivors(organization_id);
create index if not exists idx_survivors_status on public.survivors(status);
create index if not exists idx_survivors_event on public.survivors(disaster_event);

-- ---------------------------------------------------------------------
-- 6. Recovery cases
-- ---------------------------------------------------------------------
create table if not exists public.recovery_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  survivor_id uuid not null references public.survivors(id) on delete cascade,
  case_manager uuid references public.profiles(id) on delete set null,
  disaster_type text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','in_review','follow_up','on_hold','closed')),
  primary_need text,
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cases_org on public.recovery_cases(organization_id);
create index if not exists idx_cases_survivor on public.recovery_cases(survivor_id);
create index if not exists idx_cases_status on public.recovery_cases(status);
create index if not exists idx_cases_priority on public.recovery_cases(priority);

-- ---------------------------------------------------------------------
-- 7. Case notes
-- ---------------------------------------------------------------------
create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.recovery_cases(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_notes_case on public.case_notes(case_id);

-- ---------------------------------------------------------------------
-- 8. Unmet needs
-- ---------------------------------------------------------------------
create table if not exists public.unmet_needs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  survivor_id uuid not null references public.survivors(id) on delete cascade,
  category text not null check (category in (
    'Housing','Repair','Transportation','Food','Mental Health',
    'Legal Aid','Child Care','Medical','Utilities'
  )),
  description text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'open' check (status in ('open','in_progress','met','unable_to_meet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_needs_org on public.unmet_needs(organization_id);
create index if not exists idx_needs_survivor on public.unmet_needs(survivor_id);
create index if not exists idx_needs_status on public.unmet_needs(status);
create index if not exists idx_needs_category on public.unmet_needs(category);

-- ---------------------------------------------------------------------
-- 9. Referrals (cross-org)
-- ---------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  survivor_id uuid not null references public.survivors(id) on delete cascade,
  sending_org uuid not null references public.organizations(id) on delete restrict,
  receiving_org uuid not null references public.organizations(id) on delete restrict,
  category text not null check (category in (
    'Housing','Repair','Transportation','Food','Mental Health',
    'Legal Aid','Child Care','Medical','Utilities'
  )),
  status text not null default 'Pending' check (status in (
    'Pending','Accepted','In Progress','Completed','Declined'
  )),
  notes text,
  responded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_referrals_survivor on public.referrals(survivor_id);
create index if not exists idx_referrals_sending on public.referrals(sending_org);
create index if not exists idx_referrals_receiving on public.referrals(receiving_org);
create index if not exists idx_referrals_status on public.referrals(status);

-- ---------------------------------------------------------------------
-- 10. updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'organizations','profiles','survivors',
      'recovery_cases','unmet_needs','referrals'
    ])
  loop
    execute format('drop trigger if exists trg_%I_touch on public.%I;', t, t);
    execute format('create trigger trg_%I_touch before update on public.%I for each row execute function public.touch_updated_at();', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 11. Auto-create profile row on signup
--     Captured fields come from raw_user_meta_data set during signup.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 12. RLS — enable
-- ---------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.survivors enable row level security;
alter table public.recovery_cases enable row level security;
alter table public.case_notes enable row level security;
alter table public.unmet_needs enable row level security;
alter table public.referrals enable row level security;

-- Drop any prior policies in public schema so this script is the source of truth
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname='public' loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 13. Policies
-- ---------------------------------------------------------------------

-- Organizations
create policy orgs_read_all on public.organizations
  for select to authenticated using (true);
create policy orgs_insert_authenticated on public.organizations
  for insert to authenticated with check (true);
create policy orgs_update_own on public.organizations
  for update to authenticated
  using (id = public.auth_org_id())
  with check (id = public.auth_org_id());

-- Profiles
create policy profiles_read_same_org on public.profiles
  for select to authenticated using (
    organization_id = public.auth_org_id() or id = auth.uid()
  );
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Survivors
create policy survivors_select on public.survivors
  for select to authenticated using (organization_id = public.auth_org_id());
create policy survivors_insert on public.survivors
  for insert to authenticated with check (organization_id = public.auth_org_id());
create policy survivors_update on public.survivors
  for update to authenticated
  using (organization_id = public.auth_org_id())
  with check (organization_id = public.auth_org_id());
create policy survivors_delete on public.survivors
  for delete to authenticated using (organization_id = public.auth_org_id());

-- Recovery cases
create policy cases_select on public.recovery_cases
  for select to authenticated using (organization_id = public.auth_org_id());
create policy cases_insert on public.recovery_cases
  for insert to authenticated with check (organization_id = public.auth_org_id());
create policy cases_update on public.recovery_cases
  for update to authenticated
  using (organization_id = public.auth_org_id())
  with check (organization_id = public.auth_org_id());
create policy cases_delete on public.recovery_cases
  for delete to authenticated using (organization_id = public.auth_org_id());

-- Case notes
create policy notes_select on public.case_notes
  for select to authenticated using (organization_id = public.auth_org_id());
create policy notes_insert on public.case_notes
  for insert to authenticated with check (
    organization_id = public.auth_org_id() and author_id = auth.uid()
  );
create policy notes_delete on public.case_notes
  for delete to authenticated using (organization_id = public.auth_org_id());

-- Unmet needs
create policy needs_select on public.unmet_needs
  for select to authenticated using (organization_id = public.auth_org_id());
create policy needs_insert on public.unmet_needs
  for insert to authenticated with check (organization_id = public.auth_org_id());
create policy needs_update on public.unmet_needs
  for update to authenticated
  using (organization_id = public.auth_org_id())
  with check (organization_id = public.auth_org_id());
create policy needs_delete on public.unmet_needs
  for delete to authenticated using (organization_id = public.auth_org_id());

-- Referrals (visible to either side, mutable per side)
create policy referrals_select on public.referrals
  for select to authenticated using (
    sending_org = public.auth_org_id() or receiving_org = public.auth_org_id()
  );
create policy referrals_insert on public.referrals
  for insert to authenticated with check (sending_org = public.auth_org_id());
create policy referrals_update_sender on public.referrals
  for update to authenticated
  using (sending_org = public.auth_org_id())
  with check (sending_org = public.auth_org_id());
create policy referrals_update_receiver on public.referrals
  for update to authenticated
  using (receiving_org = public.auth_org_id())
  with check (receiving_org = public.auth_org_id());
create policy referrals_delete on public.referrals
  for delete to authenticated using (sending_org = public.auth_org_id());

-- =====================================================================
-- Done.
-- =====================================================================
