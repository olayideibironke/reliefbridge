create table if not exists public.organization_billing (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_subscription_status text not null default 'not_configured',
  stripe_base_price_id text,
  stripe_additional_user_price_id text,
  licensed_organizational_users integer not null default 15 check (licensed_organizational_users >= 1),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_billing enable row level security;
revoke all on table public.organization_billing from anon, authenticated;
grant select on table public.organization_billing to authenticated;

drop policy if exists organization_billing_select_member on public.organization_billing;
create policy organization_billing_select_member
on public.organization_billing for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.organization_id = organization_billing.organization_id
      and p.access_status = 'active'
  )
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from anon, authenticated;
