-- Notification settings per user (preferences, quiet hours, per-type config)
CREATE TABLE IF NOT EXISTS notification_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiet_hours_enabled    boolean NOT NULL DEFAULT false,
  quiet_hours_from       text NOT NULL DEFAULT '21:30',
  quiet_hours_to         text NOT NULL DEFAULT '07:00',
  quiet_hours_allow_medical boolean NOT NULL DEFAULT true,
  preferences    jsonb NOT NULL DEFAULT '{}'::jsonb,
  permission_state text NOT NULL DEFAULT 'default',
  deferred_until  timestamptz,
  last_delivered_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled notification sends (cron picks due rows)
CREATE TABLE IF NOT EXISTS notification_schedule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  fire_at_utc     timestamptz NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'pending',
  context_id      text,
  retry_count     int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_schedule_fire
  ON notification_schedule (fire_at_utc)
  WHERE status = 'pending';

CREATE INDEX idx_notification_schedule_user_key
  ON notification_schedule (user_id, notification_key);

ALTER TABLE notification_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own schedules"
  ON notification_schedule
  FOR SELECT
  USING (auth.uid() = user_id);

-- Notification event log (analytics: send/deliver/open/action)
CREATE TABLE IF NOT EXISTS notification_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  event_type      text NOT NULL,
  sent_at         timestamptz,
  delivered_at    timestamptz,
  opened_at       timestamptz,
  action_taken    text,
  schedule_id     uuid REFERENCES notification_schedule(id),
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_events_user
  ON notification_events (user_id, notification_key, created_at DESC);

ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notification events"
  ON notification_events
  FOR SELECT
  USING (auth.uid() = user_id);
