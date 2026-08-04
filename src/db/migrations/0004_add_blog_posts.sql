CREATE TABLE "blog_posts" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "excerpt" text,
  "hero_image_url" text,
  "category" text,
  "read_minutes" integer,
  "author_name" text,
  "author_role" text,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at" DESC);

