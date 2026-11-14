-- READ ONLY: run after the staged migrations and synthetic staging smoke tests.
-- Never use these aggregate checks as authorization to inspect or export customer PII.
-- Requires authorized management/database role. No INSERT/UPDATE/DELETE statements.
-- Zero rows from the first three queries is the desired result.

-- Duplicate sales opportunities by normalized organization and contact email.
select lower(btrim(contact_email)) as normalized_contact_email,
       lower(btrim(organization_name)) as normalized_organization,
       count(*) as opportunity_count
from public.sales_opportunities
where nullif(btrim(contact_email),'') is not null
  and nullif(btrim(organization_name),'') is not null
group by 1,2
having count(*) > 1;

-- Sales activities with a missing opportunity. Normally prevented by FK constraints.
select a.id
from public.sales_activities a
left join public.sales_opportunities o on o.id=a.opportunity_id
where o.id is null;

-- Multiple sales opportunities linked to the same inquiry.
select demo_request_id, count(*) as opportunity_count
from public.sales_opportunities
where demo_request_id is not null
group by demo_request_id
having count(*) > 1;

-- Aggregate counts for reconciliation against synthetic staging test submissions.
select 'demo_requests' as entity, count(*) as row_count from public.demo_requests
union all
select 'sales_opportunities', count(*) from public.sales_opportunities
union all
select 'sales_activities', count(*) from public.sales_activities;
