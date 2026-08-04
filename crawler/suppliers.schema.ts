import { pgTable, integer, text, timestamptz, boolean, index } from 'drizzle-orm/pg-core'

export const suppliers = pgTable('suppliers', {
  id:              integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name:            text('name').notNull(),
  slug:            text('slug').notNull().unique(),
  country:         text('country').notNull().default('China'),
  city:            text('city'),
  province:        text('province'),
  description:     text('description'),
  logoUrl:         text('logo_url'),
  websiteUrl:      text('website_url'),
  verified:        boolean('verified').notNull().default(false),
  establishedYear: integer('established_year'),
  sourceUrl:       text('source_url'),
  createdAt:       timestamptz('created_at').notNull().defaultNow(),
  updatedAt:       timestamptz('updated_at').notNull().defaultNow(),
  deletedAt:       timestamptz('deleted_at'),
}, (table) => ({
  slugIdx:      index('suppliers_slug_idx').on(table.slug),
  verifiedIdx:  index('suppliers_verified_idx').on(table.verified),
  deletedAtIdx: index('suppliers_deleted_at_idx').on(table.deletedAt),
}))

export type Supplier    = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
