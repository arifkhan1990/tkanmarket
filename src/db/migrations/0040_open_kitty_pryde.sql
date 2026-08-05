DROP INDEX "social_posts_active_uq";--> statement-breakpoint
CREATE INDEX "social_posts_fabric_platform_status_idx" ON "social_posts" USING btree ("fabric_id","platform","status");