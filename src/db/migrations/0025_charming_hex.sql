CREATE TYPE "public"."bulk_import_job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TABLE "bulk_import_jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bulk_import_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"supplier_id" integer NOT NULL,
	"filename" text NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"status" "bulk_import_job_status" DEFAULT 'PENDING' NOT NULL,
	"errors" jsonb,
	"created_by_id" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "supply_type" text;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "shipment_time" text;--> statement-breakpoint
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;