ALTER TABLE notification_subscriptions
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'web';

ALTER TABLE notification_subscriptions
  ADD COLUMN IF NOT EXISTS device_id text;

COMMENT ON COLUMN notification_subscriptions.platform IS 'web | ios | android';
COMMENT ON COLUMN notification_subscriptions.device_id IS 'Capacitor device identifier for mobile';
