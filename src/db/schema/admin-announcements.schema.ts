import { pgEnum, pgTable, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const adminAnnouncementImportanceEnum = pgEnum('admin_announcement_importance', ['LOW', 'MEDIUM', 'HIGH'])

export const adminAnnouncements = pgTable(
  'admin_announcements',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    importance: adminAnnouncementImportanceEnum('importance').notNull().default('MEDIUM'),
    referenceCode: text('reference_code'),
    createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminAnnouncementsCreatedByIdx: index('admin_announcements_created_by_user_id_idx').on(table.createdByUserId),
    adminAnnouncementsDeletedAtIdx: index('admin_announcements_deleted_at_idx').on(table.deletedAt)
  })
)

export const adminAnnouncementAcknowledgements = pgTable(
  'admin_announcement_acknowledgements',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    announcementId: integer('announcement_id')
      .notNull()
      .references(() => adminAnnouncements.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    adminAnnouncementAcksAnnouncementIdx: index('admin_announcement_acks_announcement_id_idx').on(table.announcementId),
    adminAnnouncementAcksUserIdx: index('admin_announcement_acks_user_id_idx').on(table.userId),
    adminAnnouncementAcksUnique: uniqueIndex('admin_announcement_acks_announcement_user_unique').on(
      table.announcementId,
      table.userId
    )
  })
)
