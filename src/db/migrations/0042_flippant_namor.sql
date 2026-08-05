CREATE TABLE "social_analytics_daily" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_analytics_daily_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_id" integer NOT NULL,
	"platform" "social_platform" NOT NULL,
	"metric_date" date NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"link_clicks" integer DEFAULT 0 NOT NULL,
	"video_views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_analytics_daily_post_date_uq" UNIQUE("post_id","metric_date")
);
--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "publish_credential_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "platform_account_id" text;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "published_version" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "media_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "analytics_sync_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "next_sync_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "social_analytics_daily" ADD CONSTRAINT "social_analytics_daily_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_analytics_daily_platform_date_idx" ON "social_analytics_daily" USING btree ("platform","metric_date");--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_publish_credential_id_social_platform_credentials_id_fk" FOREIGN KEY ("publish_credential_id") REFERENCES "public"."social_platform_credentials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_posts_publish_credential_idx" ON "social_posts" USING btree ("publish_credential_id");--> statement-breakpoint
CREATE INDEX "social_posts_next_sync_idx" ON "social_posts" USING btree ("status","next_sync_at");