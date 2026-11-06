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

-- Rotating email addresses must not bypass the per-organization quota.
do $organization_rate$
declare i integer;
begin
  for i in 1..10 loop
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Org','Lead','org-' || i || '@example.test','Shared Organization','Other','Director','Ordinary demo');
  end loop;
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Org','Lead','org-11@example.test','Shared Organization','Other','Director','QUOTE REQUEST bypass attempt');
    raise exception 'FAIL: per-organization limit was bypassed by rotating email';
  exception when sqlstate 'RB002' then null;
  end;
  if (select count(*) from public.demo_requests where organization_name='Shared Organization') <> 10 then
    raise exception 'Organization rate guard did not enforce exactly ten requests';
  end if;
end
$organization_rate$;

-- Rotating both email and organization must eventually hit the global cap.
-- Use distinct synthetic identities to avoid the smaller per-identity quotas.
do $global_rate$
declare
  i integer := 0;
  accepted_count integer;
begin
  select count(*) into accepted_count from public.demo_requests
    where created_at >= pg_catalog.now() - interval '1 hour';
  if accepted_count > 120 then
    raise exception 'Fixture already exceeds the global intake quota';
  end if;
  while accepted_count < 120 loop
    i := i + 1;
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Global','Lead','global-' || i || '@example.test',
      'Unique Agency ' || i,'Other','Director','Ordinary demo');
    accepted_count := accepted_count + 1;
  end loop;
  begin
    insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values ('Global','Lead','global-overflow@example.test','Overflow Agency','Other','Director','Ordinary demo');
    raise exception 'FAIL: global limit was bypassed by rotating all identities';
  exception when sqlstate 'RB002' then null;
  end;
  if (select count(*) from public.demo_requests
      where created_at >= pg_catalog.now() - interval '1 hour') <> 120 then
    raise exception 'Global quota did not preserve the expected accepted count';
  end if;
end
$global_rate$;

-- An internal privileged record must remain writable after website quota saturation.
-- It must not be counted against public intake volume.
insert into public.demo_requests(first_name,last_name,work_email,organization_name,organization_type,role_title,source,message)
values ('Internal','Lead','internal-allowed@example.test','Internal Agency','Other','Director','Internal','Privileged management intake');
do $internal_not_limited$
begin
  if (select count(*) from public.demo_requests
      where work_email='internal-allowed@example.test' and source='Internal') <> 1 then
    raise exception 'Internal privileged intake was blocked by website quota';
  end if;
end
$internal_not_limited$;

select 'public intake rate guard passed' as result;
