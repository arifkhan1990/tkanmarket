ALTER TABLE "generated_media" ADD COLUMN "superseded_by_media_id" integer;--> statement-breakpoint
-- Enforce one active (non-published) post per fabric+platform: keep the newest
-- row per group, soft-delete legacy duplicates BEFORE creating the unique index.
UPDATE "social_posts"
SET "deleted_at" = now(), "updated_at" = now()
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "fabric_id", "platform" ORDER BY "id" DESC) AS rn
    FROM "social_posts"
    WHERE "status" <> 'PUBLISHED' AND "deleted_at" IS NULL
  ) ranked WHERE rn > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "social_posts_active_uq" ON "social_posts" USING btree ("fabric_id","platform") WHERE "social_posts"."status" <> 'PUBLISHED' AND "social_posts"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "generated_media_superseded_by_idx" ON "generated_media" USING btree ("superseded_by_media_id");