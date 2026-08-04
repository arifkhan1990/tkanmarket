import { pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const cookieConsents = pgTable(
  'cookie_consents',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    visitorKey: text('visitor_key').notNull(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    preferences: jsonb('preferences').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    cookieConsentsVisitorKeyIdx: index('cookie_consents_visitor_key_idx').on(table.visitorKey),
    cookieConsentsUserIdIdx: index('cookie_consents_user_id_idx').on(table.userId)
  })
)
