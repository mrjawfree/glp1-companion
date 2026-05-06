-- Sprint 3: Onboarding redesign — add display_name and tracking_preferences
-- ISL-1912

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tracking_preferences text[] DEFAULT '{}';

ALTER TABLE public.user_settings
  ADD CONSTRAINT tracking_preferences_valid
  CHECK (tracking_preferences <@ ARRAY['weight','doses','meals','side_effects']::text[]);
