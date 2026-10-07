create table if not exists public.organization_capabilities (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  communications_mode text not null default 'off' check (communications_mode in ('off','staff_only','staff_survivor')),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.organization_capabilities enable row level security;
grant select on public.organization_capabilities to authenticated;
revoke insert, update, delete on public.organization_capabilities from anon, authenticated;

drop policy if exists "organization members can view capabilities" on public.organization_capabilities;
create policy "organization members can view capabilities"
on public.organization_capabilities
for select
to authenticated
using (
  organization_id in (
    select p.organization_id
    from public.profiles p
    where p.id = (select auth.uid())
      and p.access_status = 'active'
  )
);

comment on table public.organization_capabilities is
'Per-organization optional ReliefBridge capabilities. Communications can be off, staff-only, or staff+survivor.';
