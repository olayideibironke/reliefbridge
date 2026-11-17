-- Staging-only rehearsal SQL for multilingual Demo Hub.
-- Apply through the approved release migration process after full-schema preflight.
-- Existing demo workspaces remain English by default.
-- No new grants or policies: the existing demo_workspaces RLS remains in force.
ALTER TABLE public.demo_workspaces
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'en';

ALTER TABLE public.demo_workspaces
  DROP CONSTRAINT IF EXISTS demo_workspaces_preferred_locale_check;

ALTER TABLE public.demo_workspaces
  ADD CONSTRAINT demo_workspaces_preferred_locale_check
  CHECK (preferred_locale IN ('en', 'es', 'fr'));

COMMENT ON COLUMN public.demo_workspaces.preferred_locale IS
  'Language selected for demo invitation and initial managed workspace experience.';
