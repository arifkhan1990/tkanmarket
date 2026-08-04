CREATE TYPE "public"."admin_raw_processing_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "admin_raw_processing_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_raw_processing_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"upload_id" integer NOT NULL,
	"row_id" integer NOT NULL,
	"fabric_id" integer,
	"status" "admin_raw_processing_status" DEFAULT 'PENDING' NOT NULL,
	"ai_confidence_score" text,
	"ai_processed_at" timestamp with time zone,
	"ai_status" text,
	"error_message" text,
	"retries_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_raw_processing_log" ADD CONSTRAINT "admin_raw_processing_log_upload_id_admin_raw_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."admin_raw_uploads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_raw_processing_log" ADD CONSTRAINT "admin_raw_processing_log_row_id_admin_raw_upload_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."admin_raw_upload_rows"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_raw_processing_log" ADD CONSTRAINT "admin_raw_processing_log_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_raw_processing_log_upload_idx" ON "admin_raw_processing_log" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "admin_raw_processing_log_status_idx" ON "admin_raw_processing_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_raw_processing_log_fabric_idx" ON "admin_raw_processing_log" USING btree ("fabric_id");