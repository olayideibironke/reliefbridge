-- Disposable PostgreSQL only. Execute after quote_pipeline_integration.sql.
-- Verify the staged privilege lockdown without applying it to production.
\set ON_ERROR_STOP on
\ir ../migrations/20261105_public_intake_insert_lockdown.sql

do $effective_privileges$
begin
  if pg_catalog.has_table_privilege('anon','public.demo_requests','INSERT')
     or pg_catalog.has_table_privilege('authenticated','public.demo_requests','INSERT')
  then
    raise exception 'Public roles retain direct intake INSERT access';
  end if;
end
$effective_privileges$;

-- Attempt an ordinary demo submission under the actual browser-facing role.
set role anon;
do $anonymous_insert_denied$
begin
  begin
    insert into public.demo_requests
      (first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values
      ('Denied','Demo','denied-demo@example.test','Fixture Denied','Other','Director','Ordinary demo');
    raise exception 'FAIL: anonymous demo INSERT was accepted';
  exception when insufficient_privilege then null;
  end;
end
$anonymous_insert_denied$;
reset role;

-- Authenticated browser users cannot use the public table as a write bypass.
set role authenticated;
do $authenticated_insert_denied$
begin
  begin
    insert into public.demo_requests
      (first_name,last_name,work_email,organization_name,organization_type,role_title,message)
    values
      ('Denied','Quote','denied-quote@example.test','Fixture Denied','Other','Director','QUOTE REQUEST');
    raise exception 'FAIL: authenticated direct INSERT was accepted';
  exception when insufficient_privilege then null;
  end;
end
$authenticated_insert_denied$;
reset role;

-- Existing privileged database operations still work in the fixture.
insert into public.demo_requests
  (first_name,last_name,work_email,organization_name,organization_type,role_title,message)
values
  ('Privileged','Intake','privileged@example.test','Fixture Allowed','Other','Director','Ordinary demo');
do $privileged_intake_check$
begin
  if (select count(*) from public.demo_requests where work_email='privileged@example.test') <> 1 then
    raise exception 'Privileged intake INSERT unexpectedly failed';
  end if;
  if (select count(*) from public.demo_requests where work_email='denied-demo@example.test' or work_email='denied-quote@example.test') <> 0 then
    raise exception 'Rejected browser submissions were persisted';
  end if;
end
$privileged_intake_check$;

select 'staged public intake INSERT lockdown passed' as result;
