-- Sprint 2: Meal Planning, Progress, and Settings schema
-- ISL-1655

------------------------------------------------------------
-- 1. Extend meal_plans with week_start_date for weekly planning
------------------------------------------------------------
ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS week_start_date date;

------------------------------------------------------------
-- 2. Create meal_entries table (child of meal_plans)
------------------------------------------------------------
CREATE TABLE public.meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type text NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name text NOT NULL,
  calories integer DEFAULT 0,
  protein_g numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.meal_entries FROM anon;

CREATE POLICY meal_entries_owner_select ON public.meal_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_entries.plan_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY meal_entries_owner_insert ON public.meal_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_entries.plan_id
        AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY meal_entries_owner_update ON public.meal_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_entries.plan_id
        AND mp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_plans mp
      WHERE mp.id = meal_entries.plan_id
        AND mp.user_id = auth.uid()
    )
  );

------------------------------------------------------------
-- 3. Extend progress_tracking with weight_lbs + measurements
------------------------------------------------------------
ALTER TABLE public.progress_tracking
  ADD COLUMN IF NOT EXISTS weight_lbs numeric,
  ADD COLUMN IF NOT EXISTS measurements jsonb DEFAULT '{}'::jsonb;

------------------------------------------------------------
-- 4. Create user_settings table
------------------------------------------------------------
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id),
  medication_name text,
  medication_dose text,
  injection_day text CHECK (injection_day IS NULL OR injection_day IN (
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  )),
  notification_enabled boolean DEFAULT false,
  goal_weight_lbs numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_settings FROM anon;

CREATE POLICY user_settings_owner_select ON public.user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_settings_owner_insert ON public.user_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_owner_update ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

------------------------------------------------------------
-- 5. Grant authenticated role access to new tables
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.meal_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
