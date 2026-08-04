ALTER TABLE "admin_settings"
ADD COLUMN IF NOT EXISTS "lead_ops_json" jsonb NOT NULL DEFAULT '{}'::jsonb;
