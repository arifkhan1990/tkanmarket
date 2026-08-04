import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const fabricTypes = pgTable(
  'fabric_types',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug').notNull().unique(),
    labelRu: text('label_ru').notNull(),
    labelEn: text('label_en'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    fabricTypesSlugIdx: index('fabric_types_slug_idx').on(table.slug),
    fabricTypesSortOrderIdx: index('fabric_types_sort_order_idx').on(table.sortOrder)
  })
)

export type FabricType = typeof fabricTypes.$inferSelect
export type NewFabricType = typeof fabricTypes.$inferInsert
