CREATE TYPE "public"."supplier_discovery_run_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');--> statement-breakpoint
CREATE TYPE "public"."supplier_discovery_supplier_status" AS ENUM('NEW', 'REVIEW_NEEDED', 'APPROVED_FOR_INGEST', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."supplier_discovery_product_status" AS ENUM('NEW', 'READY', 'NEEDS_REVIEW', 'REJECTED');--> statement-breakpoint
CREATE TABLE "supplier_discovery_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_discovery_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"status" "supplier_discovery_run_status" DEFAULT 'PENDING' NOT NULL,
	"sources" text[] NOT NULL,
	"criteria_json" jsonb NOT NULL,
	"keywords" text[] NOT NULL,
	"max_suppliers" integer DEFAULT 50 NOT NULL,
	"max_products_per_supplier" integer DEFAULT 10 NOT NULL,
	"suppliers_found" integer DEFAULT 0 NOT NULL,
	"suppliers_qualified" integer DEFAULT 0 NOT NULL,
	"products_extracted" integer DEFAULT 0 NOT NULL,
	"drafts_ready" integer DEFAULT 0 NOT NULL,
	"triggered_by_id" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_log" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "supplier_discovery_suppliers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_discovery_suppliers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"run_id" integer NOT NULL,
	"source" text NOT NULL,
	"supplier_url" text NOT NULL,
	"supplier_url_hash" text NOT NULL,
	"name" text,
	"logo_url" text,
	"website_url" text,
	"established_year" integer,
	"city" text,
	"province" text,
	"country" text,
	"years_in_business" integer,
	"catalog_size_estimate" integer,
	"moq_min_meters" integer,
	"photos_score" numeric(5, 2),
	"qualified" boolean DEFAULT false NOT NULL,
	"qualification_reasons" text[],
	"status" "supplier_discovery_supplier_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE TABLE "supplier_discovery_products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "supplier_discovery_products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"run_id" integer NOT NULL,
	"discovery_supplier_id" integer NOT NULL,
	"product_url" text NOT NULL,
	"url_hash" text NOT NULL,
	"raw_title" text NOT NULL,
	"raw_description" text,
	"raw_images" text[],
	"price_text" text,
	"moq_text" text,
	"moq_meters" integer,
	"composition_text" text,
	"gsm_text" text,
	"width_text" text,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"photo_quality_score" numeric(5, 2),
	"status" "supplier_discovery_product_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "supplier_discovery_runs" ADD CONSTRAINT "supplier_discovery_runs_triggered_by_id_users_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_discovery_suppliers" ADD CONSTRAINT "supplier_discovery_suppliers_run_id_supplier_discovery_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."supplier_discovery_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_discovery_products" ADD CONSTRAINT "supplier_discovery_products_run_id_supplier_discovery_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."supplier_discovery_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_discovery_products" ADD CONSTRAINT "supplier_discovery_products_discovery_supplier_id_supplier_discovery_suppliers_id_fk" FOREIGN KEY ("discovery_supplier_id") REFERENCES "public"."supplier_discovery_suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplier_discovery_runs_triggered_by_id_idx" ON "supplier_discovery_runs" USING btree ("triggered_by_id");--> statement-breakpoint
CREATE INDEX "supplier_discovery_runs_status_idx" ON "supplier_discovery_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "supplier_discovery_suppliers_run_id_idx" ON "supplier_discovery_suppliers" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_discovery_suppliers_run_id_hash_uq" ON "supplier_discovery_suppliers" USING btree ("run_id","supplier_url_hash");--> statement-breakpoint
CREATE INDEX "supplier_discovery_suppliers_qualified_idx" ON "supplier_discovery_suppliers" USING btree ("qualified");--> statement-breakpoint
CREATE INDEX "supplier_discovery_suppliers_status_idx" ON "supplier_discovery_suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "supplier_discovery_products_run_id_idx" ON "supplier_discovery_products" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "supplier_discovery_products_discovery_supplier_id_idx" ON "supplier_discovery_products" USING btree ("discovery_supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_discovery_products_run_id_url_hash_uq" ON "supplier_discovery_products" USING btree ("run_id","url_hash");--> statement-breakpoint
CREATE INDEX "supplier_discovery_products_status_idx" ON "supplier_discovery_products" USING btree ("status");
