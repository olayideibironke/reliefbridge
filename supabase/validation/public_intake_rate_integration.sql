-- Disposable PostgreSQL only. Run after quote_pipeline_integration.sql.
\set ON_ERROR_STOP on
\ir ../migrations/20261105_public_intake_rate_guard.sql

-- Ordinary demos and quotes share the same per-email limit.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Rate','Demo','rate@example.test','Rate Agency','Other','Director','Demo request');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Rate','Quote','rate@example.test','Rate Agency','Other','Director','QUOTE REQUEST first');
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values ('Rate','Demo','rate@example.test','Rate Agency','Other','Director','Second demo');
do $rate_reject$
begin
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Rate','Demo','rate@example.test','Rate Agency','Other','Director','Fourth request');
    raise exception 'FAIL: per-email hourly limit was bypassed';
  exception when sqlstate 'RB002' then null;
  end;
  if (select count(*) from public.demo_requests where work_email='rate@example.test') <> 3 then
    raise exception 'Rejected rate-limited request was persisted';
  end if;
end
$rate_reject$;

select 'public intake rate guard passed' as result;
