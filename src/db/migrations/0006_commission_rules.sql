CREATE TYPE "public"."commission_tier_mode" AS ENUM('FLAT', 'TIERED');--> statement-breakpoint
CREATE TYPE "public"."commission_health" AS ENUM('HEALTHY', 'UNDER_REVIEW', 'PAUSED');--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "commission_rules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_key" text NOT NULL,
	"category_label" text NOT NULL,
	"external_ref" text,
	"base_commission_percent" numeric(5, 2) NOT NULL,
	"min_monthly_volume_usd" integer DEFAULT 0 NOT NULL,
	"tier_mode" "commission_tier_mode" DEFAULT 'TIERED' NOT NULL,
	"health" "commission_health" DEFAULT 'HEALTHY' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"tiers" jsonb,
	"insight_title" text,
	"insight_body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "commission_rules_category_key_idx" ON "commission_rules" USING btree ("category_key");--> statement-breakpoint
CREATE INDEX "commission_rules_deleted_at_idx" ON "commission_rules" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_rules_category_active_uq" ON "commission_rules" ("category_key") WHERE "deleted_at" IS NULL;--> statement-breakpoint
INSERT INTO "commission_rules" (
  "category_key", "category_label", "external_ref",
  "base_commission_percent", "min_monthly_volume_usd",
  "tier_mode", "health", "is_active", "tiers",
  "insight_title", "insight_body"
) VALUES (
  'silk',
  'Silk Category',
  'SLK-992',
  8.00,
  0,
  'TIERED',
  'HEALTHY',
  true,
  '[
    {"volumeLabel":"$0 - $10,000","minUsd":0,"maxUsd":10000,"commissionPercent":"8.0","activeMerchants":142},
    {"volumeLabel":"$10,001 - $50,000","minUsd":10001,"maxUsd":50000,"commissionPercent":"6.5","activeMerchants":48},
    {"volumeLabel":"$50,000+","minUsd":50000,"maxUsd":null,"commissionPercent":"4.0","activeMerchants":12}
  ]'::jsonb,
  'Tiered Silk Incentive',
  'Attracted several high-volume vendors after tiered rollout.'
);

INSERT INTO "commission_rules" (
  "category_key", "category_label", "external_ref",
  "base_commission_percent", "min_monthly_volume_usd",
  "tier_mode", "health", "is_active", "tiers",
  "insight_title", "insight_body"
) VALUES (
  'cotton',
  'Cotton Category',
  'CTN-441',
  5.00,
  1500,
  'FLAT',
  'UNDER_REVIEW',
  true,
  NULL,
  'Cotton Fee Margin',
  'Currently tracked against market benchmarks for B2B fabric.'
);
