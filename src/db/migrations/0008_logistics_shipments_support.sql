CREATE TYPE "public"."logistics_courier_mode" AS ENUM('AIR', 'ROAD', 'SEA', 'RAIL');
--> statement-breakpoint
CREATE TYPE "public"."logistics_shipment_status" AS ENUM('IN_TRANSIT', 'DELAYED', 'CUSTOMS_HOLD', 'DELIVERED');
--> statement-breakpoint
CREATE TYPE "public"."support_knowledge_card_layout" AS ENUM('WIDE', 'NARROW', 'FULL');
--> statement-breakpoint
CREATE TYPE "public"."support_ticket_service_area" AS ENUM('CRAWLER', 'AI', 'WEB', 'DATABASE');
--> statement-breakpoint
CREATE TYPE "public"."support_ticket_urgency" AS ENUM('NORMAL', 'HIGH', 'CRITICAL');
--> statement-breakpoint
CREATE TABLE "logistics_shipments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logistics_shipments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"tracking_code" text NOT NULL,
	"origin_city" text NOT NULL,
	"origin_country" text NOT NULL,
	"supplier_name" text NOT NULL,
	"supplier_id" integer,
	"courier_name" text NOT NULL,
	"courier_mode" "logistics_courier_mode" DEFAULT 'AIR' NOT NULL,
	"estimated_delivery_at" timestamp with time zone,
	"delivery_status_note" text,
	"status" "logistics_shipment_status" DEFAULT 'IN_TRANSIT' NOT NULL,
	"corridor_label" text,
	"active_corridor_trucks" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "logistics_shipments_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "support_knowledge_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "support_knowledge_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon_key" text NOT NULL,
	"layout" "support_knowledge_card_layout" DEFAULT 'WIDE' NOT NULL,
	"highlights" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "support_troubleshooting_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "support_troubleshooting_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "internal_support_tickets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "internal_support_tickets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submitted_by_user_id" integer NOT NULL,
	"service_area" "support_ticket_service_area" NOT NULL,
	"urgency" "support_ticket_urgency" DEFAULT 'NORMAL' NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "logistics_shipments" ADD CONSTRAINT "logistics_shipments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "internal_support_tickets" ADD CONSTRAINT "internal_support_tickets_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "logistics_shipments_supplier_id_idx" ON "logistics_shipments" USING btree ("supplier_id");
