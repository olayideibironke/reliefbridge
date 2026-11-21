-- Returns only the current authenticated demo user's preferred interface language.
CREATE OR REPLACE FUNCTION public.get_my_demo_locale()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT d.preferred_locale
  FROM public.demo_workspaces d
  WHERE d.auth_user_id = (SELECT auth.uid())
    AND d.status = 'active'
    AND d.expires_at > now()
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_my_demo_locale() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_demo_locale() TO authenticated;
