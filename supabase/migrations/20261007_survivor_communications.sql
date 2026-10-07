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
