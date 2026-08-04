import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const suppliers = pgTable('suppliers', {
  id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  country: text('country').notNull().default('China'),
  city: text('city'),
  province: text('province'),
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  verified: boolean('verified').notNull().default(false),
  establishedYear: integer('established_year'),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true })
})

