CREATE TYPE "public"."supplier_review_status" AS ENUM('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED');
--> statement-breakpoint
CREATE TYPE "public"."supplier_payout_status" AS ENUM('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'PAID');
--> statement-breakpoint
CREATE TYPE "public"."supplier_verification_case_status" AS ENUM('DRAFT', 'IN_PROGRESS', 'COMPLETED');
--> statement-breakpoint
CREATE TABLE "supplier_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"supplier_id" integer NOT NULL,
	"fabric_id" integer,
	"reviewer_display_name" text NOT NULL,
	"reviewer_badge" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"sku_snapshot" text,
	"status" "supplier_review_status" DEFAULT 'PENDING' NOT NULL,
	"flag_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "supplier_verification_cases" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_verification_cases_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"supplier_id" integer NOT NULL,
	"reference_code" text NOT NULL,
	"headline" text NOT NULL,
	"summary" text NOT NULL,
	"compliance_score" integer DEFAULT 0 NOT NULL,
	"labor_pct" integer DEFAULT 0 NOT NULL,
	"env_pct" integer DEFAULT 0 NOT NULL,
	"supply_pct" integer DEFAULT 0 NOT NULL,
	"fiscal_pct" integer DEFAULT 0 NOT NULL,
	"status" "supplier_verification_case_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"checklist_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"messages_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"facility_photo_urls" text[],
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "supplier_payout_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_payout_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"supplier_id" integer NOT NULL,
	"requested_amount" numeric(14, 2) NOT NULL,
	"balance_snapshot" numeric(14, 2) NOT NULL,
	"bank_label" text NOT NULL,
	"account_mask" text NOT NULL,
	"swift_code" text,
	"status" "supplier_payout_status" DEFAULT 'PENDING' NOT NULL,
	"resolution_note" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_alert_monitors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_alert_monitors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monitor_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"threshold_int" integer,
	"accent" text DEFAULT 'primary' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_alert_channels" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_alert_channels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"channel_key" text NOT NULL,
	"label" text NOT NULL,
	"subtitle" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "system_alert_performance_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_alert_performance_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monitor_key" text NOT NULL,
	"label" text NOT NULL,
	"worker_hint" text NOT NULL,
	"avg_load_ms" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"last_triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "supplier_reviews" ADD CONSTRAINT "supplier_reviews_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "supplier_reviews" ADD CONSTRAINT "supplier_reviews_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "supplier_verification_cases" ADD CONSTRAINT "supplier_verification_cases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "supplier_payout_requests" ADD CONSTRAINT "supplier_payout_requests_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_verification_cases_reference_code_unique" ON "supplier_verification_cases" USING btree ("reference_code");
--> statement-breakpoint
CREATE UNIQUE INDEX "system_alert_monitors_monitor_key_unique" ON "system_alert_monitors" USING btree ("monitor_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "system_alert_channels_channel_key_unique" ON "system_alert_channels" USING btree ("channel_key");
--> statement-breakpoint
CREATE INDEX "supplier_reviews_supplier_id_idx" ON "supplier_reviews" USING btree ("supplier_id");
--> statement-breakpoint
CREATE INDEX "supplier_reviews_fabric_id_idx" ON "supplier_reviews" USING btree ("fabric_id");
--> statement-breakpoint
CREATE INDEX "supplier_reviews_status_idx" ON "supplier_reviews" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "supplier_verification_cases_supplier_id_idx" ON "supplier_verification_cases" USING btree ("supplier_id");
--> statement-breakpoint
CREATE INDEX "supplier_payout_requests_supplier_id_idx" ON "supplier_payout_requests" USING btree ("supplier_id");
--> statement-breakpoint
CREATE INDEX "supplier_payout_requests_status_idx" ON "supplier_payout_requests" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "system_alert_monitors_enabled_idx" ON "system_alert_monitors" USING btree ("enabled");
--> statement-breakpoint
CREATE INDEX "system_alert_channels_enabled_idx" ON "system_alert_channels" USING btree ("enabled");
--> statement-breakpoint
CREATE INDEX "system_alert_perf_logs_monitor_key_idx" ON "system_alert_performance_logs" USING btree ("monitor_key");
--> statement-breakpoint
INSERT INTO "system_alert_monitors" ("monitor_key", "title", "description", "enabled", "threshold_int", "accent", "sort_order")
VALUES
('crawler_error_rate', 'High Crawler Error Rate', 'Detect spike in crawler 403/404 responses.', true, 500, 'error', 1),
('large_bulk_order', 'Large Bulk Order', 'Orders exceeding standard marketplace volume.', true, 15000, 'tertiary', 2),
('failed_payout', 'Failed Payout', 'Transaction failures for registered vendors.', true, NULL, 'primary', 3),
('database_latency', 'Database Latency', 'Notify when p99 latency exceeds threshold.', false, 250, 'secondary', 4)
ON CONFLICT ("monitor_key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "system_alert_channels" ("channel_key", "label", "subtitle", "enabled")
VALUES
('slack', 'Slack Webhook', '#ops-alerts-global', true),
('email', 'Admin Digest', 'Immediate Delivery', true),
('sms', 'SMS Critical', 'Only for Tier 1', false),
('webhook', 'Custom Endpoint', 'JSON Payload', false)
ON CONFLICT ("channel_key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "system_alert_performance_logs" ("monitor_key", "label", "worker_hint", "avg_load_ms", "status", "last_triggered_at")
VALUES
('catalog_sync', 'Main Catalog Sync', 'Worker node: EU-WEST-1', 14, 'operational', now() - interval '2 minutes'),
('elastic_reindex', 'ElasticSearch Re-indexing', 'Cron: nightly_batch_job', 413, 'threshold_warning', now() - interval '14 hours'),
('stripe_webhook', 'Stripe Webhook Gateway', 'External connection status', 0, 'operational', now());
--> statement-breakpoint
INSERT INTO "supplier_reviews" (
  "supplier_id", "reviewer_display_name", "reviewer_badge", "is_anonymous", "rating", "body", "sku_snapshot", "status"
)
SELECT
  s.id,
  'Julianne Deauville',
  'Verified Buyer',
  false,
  5,
  'The hand-feel of this fabric is exceptional. Delivery was ahead of schedule.',
  'fabric-sample-sku',
  'PENDING'
FROM suppliers s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM supplier_reviews sr WHERE sr.deleted_at IS NULL)
ORDER BY s.id
LIMIT 1;
--> statement-breakpoint
INSERT INTO "supplier_reviews" (
  "supplier_id", "reviewer_display_name", "reviewer_badge", "is_anonymous", "rating", "body", "sku_snapshot", "status"
)
SELECT
  s.id,
  'Marco Trensani',
  'Wholesale Buyer',
  false,
  4,
  'High quality raw material. Slight batch variation within tolerances.',
  'ctn-egypt-raw',
  'APPROVED'
FROM suppliers s
WHERE s.deleted_at IS NULL
  AND (SELECT count(*)::int FROM supplier_reviews WHERE deleted_at IS NULL) = 1
ORDER BY s.id
LIMIT 1;
--> statement-breakpoint
INSERT INTO "supplier_reviews" (
  "supplier_id", "reviewer_display_name", "is_anonymous", "rating", "body", "sku_snapshot", "status", "flag_reason"
)
SELECT
  s.id,
  'User Anonymous',
  true,
  1,
  'Content hidden due to community guidelines violation.',
  'unknown',
  'FLAGGED',
  'Reported language'
FROM suppliers s
WHERE s.deleted_at IS NULL
  AND (SELECT count(*)::int FROM supplier_reviews WHERE deleted_at IS NULL) = 2
ORDER BY s.id
LIMIT 1;
--> statement-breakpoint
INSERT INTO "supplier_payout_requests" (
  "supplier_id", "requested_amount", "balance_snapshot", "bank_label", "account_mask", "swift_code", "status"
)
SELECT
  s.id,
  12450.00,
  18200.40,
  'Chase Bank',
  '****4492',
  'CHASUS33',
  'PENDING'
FROM suppliers s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM supplier_payout_requests p WHERE p.deleted_at IS NULL)
ORDER BY s.id
LIMIT 1;
--> statement-breakpoint
INSERT INTO "supplier_verification_cases" (
  "supplier_id", "reference_code", "headline", "summary", "compliance_score", "labor_pct", "env_pct", "supply_pct", "fiscal_pct", "status", "checklist_json", "messages_json", "internal_note"
)
SELECT
  s.id,
  'V-88291-DEMO',
  s.name,
  'Verification in progress for Tier-1 Manufacturing status.',
  82,
  95,
  70,
  42,
  88,
  'IN_PROGRESS',
  '[{"id":"iso","title":"ISO 9001 Documentation","detail":"Verified by Cloud-OCR on 12/10/2023","state":"completed"},{"id":"sample","title":"Sample Quality Analysis","detail":"Lab results pending upload","state":"processing"},{"id":"photos","title":"Facility High-Res Photos","detail":"Required: 12 interior views","state":"pending"},{"id":"tax","title":"Tax Compliance ID","detail":"ID mismatch with regional database","state":"error"}]'::jsonb,
  '[{"role":"supplier","body":"Hello Admin, I have uploaded the revised environmental reports.","at":"2023-10-25T10:42:00Z"},{"role":"admin","body":"Received. Please re-verify the regional tax code.","at":"2023-10-25T10:45:00Z"}]'::jsonb,
  'High priority partner. Double-check labor ethics sub-tiering before board review.'
FROM suppliers s
WHERE s.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM supplier_verification_cases v WHERE v.deleted_at IS NULL)
ORDER BY s.id
LIMIT 1;
