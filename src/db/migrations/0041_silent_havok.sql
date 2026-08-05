CREATE TYPE "public"."social_post_review_state" AS ENUM('NOT_REVIEWED', 'CONTENT_APPROVED', 'VIDEO_APPROVED', 'FULLY_APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."social_revision_change_type" AS ENUM('GENERATED', 'REGENERATED', 'CAPTION_EDITED', 'HASHTAGS_EDITED', 'SCRIPT_EDITED', 'SCHEDULED', 'REJECTED', 'RESTORED');--> statement-breakpoint
CREATE TABLE "social_post_revisions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "social_post_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"post_id" integer NOT NULL,
	"revision_number" integer NOT NULL,
	"change_type" "social_revision_change_type" NOT NULL,
	"snapshot" jsonb,
	"before" jsonb,
	"after" jsonb,
	"changed_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "review_state" "social_post_review_state" DEFAULT 'NOT_REVIEWED' NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "revision_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "supersedes_post_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "rejected_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "social_posts" ADD COLUMN "rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "social_post_revisions" ADD CONSTRAINT "social_post_revisions_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_post_revisions" ADD CONSTRAINT "social_post_revisions_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_post_revisions_post_idx" ON "social_post_revisions" USING btree ("post_id","created_at");--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_supersedes_post_id_social_posts_id_fk" FOREIGN KEY ("supersedes_post_id") REFERENCES "public"."social_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_posts_supersedes_idx" ON "social_posts" USING btree ("supersedes_post_id");--> statement-breakpoint
CREATE INDEX "social_posts_rejected_by_idx" ON "social_posts" USING btree ("rejected_by_user_id");