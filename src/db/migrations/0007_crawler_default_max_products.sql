ALTER TABLE "admin_settings" ADD COLUMN IF NOT EXISTS "crawler_default_max_products" integer NOT NULL DEFAULT 200;
