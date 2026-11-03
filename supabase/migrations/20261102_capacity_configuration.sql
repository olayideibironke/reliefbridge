-- Capacity configuration only. No enforcement is activated by this migration.
create table if not exists public.organization_capacity_policies (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  active_case_limit integer check (active_case_limit >= 0),
  enforce_case_limit boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.organization_capacity_policies enable row level security;
revoke all on public.organization_capacity_policies from anon, authenticated;

comment on table public.organization_capacity_policies is
  'Capacity configuration staged for explicit contractual approval; no active enforcement by default.';
