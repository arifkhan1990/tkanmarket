import {
  pgTable, integer, text, timestamptz, boolean,
  numeric, pgEnum, jsonb, index,
} from 'drizzle-orm/pg-core'
import { suppliers } from './suppliers.schema'

export const fabricStatusEnum = pgEnum('fabric_status', [
  'raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected',
])

export const fabricTypeEnum = pgEnum('fabric_type', [
  'woven', 'knit', 'nonwoven', 'lace', 'lining', 'technical', 'other',
])

export const fabrics = pgTable('fabrics', {
  id:                integer('id').generatedAlwaysAsIdentity().primaryKey(),
  supplierId:        integer('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),

  slug:              text('slug').notNull().unique(),
  sku:               text('sku').unique(),
  status:            fabricStatusEnum('status').notNull().default('raw_scraped'),

  // Localized content (AI-generated)
  titleRu:           text('title_ru').notNull(),
  titleEn:           text('title_en'),
  descriptionRu:     text('description_ru'),
  descriptionEn:     text('description_en'),
  metaTitleRu:       text('meta_title_ru'),
  metaDescriptionRu: text('meta_description_ru'),

  // Fabric specifications
  fabricType:        fabricTypeEnum('fabric_type'),
  gsm:               integer('gsm'),
  widthCm:           integer('width_cm'),
  priceUsd:          numeric('price_usd', { precision: 10, scale: 2 }),
  moq:               integer('moq'),
  composition:       jsonb('composition').$type<{ material: string; percentage: number }[]>(),
  tags:              text('tags').array(),
  images:            text('images').array(),

  // Raw data from supplier (kept for reference)
  sourceUrl:         text('source_url'),
  rawTitle:          text('raw_title'),
  rawDescription:    text('raw_description'),

  // AI processing metadata
  aiConfidenceScore: numeric('ai_confidence_score', { precision: 3, scale: 2 }),
  aiProcessedAt:     timestamptz('ai_processed_at'),
  rejectionReason:   text('rejection_reason'),

  // Marketing
  isFeatured:        boolean('is_featured').notNull().default(false),
  socialScore:       integer('social_score').default(0),
  viewsCount:        integer('views_count').notNull().default(0),

  createdAt:         timestamptz('created_at').notNull().defaultNow(),
  updatedAt:         timestamptz('updated_at').notNull().defaultNow(),
  deletedAt:         timestamptz('deleted_at'),
}, (table) => ({
  slugIdx:        index('fabrics_slug_idx').on(table.slug),
  supplierIdx:    index('fabrics_supplier_id_idx').on(table.supplierId),
  statusIdx:      index('fabrics_status_idx').on(table.status),
  featuredIdx:    index('fabrics_featured_idx').on(table.isFeatured),
  socialScoreIdx: index('fabrics_social_score_idx').on(table.socialScore),
  deletedAtIdx:   index('fabrics_deleted_at_idx').on(table.deletedAt),
}))

export type Fabric    = typeof fabrics.$inferSelect
export type NewFabric = typeof fabrics.$inferInsert
