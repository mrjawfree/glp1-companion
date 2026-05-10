-- Notification settings: per-user preferences for all 13 notification types
-- plus quiet hours config. Replaces the single notification_enabled flag.

CREATE TABLE IF NOT EXISTS notification_settings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  permission_state         text NOT NULL DEFAULT 'default',

  -- Quiet hours
  quiet_hours_enabled      boolean NOT NULL DEFAULT false,
  quiet_hours_from         text NOT NULL DEFAULT '21:30',
  quiet_hours_to           text NOT NULL DEFAULT '07:00',
  quiet_hours_allow_medical boolean NOT NULL DEFAULT true,

  -- Category A: Medication
  dose_reminder_enabled    boolean NOT NULL DEFAULT true,
  dose_reminder_weekday    smallint NOT NULL DEFAULT 0,
  dose_reminder_time       text NOT NULL DEFAULT '09:00',
  dose_prep_enabled        boolean NOT NULL DEFAULT true,
  dose_missed_enabled      boolean NOT NULL DEFAULT true,
  refill_reminder_enabled  boolean NOT NULL DEFAULT true,
  refill_threshold_days    smallint NOT NULL DEFAULT 7,

  -- Category B: Wellness
  side_effect_checkin_enabled boolean NOT NULL DEFAULT true,
  hydration_nudge_enabled    boolean NOT NULL DEFAULT true,
  hydration_interval_hours   smallint NOT NULL DEFAULT 3,
  hydration_window_start     text NOT NULL DEFAULT '10:00',
  hydration_window_end       text NOT NULL DEFAULT '19:00',
  protein_reminder_enabled   boolean NOT NULL DEFAULT false,

  -- Category C: Logging
  meal_log_enabled         boolean NOT NULL DEFAULT true,
  meal_log_breakfast_time  text NOT NULL DEFAULT '09:00',
  meal_log_lunch_time      text NOT NULL DEFAULT '13:30',
  meal_log_dinner_time     text NOT NULL DEFAULT '19:30',
  weight_checkin_enabled   boolean NOT NULL DEFAULT true,
  weight_checkin_weekday   smallint NOT NULL DEFAULT 6,
  weight_checkin_time      text NOT NULL DEFAULT '08:00',

  -- Category D: Progress
  weekly_summary_enabled   boolean NOT NULL DEFAULT true,
  milestone_enabled        boolean NOT NULL DEFAULT true,
  comeback_enabled         boolean NOT NULL DEFAULT false,

  last_delivered_at        timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
