ALTER TABLE "social_posts" ALTER COLUMN "content_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "social_posts" SET "content_type" = 'REEL_10' WHERE "content_type" IN ('REEL_15', 'REEL_20', 'REEL_30');--> statement-breakpoint
DROP TYPE "public"."social_content_type";--> statement-breakpoint
CREATE TYPE "public"."social_content_type" AS ENUM('REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN');--> statement-breakpoint
ALTER TABLE "social_posts" ALTER COLUMN "content_type" SET DATA TYPE "public"."social_content_type" USING "content_type"::"public"."social_content_type";