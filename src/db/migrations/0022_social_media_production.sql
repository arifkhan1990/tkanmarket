-- Social media production-grade expansion:
--   - New enums: social_campaign_status, social_activity_action
--   - New tables: social_campaigns, social_platform_credentials, social_oauth_states,
--                 social_post_analytics_history, social_activity_log
--   - social_posts: extend with campaign, media variants, detailed analytics, audit fields
CREATE TYPE "social_campaign_status" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint

CREATE TYPE "social_activity_action" AS ENUM (
  'CREATED',
  'UPDATED',
  'APPROVED',
  'SCHEDULED',
  'UNSCHEDULED',
  'PUBLISHED',
  'FAILED',
  'REJECTED',
  'REOPENED',
  'ANALYTICS_SYNCED',
  'CREDENTIALS_CONNECTED',
  'CREDENTIALS_DISCONNECTED',
  'CREDENTIALS_REFRESHED'
);--> statement-breakpoint

CREATE TABLE "social_campaigns" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_campaigns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "name" text NOT NULL,
  "description" text,
  "status" "social_campaign_status" DEFAULT 'PLANNING' NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "created_by_user_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "social_campaigns_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);--> statement-breakpoint
CREATE INDEX "social_campaigns_status_idx" ON "social_campaigns" USING btree ("status", "deleted_at");--> statement-breakpoint
CREATE INDEX "social_campaigns_starts_at_idx" ON "social_campaigns" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "social_campaigns_created_by_idx" ON "social_campaigns" USING btree ("created_by_user_id");--> statement-breakpoint

CREATE TABLE "social_platform_credentials" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_platform_credentials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "user_id" integer NOT NULL,
  "platform" "social_platform" NOT NULL,
  "account_id" text NOT NULL,
  "account_name" text,
  "account_username" text,
  "avatar_url" text,
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text,
  "token_type" text,
  "scopes" text[],
  "expires_at" timestamp with time zone,
  "last_refreshed_at" timestamp with time zone,
  "refresh_failure_count" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "social_platform_credentials_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "social_platform_credentials_user_platform_account_uq" UNIQUE ("user_id", "platform", "account_id")
);--> statement-breakpoint
CREATE INDEX "social_platform_credentials_user_idx" ON "social_platform_credentials" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_platform_credentials_platform_active_idx" ON "social_platform_credentials" USING btree ("platform", "is_active", "deleted_at");--> statement-breakpoint
CREATE INDEX "social_platform_credentials_expires_at_idx" ON "social_platform_credentials" USING btree ("expires_at");--> statement-breakpoint

CREATE TABLE "social_oauth_states" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_oauth_states_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "state" text NOT NULL UNIQUE,
  "code_verifier" text,
  "user_id" integer NOT NULL,
  "platform" "social_platform" NOT NULL,
  "redirect_uri" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "consumed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_oauth_states_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);--> statement-breakpoint
CREATE INDEX "social_oauth_states_user_idx" ON "social_oauth_states" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_oauth_states_expires_idx" ON "social_oauth_states" USING btree ("expires_at");--> statement-breakpoint

CREATE TABLE "social_post_analytics_history" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_post_analytics_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "post_id" integer NOT NULL,
  "reach" integer,
  "impressions" integer,
  "likes" integer,
  "comments" integer,
  "shares" integer,
  "saves" integer,
  "link_clicks" integer,
  "video_views" integer,
  "raw_payload" jsonb,
  "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_post_analytics_history_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE
);--> statement-breakpoint
CREATE INDEX "social_post_analytics_history_post_idx" ON "social_post_analytics_history" USING btree ("post_id", "captured_at");--> statement-breakpoint

CREATE TABLE "social_activity_log" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "post_id" integer,
  "credential_id" integer,
  "campaign_id" integer,
  "action" "social_activity_action" NOT NULL,
  "actor_user_id" integer,
  "details" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_activity_log_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "social_posts"("id") ON DELETE CASCADE,
  CONSTRAINT "social_activity_log_credential_id_fk" FOREIGN KEY ("credential_id") REFERENCES "social_platform_credentials"("id") ON DELETE SET NULL,
  CONSTRAINT "social_activity_log_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "social_campaigns"("id") ON DELETE SET NULL,
  CONSTRAINT "social_activity_log_actor_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
);--> statement-breakpoint
CREATE INDEX "social_activity_log_post_idx" ON "social_activity_log" USING btree ("post_id", "created_at");--> statement-breakpoint
CREATE INDEX "social_activity_log_campaign_idx" ON "social_activity_log" USING btree ("campaign_id", "created_at");--> statement-breakpoint
CREATE INDEX "social_activity_log_actor_idx" ON "social_activity_log" USING btree ("actor_user_id", "created_at");--> statement-breakpoint

-- Extend social_posts
ALTER TABLE "social_posts" ADD COLUMN "campaign_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "social_campaigns"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "platform_media_variants" jsonb;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "platform_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "platform_post_url" text;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "impressions" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "comments" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "saves" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "video_views" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "analytics_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "publish_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "last_publish_error_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "approved_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_approved_by_user_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "scheduled_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_scheduled_by_user_id_fk" FOREIGN KEY ("scheduled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "published_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_published_by_user_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX "social_posts_campaign_id_idx" ON "social_posts" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "social_posts_platform_status_idx" ON "social_posts" USING btree ("platform", "status");--> statement-breakpoint
CREATE INDEX "social_posts_approved_by_idx" ON "social_posts" USING btree ("approved_by_user_id");--> statement-breakpoint
CREATE INDEX "social_posts_scheduled_by_idx" ON "social_posts" USING btree ("scheduled_by_user_id");--> statement-breakpoint
CREATE INDEX "social_posts_published_by_idx" ON "social_posts" USING btree ("published_by_user_id");--> statement-breakpoint
CREATE INDEX "social_posts_analytics_synced_idx" ON "social_posts" USING btree ("published_at", "analytics_synced_at");
