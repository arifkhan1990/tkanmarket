CREATE TABLE "fabric_category_terms" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_category_terms_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_en" text,
	"description_ru" text,
	"description_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);--> statement-breakpoint
CREATE UNIQUE INDEX "fabric_category_terms_slug_uq" ON "fabric_category_terms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "fabric_category_terms_active_deleted_idx" ON "fabric_category_terms" USING btree ("is_active","deleted_at");--> statement-breakpoint
CREATE INDEX "fabric_category_terms_deleted_at_idx" ON "fabric_category_terms" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "fabric_category_terms_sort_order_idx" ON "fabric_category_terms" USING btree ("sort_order");--> statement-breakpoint

-- Backfill: create a term record for every existing junction slug.
INSERT INTO "fabric_category_terms" ("slug", "name_ru", "sort_order", "is_active")
SELECT DISTINCT
  fc."category_slug" AS "slug",
  fc."category_slug" AS "name_ru",
  0 AS "sort_order",
  true AS "is_active"
FROM "fabric_categories" fc
WHERE fc."deleted_at" IS NULL
  AND fc."category_slug" IS NOT NULL
  AND btrim(fc."category_slug") <> ''
ON CONFLICT ("slug") DO NOTHING;

