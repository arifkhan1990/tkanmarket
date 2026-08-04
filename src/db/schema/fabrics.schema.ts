import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, boolean, numeric, jsonb, index } from 'drizzle-orm/pg-core'

import { suppliers } from './suppliers.schema'
import type { FabricCompositionItem } from '@/types/fabric'

export const fabricStatusEnum = pgEnum('fabric_status', [
  'raw_scraped',
  'ai_processing',
  'ai_processed',
  'approved',
  'rejected'
])

export const fabrics = pgTable(
  'fabrics',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    supplierId: integer('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull().unique(),
    sku: text('sku'),

    status: fabricStatusEnum('status').notNull().default('raw_scraped'),

    titleRu: text('title_ru').notNull(),
    titleEn: text('title_en'),
    descriptionRu: text('description_ru'),
    descriptionEn: text('description_en'),
    usageRu: text('usage_ru'),
    usageEn: text('usage_en'),

    metaTitleRu: text('meta_title_ru'),
    metaDescriptionRu: text('meta_description_ru'),
    metaTitleEn: text('meta_title_en'),
    metaDescriptionEn: text('meta_description_en'),
    imageAltRu: text('image_alt_ru'),
    imageAltEn: text('image_alt_en'),

    fabricType: text('fabric_type'),
    gsm: integer('gsm'),
    widthCm: integer('width_cm'),
    color: text('color'),
    colorEn: text('color_en'),
    supplyType: text('supply_type'),
    supplyTypeEn: text('supply_type_en'),
    shipmentTime: text('shipment_time'),
    shipmentTimeEn: text('shipment_time_en'),

    priceUsd: numeric('price_usd', { precision: 10, scale: 2 }),
    moq: integer('moq'),

    composition: jsonb('composition').$type<FabricCompositionItem[]>(),
    tags: text('tags').array(),
    tagsEn: text('tags_en').array(),
    images: text('images').array(),

    sourceUrl: text('source_url'),
    rawTitle: text('raw_title'),
    rawDescription: text('raw_description'),

    aiConfidenceScore: numeric('ai_confidence_score', { precision: 3, scale: 2 }),
    aiProcessedAt: timestamp('ai_processed_at', { withTimezone: true }),

    isFeatured: boolean('is_featured').notNull().default(false),
    socialScore: integer('social_score'),
    viewsCount: integer('views_count').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    fabricsStatusDeletedAtIdx: index('fabrics_status_deleted_at_idx').on(table.status, table.deletedAt),
    fabricsSupplierIdIdx: index('fabrics_supplier_id_idx').on(table.supplierId),
    fabricsSlugIdx: index('fabrics_slug_idx').on(table.slug),
    fabricsTagsGinIdx: index('fabrics_tags_gin_idx').using('gin', table.tags),
    fabricsSocialScoreDescIdx: index('fabrics_social_score_desc_idx').on(sql`${table.socialScore} desc`)
  })
)

export const fabricCategories = pgTable(
  'fabric_categories',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'cascade' }),
    categorySlug: text('category_slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    fabricCategoriesFabricIdIdx: index('fabric_categories_fabric_id_idx').on(table.fabricId)
  })
)

