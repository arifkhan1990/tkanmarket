DO $$ BEGIN
	CREATE TYPE "public"."catalog_export_format" AS ENUM('CSV', 'XLSX', 'JSON');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."catalog_export_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "catalog_export_jobs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "catalog_export_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"job_name" text NOT NULL,
	"format" "catalog_export_format" DEFAULT 'CSV' NOT NULL,
	"status" "catalog_export_status" DEFAULT 'PENDING' NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"estimated_size_bytes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalog_export_jobs_status_idx" ON "catalog_export_jobs" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "catalog_export_jobs_created_at_desc_idx" ON "catalog_export_jobs" USING btree ("created_at" DESC);
