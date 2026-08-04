ALTER TABLE "blog_posts" ADD COLUMN "fabric_id" integer;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_posts_fabric_id_idx" ON "blog_posts" USING btree ("fabric_id");