CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SALES', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."fabric_status" AS ENUM('raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."fabric_type" AS ENUM('woven', 'knit', 'nonwoven', 'lace', 'lining', 'technical', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('MARKETPLACE_INQUIRY', 'SAMPLE_REQUEST', 'SOCIAL_CAMPAIGN', 'DIRECT_CONTACT', 'MANUAL_ENTRY');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST');--> statement-breakpoint
CREATE TYPE "public"."social_content_type" AS ENUM('REEL_15', 'REEL_20', 'REEL_30', 'CAROUSEL', 'IMAGE_POST', 'PIN');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE');--> statement-breakpoint
CREATE TYPE "public"."social_post_status" AS ENUM('DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."crawler_job_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."raw_product_source_language" AS ENUM('zh', 'en');--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'VIEWER' NOT NULL,
	"avatar_url" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "suppliers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country" text DEFAULT 'China' NOT NULL,
	"city" text,
	"province" text,
	"description" text,
	"logo_url" text,
	"website_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"established_year" integer,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "suppliers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fabric_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fabric_id" integer NOT NULL,
	"category_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabrics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"supplier_id" integer NOT NULL,
	"slug" text NOT NULL,
	"sku" text,
	"status" "fabric_status" DEFAULT 'raw_scraped' NOT NULL,
	"title_ru" text NOT NULL,
	"title_en" text,
	"description_ru" text,
	"description_en" text,
	"meta_title_ru" text,
	"meta_description_ru" text,
	"fabric_type" "fabric_type",
	"gsm" integer,
	"width_cm" integer,
	"price_usd" numeric(10, 2),
	"moq" integer,
	"composition" jsonb,
	"tags" text[],
	"images" text[],
	"source_url" text,
	"raw_title" text,
	"raw_description" text,
	"ai_confidence_score" numeric(3, 2),
	"ai_processed_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"social_score" integer,
	"views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "fabrics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fabric_activity_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fabric_id" integer NOT NULL,
	"actor_id" integer,
	"event_type" text NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activity_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_activity_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" integer NOT NULL,
	"actor_id" integer,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"lead_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" "lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"country" text NOT NULL,
	"city" text,
	"fabric_id" integer,
	"inquiry_text" text NOT NULL,
	"assigned_to_id" integer,
	"utm_source" text,
	"utm_campaign" text,
	"utm_medium" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"fabric_id" integer NOT NULL,
	"platform" "social_platform" NOT NULL,
	"content_type" "social_content_type" NOT NULL,
	"status" "social_post_status" DEFAULT 'DRAFT' NOT NULL,
	"caption_text" text,
	"hashtags" text[],
	"script_text" text,
	"media_urls" text[],
	"scheduled_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"platform_post_id" text,
	"reach" integer,
	"likes" integer,
	"shares" integer,
	"link_clicks" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crawler_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "crawler_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" "crawler_job_status" DEFAULT 'PENDING' NOT NULL,
	"source" text NOT NULL,
	"keywords" text[] NOT NULL,
	"products_found" integer DEFAULT 0 NOT NULL,
	"products_saved" integer DEFAULT 0 NOT NULL,
	"errors_count" integer DEFAULT 0 NOT NULL,
	"triggered_by_id" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_log" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"crawler_enabled" boolean DEFAULT true NOT NULL,
	"lead_rate_limit_per_hour" integer DEFAULT 5 NOT NULL,
	"notification_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "raw_products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "raw_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"product_url" text NOT NULL,
	"url_hash" text NOT NULL,
	"raw_title" text NOT NULL,
	"raw_description" text,
	"raw_composition" text,
	"raw_images" text[],
	"supplier_name" text,
	"price_text" text,
	"moq_text" text,
	"source_language" "raw_product_source_language" DEFAULT 'zh' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "raw_products_product_url_unique" UNIQUE("product_url"),
	CONSTRAINT "raw_products_url_hash_unique" UNIQUE("url_hash")
);
--> statement-breakpoint
ALTER TABLE "fabric_categories" ADD CONSTRAINT "fabric_categories_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_activity_log" ADD CONSTRAINT "fabric_activity_log_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_activity_log" ADD CONSTRAINT "fabric_activity_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity_log" ADD CONSTRAINT "lead_activity_log_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activity_log" ADD CONSTRAINT "lead_activity_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crawler_runs" ADD CONSTRAINT "crawler_runs_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fabric_categories_fabric_id_idx" ON "fabric_categories" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "fabrics_status_deleted_at_idx" ON "fabrics" USING btree ("status","deleted_at");--> statement-breakpoint
CREATE INDEX "fabrics_supplier_id_idx" ON "fabrics" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "fabrics_slug_idx" ON "fabrics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "fabrics_tags_gin_idx" ON "fabrics" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "fabrics_social_score_desc_idx" ON "fabrics" USING btree ("social_score" desc);--> statement-breakpoint
CREATE INDEX "fabric_activity_log_fabric_id_idx" ON "fabric_activity_log" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "fabric_activity_log_actor_id_idx" ON "fabric_activity_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "fabric_activity_log_created_at_desc_idx" ON "fabric_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_activity_log_lead_id_idx" ON "lead_activity_log" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activity_log_actor_id_idx" ON "lead_activity_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "lead_notes_lead_id_idx" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_notes_author_id_idx" ON "lead_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_assigned_to_id_idx" ON "leads" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_desc_idx" ON "leads" USING btree ("created_at" desc);--> statement-breakpoint
CREATE INDEX "leads_fabric_id_idx" ON "leads" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "social_posts_status_scheduled_at_idx" ON "social_posts" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "social_posts_fabric_id_idx" ON "social_posts" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "crawler_runs_triggered_by_id_idx" ON "crawler_runs" USING btree ("triggered_by_id");--> statement-breakpoint
CREATE INDEX "raw_products_source_created_at_desc_idx" ON "raw_products" USING btree ("source","created_at" desc);