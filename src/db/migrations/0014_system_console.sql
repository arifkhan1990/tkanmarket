CREATE TYPE "public"."integration_health_dot" AS ENUM('OK', 'WARN', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('CONNECTED', 'ACTION_REQUIRED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."system_log_level" AS ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."system_release_kind" AS ENUM('MAJOR', 'PATCH', 'FEATURE', 'HOTFIX');--> statement-breakpoint
CREATE TABLE "platform_app_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_app_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"site_name" text DEFAULT 'TkanMarket Administrator' NOT NULL,
	"support_email" text DEFAULT 'ops@tkanmarket.com' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"two_factor_required" boolean DEFAULT true NOT NULL,
	"session_timeout_minutes" integer DEFAULT 30 NOT NULL,
	"ip_whitelist_enabled" boolean DEFAULT false NOT NULL,
	"notification_matrix_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "platform_regional_preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_regional_preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"primary_currency" text DEFAULT 'USD' NOT NULL,
	"sku_prefix_pattern" text DEFAULT 'MKTP-{{CAT}}-{{YEAR}}' NOT NULL,
	"sku_sequence_length" integer DEFAULT 6 NOT NULL,
	"updated_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "platform_tax_regions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_tax_regions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"region_code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"rate_percent" numeric(8, 4) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "system_integrations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_integrations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" "integration_status" DEFAULT 'INACTIVE' NOT NULL,
	"external_ref" text NOT NULL,
	"icon_key" text DEFAULT 'hub' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "system_integration_health_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_integration_health_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"integration_id" integer NOT NULL,
	"endpoint_path" text NOT NULL,
	"response_label" text NOT NULL,
	"health_dot" "integration_health_dot" DEFAULT 'OK' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "system_maintenance_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_maintenance_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"headline" text DEFAULT 'Under Maintenance' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"migration_progress" integer DEFAULT 0 NOT NULL,
	"migration_steps_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"system_id_label" text DEFAULT 'MKT-OS-7712-B' NOT NULL,
	"hero_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "system_release_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_release_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"version_label" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"release_kind" "system_release_kind" NOT NULL,
	"released_at" timestamp with time zone NOT NULL,
	"highlights_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "system_technical_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_technical_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"level" "system_log_level" NOT NULL,
	"service_name" text NOT NULL,
	"message" text NOT NULL,
	"trace_id" text NOT NULL,
	"detail_text" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "platform_app_settings" ADD CONSTRAINT "platform_app_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_regional_preferences" ADD CONSTRAINT "platform_regional_preferences_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_integration_health_events" ADD CONSTRAINT "system_integration_health_events_integration_id_system_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."system_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_app_settings_updated_by_user_id_idx" ON "platform_app_settings" USING btree ("updated_by_user_id");--> statement-breakpoint
CREATE INDEX "platform_tax_regions_region_code_idx" ON "platform_tax_regions" USING btree ("region_code");--> statement-breakpoint
CREATE INDEX "system_integration_health_events_integration_id_idx" ON "system_integration_health_events" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "system_integration_health_events_occurred_at_idx" ON "system_integration_health_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "system_integrations_slug_unique" ON "system_integrations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "system_release_entries_released_at_idx" ON "system_release_entries" USING btree ("released_at");--> statement-breakpoint
CREATE INDEX "system_technical_logs_occurred_at_idx" ON "system_technical_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "system_technical_logs_level_idx" ON "system_technical_logs" USING btree ("level");
