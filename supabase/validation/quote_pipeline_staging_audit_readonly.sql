-- READ ONLY: run after the staged migrations and synthetic staging smoke tests.
-- Never use these aggregate checks as authorization to inspect or export customer PII.
-- Requires authorized management/database role. No INSERT/UPDATE/DELETE statements.
-- Each finding_count should be zero. Do not output contact emails or record IDs.

-- Duplicate sales opportunities by normalized organization and contact email.
select 'duplicate_normalized_opportunities' as finding,
       count(*) as finding_count
from (
  select 1
  from public.sales_opportunities
  where nullif(btrim(contact_email),'') is not null
    and nullif(btrim(organization_name),'') is not null
  group by lower(btrim(contact_email)), lower(btrim(organization_name))
  having count(*) > 1
) duplicate_groups;

-- Sales activities with a missing opportunity. Normally prevented by FK constraints.
select 'orphan_sales_activities' as finding,
       count(*) as finding_count
from public.sales_activities a
left join public.sales_opportunities o on o.id=a.opportunity_id
where o.id is null;

-- Multiple sales opportunities linked to the same inquiry.
select 'duplicate_inquiry_links' as finding,
       count(*) as finding_count
from (
  select 1
  from public.sales_opportunities
  where demo_request_id is not null
  group by demo_request_id
  having count(*) > 1
) duplicate_links;

-- Aggregate counts for reconciliation against synthetic staging test submissions.
select 'demo_requests' as entity, count(*) as row_count from public.demo_requests
union all
select 'sales_opportunities', count(*) from public.sales_opportunities
union all
select 'sales_activities', count(*) from public.sales_activities;
