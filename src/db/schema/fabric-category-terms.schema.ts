import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const fabricCategoryTerms = pgTable(
  'fabric_category_terms',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull(),
    nameRu: text('name_ru').notNull(),
    nameEn: text('name_en'),
    descriptionRu: text('description_ru'),
    descriptionEn: text('description_en'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    fabricCategoryTermsSlugUq: uniqueIndex('fabric_category_terms_slug_uq').on(table.slug),
    fabricCategoryTermsActiveDeletedIdx: index('fabric_category_terms_active_deleted_idx').on(table.isActive, table.deletedAt),
    fabricCategoryTermsDeletedAtIdx: index('fabric_category_terms_deleted_at_idx').on(table.deletedAt),
    fabricCategoryTermsSortOrderIdx: index('fabric_category_terms_sort_order_idx').on(table.sortOrder)
  })
)

