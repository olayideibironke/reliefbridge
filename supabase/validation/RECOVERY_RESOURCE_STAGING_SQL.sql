-- Customer-led recovery resource modules. Staging first; no production execution.
-- All records are scoped to an existing organization and optionally a recovery case.
CREATE TABLE IF NOT EXISTS public.recovery_funding (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 case_id uuid REFERENCES public.recovery_cases(id) ON DELETE SET NULL,
 source_name text NOT NULL CHECK (length(trim(source_name)) BETWEEN 1 AND 200),
 reference_code text,
 committed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
 disbursed_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (disbursed_amount >= 0 AND disbursed_amount <= committed_amount),
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recovery_repairs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 case_id uuid REFERENCES public.recovery_cases(id) ON DELETE SET NULL,
 project_name text NOT NULL CHECK (length(trim(project_name)) BETWEEN 1 AND 200),
 contractor_name text,
 status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','on_hold','completed','cancelled')),
 percent_complete integer NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
 estimated_cost numeric(14,2) CHECK (estimated_cost >= 0),
 start_date date,
 target_date date,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recovery_expenses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 case_id uuid REFERENCES public.recovery_cases(id) ON DELETE SET NULL,
 funding_id uuid REFERENCES public.recovery_funding(id) ON DELETE SET NULL,
 repair_id uuid REFERENCES public.recovery_repairs(id) ON DELETE SET NULL,
 description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 300),
 amount numeric(14,2) NOT NULL CHECK (amount >= 0),
 expense_date date NOT NULL DEFAULT CURRENT_DATE,
 document_reference text,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.recovery_donations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
 case_id uuid REFERENCES public.recovery_cases(id) ON DELETE SET NULL,
 unmet_need_id uuid REFERENCES public.unmet_needs(id) ON DELETE SET NULL,
 donor_name text,
 item_name text NOT NULL CHECK (length(trim(item_name)) BETWEEN 1 AND 200),
 unit text NOT NULL DEFAULT 'items',
 quantity_received numeric(12,2) NOT NULL CHECK (quantity_received > 0),
 quantity_allocated numeric(12,2) NOT NULL DEFAULT 0 CHECK (quantity_allocated >= 0 AND quantity_allocated <= quantity_received),
 estimated_value numeric(14,2) CHECK (estimated_value >= 0),
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
-- Prevent cross-organization links even when an authenticated caller knows a UUID.
CREATE OR REPLACE FUNCTION public.recovery_resource_same_org()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE linked_org uuid;
BEGIN
 IF NEW.case_id IS NOT NULL THEN
  SELECT organization_id INTO linked_org FROM public.recovery_cases WHERE id = NEW.case_id;
  IF linked_org IS DISTINCT FROM NEW.organization_id THEN RAISE EXCEPTION 'Recovery case belongs to another organization'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'recovery_expenses' THEN
  IF NEW.funding_id IS NOT NULL THEN
   SELECT organization_id INTO linked_org FROM public.recovery_funding WHERE id = NEW.funding_id;
   IF linked_org IS DISTINCT FROM NEW.organization_id THEN RAISE EXCEPTION 'Funding belongs to another organization'; END IF;
  END IF;
  IF NEW.repair_id IS NOT NULL THEN
   SELECT organization_id INTO linked_org FROM public.recovery_repairs WHERE id = NEW.repair_id;
   IF linked_org IS DISTINCT FROM NEW.organization_id THEN RAISE EXCEPTION 'Repair belongs to another organization'; END IF;
  END IF;
 END IF;
 IF TG_TABLE_NAME = 'recovery_donations' AND NEW.unmet_need_id IS NOT NULL THEN
  SELECT organization_id INTO linked_org FROM public.unmet_needs WHERE id = NEW.unmet_need_id;
  IF linked_org IS DISTINCT FROM NEW.organization_id THEN RAISE EXCEPTION 'Unmet need belongs to another organization'; END IF;
 END IF;
 RETURN NEW;
END $$;
DO $$
DECLARE tbl text;
BEGIN
 FOREACH tbl IN ARRAY ARRAY['recovery_funding','recovery_repairs','recovery_expenses','recovery_donations'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tbl);
  EXECUTE format('DROP TRIGGER IF EXISTS recovery_resource_org_guard ON public.%I',tbl);
  EXECUTE format('CREATE TRIGGER recovery_resource_org_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.recovery_resource_same_org()',tbl);
  EXECUTE format('DROP POLICY IF EXISTS recovery_resource_select ON public.%I',tbl);
  EXECUTE format('CREATE POLICY recovery_resource_select ON public.%I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.organization_id = organization_id))',tbl);
 END LOOP;
END $$;
-- Intentionally no INSERT/UPDATE/DELETE policy until the role and managed-demo
-- write restrictions have passed staging acceptance. No browser writes are permitted.
