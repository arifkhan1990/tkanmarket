CREATE TABLE "fabric_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fabric_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"label_ru" text NOT NULL,
	"label_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "fabric_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "fabric_type" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "fabric_types_slug_idx" ON "fabric_types" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "fabric_types_sort_order_idx" ON "fabric_types" USING btree ("sort_order");--> statement-breakpoint
DROP TYPE "public"."fabric_type";
--> statement-breakpoint
INSERT INTO "fabric_types" ("slug", "label_en", "label_ru", "sort_order") VALUES
  ('woven',     'Woven',     'Тканый',       1),
  ('knit',      'Knit',      'Трикотаж',     2),
  ('nonwoven',  'Nonwoven',  'Нетканый',     3),
  ('lace',      'Lace',      'Кружево',      4),
  ('lining',    'Lining',    'Подкладка',    5),
  ('technical', 'Technical', 'Технический',  6),
  ('other',     'Other',     'Другой',       7);