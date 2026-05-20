-- Add height_cm to user_settings for BMI calculation (ISL-2205)
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,1);
