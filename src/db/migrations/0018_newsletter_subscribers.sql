CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"email" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"source" text DEFAULT 'blog' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_subscribers_deleted_at_idx" ON "newsletter_subscribers" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "newsletter_subscribers_created_at_idx" ON "newsletter_subscribers" USING btree ("created_at" DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_unique_active" ON "newsletter_subscribers" (LOWER("email")) WHERE "deleted_at" IS NULL;