--> statement-breakpoint
CREATE INDEX "logistics_shipments_status_idx" ON "logistics_shipments" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "logistics_shipments_deleted_at_idx" ON "logistics_shipments" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "support_knowledge_categories_sort_idx" ON "support_knowledge_categories" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "support_knowledge_categories_deleted_at_idx" ON "support_knowledge_categories" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "support_troubleshooting_entries_sort_idx" ON "support_troubleshooting_entries" USING btree ("sort_order");
--> statement-breakpoint
CREATE INDEX "support_troubleshooting_entries_deleted_at_idx" ON "support_troubleshooting_entries" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "internal_support_tickets_user_id_idx" ON "internal_support_tickets" USING btree ("submitted_by_user_id");
--> statement-breakpoint
CREATE INDEX "internal_support_tickets_deleted_at_idx" ON "internal_support_tickets" USING btree ("deleted_at");
--> statement-breakpoint
INSERT INTO "support_knowledge_categories" ("title", "description", "icon_key", "layout", "highlights", "sort_order")
SELECT 'Marketplace Operations', 'Guidelines for supplier onboarding, catalog management, and quality control protocols for textile imports.', 'storefront', 'WIDE', '[{"label":"Onboarding SOP"},{"label":"QC Checklist v4"}]'::jsonb, 0
WHERE NOT EXISTS (SELECT 1 FROM "support_knowledge_categories" WHERE "title" = 'Marketplace Operations');
--> statement-breakpoint
INSERT INTO "support_knowledge_categories" ("title", "description", "icon_key", "layout", "highlights", "sort_order")
SELECT 'Supplier Inquiries', 'Standard email templates and response guides for common supplier billing and logistics questions.', 'contact_support', 'NARROW', '[]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM "support_knowledge_categories" WHERE "title" = 'Supplier Inquiries');
--> statement-breakpoint
INSERT INTO "support_knowledge_categories" ("title", "description", "icon_key", "layout", "highlights", "sort_order")
SELECT 'Technical Infrastructure & Pipelines', 'Technical documentation for the web crawler, automated AI fabric classification, and cloud architecture health.', 'memory', 'FULL', '[{"label":"Crawler Logs"},{"label":"AI Training Docs"},{"label":"Server Health"}]'::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM "support_knowledge_categories" WHERE "title" = 'Technical Infrastructure & Pipelines');
--> statement-breakpoint
INSERT INTO "support_troubleshooting_entries" ("code", "title", "sort_order")
SELECT 'ERR_403', 'Crawler blocked by target domain IP rotation', 0
WHERE NOT EXISTS (SELECT 1 FROM "support_troubleshooting_entries" WHERE "code" = 'ERR_403');
--> statement-breakpoint
INSERT INTO "support_troubleshooting_entries" ("code", "title", "sort_order")
SELECT 'AI_CONF_LOW', 'Confidence threshold below 80% on fabric recognition', 1
WHERE NOT EXISTS (SELECT 1 FROM "support_troubleshooting_entries" WHERE "code" = 'AI_CONF_LOW');
--> statement-breakpoint
INSERT INTO "support_troubleshooting_entries" ("code", "title", "sort_order")
SELECT 'DB_SYNC_TIMEOUT', 'Global inventory synchronization delay troubleshooting', 2
WHERE NOT EXISTS (SELECT 1 FROM "support_troubleshooting_entries" WHERE "code" = 'DB_SYNC_TIMEOUT');
--> statement-breakpoint
INSERT INTO "logistics_shipments" (
  "tracking_code", "origin_city", "origin_country", "supplier_name",
  "courier_name", "courier_mode", "estimated_delivery_at", "delivery_status_note", "status",
  "corridor_label", "active_corridor_trucks"
)
SELECT 'TK-992810-G', 'Istanbul', 'Turkey', 'Anatolia Textiles Ltd.', 'DHL Express', 'AIR', '2023-10-24T12:00:00Z'::timestamptz, NULL, 'IN_TRANSIT', 'Turkey → Moscow', 12
WHERE NOT EXISTS (SELECT 1 FROM "logistics_shipments" WHERE "tracking_code" = 'TK-992810-G');
--> statement-breakpoint
INSERT INTO "logistics_shipments" (
  "tracking_code", "origin_city", "origin_country", "supplier_name",
  "courier_name", "courier_mode", "estimated_delivery_at", "delivery_status_note", "status",
  "corridor_label", "active_corridor_trucks"
)
SELECT 'TK-441293-C', 'Guangzhou', 'China', 'Silk Road Weavers', 'CDEK Logistics', 'ROAD', NULL, 'DELAYED', 'CUSTOMS_HOLD', 'China → CIS', NULL
WHERE NOT EXISTS (SELECT 1 FROM "logistics_shipments" WHERE "tracking_code" = 'TK-441293-C');
--> statement-breakpoint
INSERT INTO "logistics_shipments" (
  "tracking_code", "origin_city", "origin_country", "supplier_name",
  "courier_name", "courier_mode", "estimated_delivery_at", "delivery_status_note", "status",
  "corridor_label", "active_corridor_trucks"
)
SELECT 'TK-772188-U', 'Tashkent', 'Uzbekistan', 'Bukhara Cotton Hub', 'InterTrans Rail', 'RAIL', '2023-10-21T12:00:00Z', NULL, 'DELIVERED', 'Central Asia', NULL
WHERE NOT EXISTS (SELECT 1 FROM "logistics_shipments" WHERE "tracking_code" = 'TK-772188-U');
