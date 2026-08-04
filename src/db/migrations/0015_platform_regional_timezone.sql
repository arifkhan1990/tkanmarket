ALTER TABLE "platform_regional_preferences" ADD COLUMN IF NOT EXISTS "platform_timezone" text;--> statement-breakpoint
UPDATE "platform_regional_preferences" SET "platform_timezone" = COALESCE("platform_timezone", 'UTC');--> statement-breakpoint
ALTER TABLE "platform_regional_preferences" ALTER COLUMN "platform_timezone" SET DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE "platform_regional_preferences" ALTER COLUMN "platform_timezone" SET NOT NULL;
