import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const rawProductSourceLanguageEnum = pgEnum('raw_product_source_language', ['zh', 'en'])

export const rawProducts = pgTable(
  'raw_products',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    source: text('source').notNull(), // e.g. 'alibaba' | '1688' | 'manual'
    productUrl: text('product_url').notNull().unique(),
    urlHash: text('url_hash').notNull().unique(),

    rawTitle: text('raw_title').notNull(),
    rawDescription: text('raw_description'),
    rawComposition: text('raw_composition'),
    rawImages: text('raw_images').array(),

    supplierName: text('supplier_name'),
    priceText: text('price_text'),
    moqText: text('moq_text'),

    sourceLanguage: rawProductSourceLanguageEnum('source_language').notNull().default('zh'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    rawProductsSourceCreatedAtDescIdx: index('raw_products_source_created_at_desc_idx').on(table.source, sql`${table.createdAt} desc`)
  })
)

