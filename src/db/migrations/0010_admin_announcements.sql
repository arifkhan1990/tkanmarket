CREATE TYPE "public"."admin_announcement_importance" AS ENUM('LOW', 'MEDIUM', 'HIGH');
--> statement-breakpoint
CREATE TABLE "admin_announcements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_announcements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"body" text NOT NULL,
	"importance" "admin_announcement_importance" DEFAULT 'MEDIUM' NOT NULL,
	"reference_code" text,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_announcement_acknowledgements" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "admin_announcement_acknowledgements_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"announcement_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_announcements" ADD CONSTRAINT "admin_announcements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_announcement_acknowledgements" ADD CONSTRAINT "admin_announcement_acknowledgements_announcement_id_admin_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."admin_announcements"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_announcement_acknowledgements" ADD CONSTRAINT "admin_announcement_acknowledgements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "admin_announcements_created_by_user_id_idx" ON "admin_announcements" USING btree ("created_by_user_id");
--> statement-breakpoint
CREATE INDEX "admin_announcements_deleted_at_idx" ON "admin_announcements" USING btree ("deleted_at");
--> statement-breakpoint
CREATE INDEX "admin_announcement_acks_announcement_id_idx" ON "admin_announcement_acknowledgements" USING btree ("announcement_id");
--> statement-breakpoint
CREATE INDEX "admin_announcement_acks_user_id_idx" ON "admin_announcement_acknowledgements" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "admin_announcement_acks_announcement_user_unique" ON "admin_announcement_acknowledgements" USING btree ("announcement_id","user_id");
