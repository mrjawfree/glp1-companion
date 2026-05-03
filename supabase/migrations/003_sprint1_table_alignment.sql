-- Sprint 1 table alignment (ISL-1642)
-- Align table names to ISL-1597 spec: dose_logs→doses, food_entries→meals
-- Add side_effects table and injection_site column per Sprint 1 acceptance criteria

-- Rename tables to spec names
ALTER TABLE public.dose_logs RENAME TO doses;
ALTER TABLE public.food_entries RENAME TO meals;

-- Add injection_site column for SVG site selector (Sprint 1 dose logging)
ALTER TABLE public.doses ADD COLUMN injection_site text;

-- Revoke anon on renamed tables
REVOKE ALL ON public.doses FROM anon;
REVOKE ALL ON public.meals FROM anon;

-- Create side_effects table per ISL-1597 spec
CREATE TABLE public.side_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dose_id uuid REFERENCES public.doses(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reported_at timestamptz NOT NULL DEFAULT now(),
  symptom text NOT NULL,
  severity smallint NOT NULL CHECK (severity BETWEEN 1 AND 5),
  energy_level smallint CHECK (energy_level BETWEEN 1 AND 5),
  notes text
);

CREATE INDEX side_effects_user_reported_at_idx ON public.side_effects (user_id, reported_at DESC);

-- RLS for side_effects
ALTER TABLE public.side_effects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.side_effects FROM anon;

CREATE POLICY side_effects_owner_select ON public.side_effects
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY side_effects_owner_insert ON public.side_effects
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY side_effects_owner_update ON public.side_effects
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
