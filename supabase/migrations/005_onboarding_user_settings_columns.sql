-- Sprint 3: Onboarding flow — extend user_settings for new data model
-- ISL-1875

------------------------------------------------------------
-- 1. Add new columns to user_settings
------------------------------------------------------------
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS medication_other text,
  ADD COLUMN IF NOT EXISTS injection_days integer[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dose_amount numeric(5,2),
  ADD COLUMN IF NOT EXISTS dose_unit text DEFAULT 'mg' CHECK (dose_unit IS NULL OR dose_unit IN ('mg', 'mL', 'units')),
  ADD COLUMN IF NOT EXISTS current_weight numeric(6,2),
  ADD COLUMN IF NOT EXISTS goal_weight numeric(6,2),
  ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'lb' CHECK (weight_unit IS NULL OR weight_unit IN ('lb', 'kg')),
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

------------------------------------------------------------
-- 2. Add check constraint for injection_days values (0-6)
------------------------------------------------------------
ALTER TABLE public.user_settings
  ADD CONSTRAINT injection_days_valid
  CHECK (injection_days <@ ARRAY[0,1,2,3,4,5,6]);

------------------------------------------------------------
-- 3. Auto-update updated_at on change
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_settings_updated_at();
