import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Public-facing newsletter subscriptions captured by the marketing surfaces
 * (blog footer, etc.). Soft-deleted because users may unsubscribe and we want
 * to keep an audit trail of historical opt-ins.
 */
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    /**
     * Lower-cased on insert; uniqueness enforced via the index below to keep
     * idempotent re-subscribes from creating duplicate rows.
     */
    email: text('email').notNull(),
    locale: text('locale').notNull().default('en'),
    /** Free-form attribution string (e.g. `blog_footer`, `homepage_hero`). */
    source: text('source').notNull().default('blog'),
    isVerified: boolean('is_verified').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    newsletterSubscribersEmailIdx: index('newsletter_subscribers_email_idx').on(table.email),
    newsletterSubscribersDeletedAtIdx: index('newsletter_subscribers_deleted_at_idx').on(table.deletedAt),
    newsletterSubscribersCreatedAtIdx: index('newsletter_subscribers_created_at_idx').on(table.createdAt)
  })
)
