import { sql } from 'drizzle-orm'
import { pgTable, text, integer, timestamp, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const notifications = pgTable(
  'notifications',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    type: text('type').notNull(), // e.g. 'system', 'lead_assigned'
    title: text('title').notNull(),
    body: text('body'),
    data: jsonb('data'),

    readAt: timestamp('read_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),

    isHighPriority: boolean('is_high_priority').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    notificationsUserIdIdx: index('notifications_user_id_idx').on(table.userId),
    notificationsReadAtIdx: index('notifications_read_at_idx').on(table.readAt),
    notificationsCreatedAtDescIdx: index('notifications_created_at_desc_idx').on(sql`${table.createdAt} desc`)
  })
)

export const notificationSettings = pgTable(
  'notification_settings',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    emailEnabled: boolean('email_enabled').notNull().default(true),
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),

    preferences: jsonb('preferences'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    notificationSettingsUserIdIdx: index('notification_settings_user_id_idx').on(table.userId),
    notificationSettingsUserIdUnique: unique('notification_settings_user_id_unique').on(table.userId)
  })
)

