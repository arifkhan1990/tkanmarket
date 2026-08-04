CREATE TYPE "public"."admin_raw_upload_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."admin_raw_upload_row_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "admin_raw_uploads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_raw_uploads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"filename" text NOT NULL,
	"original_file_url" text,
	"file_type" text NOT NULL,
	"status" "admin_raw_upload_status" DEFAULT 'PENDING' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"uploaded_by_user_id" integer NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_raw_upload_rows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_raw_upload_rows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"upload_id" integer NOT NULL,
	"row_index" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"normalized_data" jsonb,
	"status" "admin_raw_upload_row_status" DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "admin_raw_uploads" ADD CONSTRAINT "admin_raw_uploads_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_raw_upload_rows" ADD CONSTRAINT "admin_raw_upload_rows_upload_id_admin_raw_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."admin_raw_uploads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_raw_uploads_status_idx" ON "admin_raw_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_raw_uploads_user_idx" ON "admin_raw_uploads" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "admin_raw_upload_rows_upload_idx" ON "admin_raw_upload_rows" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "admin_raw_upload_rows_status_idx" ON "admin_raw_upload_rows" USING btree ("status");