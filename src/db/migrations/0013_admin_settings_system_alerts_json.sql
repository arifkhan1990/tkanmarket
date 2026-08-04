ALTER TABLE "admin_settings"
ADD COLUMN IF NOT EXISTS "system_alerts_json" jsonb NOT NULL DEFAULT '{}'::jsonb;
