-- Add VIDEO_PENDING to social_post_status enum (for Veo video generation flow)
ALTER TYPE "public"."social_post_status" ADD VALUE IF NOT EXISTS 'VIDEO_PENDING';--> statement-breakpoint

-- Create generated_media table for tracking AI-generated images and videos
CREATE TABLE IF NOT EXISTS "generated_media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "generated_media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fabric_id" integer NOT NULL,
	"social_post_id" integer,
	"type" text NOT NULL,
	"media_type" text,
	"url" text,
	"thumbnail_url" text,
	"prompt" text NOT NULL,
	"provider" text DEFAULT 'gemini' NOT NULL,
	"provider_model" text,
	"provider_job_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"duration_seconds" integer,
	"aspect_ratio" text,
	"file_size_bytes" integer,
	"error_message" text,
	"admin_reviewed_at" timestamp with time zone,
	"admin_reviewer_id" integer,
	"admin_review_notes" text,
	"metadata" jsonb,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint

-- Foreign keys
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_media" ADD CONSTRAINT "generated_media_admin_reviewer_id_users_id_fk" FOREIGN KEY ("admin_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "generated_media_fabric_id_idx" ON "generated_media" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generated_media_status_idx" ON "generated_media" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generated_media_type_idx" ON "generated_media" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generated_media_social_post_id_idx" ON "generated_media" USING btree ("social_post_id");
