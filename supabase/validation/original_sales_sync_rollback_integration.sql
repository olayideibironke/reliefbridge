-- Disposable PostgreSQL fixture only. Must run after quote_pipeline_integration.sql.
-- Rehearses the saved original function definition and its original demo behavior.
-- This does NOT constitute a full-schema staging rollback or authorize production writes.
\set ON_ERROR_STOP on

-- The quote fixture installs the replacement function. Confirm it is in effect.
do $before_restore$
begin
  if position('is_quote boolean' in pg_get_functiondef('public.sync_demo_request_to_sales()'::regprocedure)) = 0 then
    raise exception 'Expected quote-aware function before rollback rehearsal';
  end if;
end
$before_restore$;

-- Apply the exact captured original function body, not a reconstructed approximation.
\ir rollback_original_sales_sync_20261115.sql

do $after_restore$
begin
  if position('is_quote boolean' in pg_get_functiondef('public.sync_demo_request_to_sales()'::regprocedure)) > 0 then
    raise exception 'Quote-aware function was not replaced by original definition';
  end if;
  if not exists (
    select 1 from pg_proc
    where oid = 'public.sync_demo_request_to_sales()'::regprocedure
      and prosecdef
  ) then
    raise exception 'Restored sales-sync function lost SECURITY DEFINER';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.demo_requests'::regclass
      and tgname = 'demo_request_sales_sync'
      and tgenabled in ('O','A')
  ) then
    raise exception 'Original sales-sync trigger not enabled';
  end if;
end
$after_restore$;

-- A fresh synthetic demo must continue to create its opportunity and activity.
insert into public.demo_requests
(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Rollback','Demo','rollback-demo@example.test','Rollback Demo Organization',
        'Other','Director','Original demo workflow after restore');

do $restored_demo$
begin
  if (select count(*) from public.sales_opportunities
      where contact_email='rollback-demo@example.test'
        and organization_name='Rollback Demo Organization'
        and stage='Demo Requested'
        and next_action='Review demo request and contact prospect') <> 1 then
    raise exception 'Original demo opportunity failed after function restore';
  end if;
  if (select count(*) from public.sales_activities a
      join public.sales_opportunities o on o.id=a.opportunity_id
      where o.contact_email='rollback-demo@example.test'
        and a.activity_type='Demo Request') <> 1 then
    raise exception 'Original demo activity failed after function restore';
  end if;
end
$restored_demo$;

select 'original sales-sync rollback rehearsal passed on disposable fixture' as result;
