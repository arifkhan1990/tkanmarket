ALTER TABLE "fabrics" ADD COLUMN IF NOT EXISTS "meta_title_en" text;
ALTER TABLE "fabrics" ADD COLUMN IF NOT EXISTS "meta_description_en" text;
ALTER TABLE "fabrics" ADD COLUMN IF NOT EXISTS "image_alt_ru" text;
ALTER TABLE "fabrics" ADD COLUMN IF NOT EXISTS "image_alt_en" text;
