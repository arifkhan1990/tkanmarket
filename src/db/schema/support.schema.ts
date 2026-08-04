import { pgEnum, pgTable, text, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const supportTicketServiceAreaEnum = pgEnum('support_ticket_service_area', [
  'CRAWLER',
  'AI',
  'WEB',
  'DATABASE'
])

export const supportTicketUrgencyEnum = pgEnum('support_ticket_urgency', ['NORMAL', 'HIGH', 'CRITICAL'])

export const supportKnowledgeCardLayoutEnum = pgEnum('support_knowledge_card_layout', ['WIDE', 'NARROW', 'FULL'])

export type SupportKnowledgeHighlight = { label: string }

export const supportKnowledgeCategories = pgTable(
  'support_knowledge_categories',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    title: text('title').notNull(),
    description: text('description').notNull(),
    iconKey: text('icon_key').notNull(),
    layout: supportKnowledgeCardLayoutEnum('layout').notNull().default('WIDE'),
    highlights: jsonb('highlights').$type<SupportKnowledgeHighlight[]>().notNull(),

    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supportKnowledgeCategoriesSortIdx: index('support_knowledge_categories_sort_idx').on(table.sortOrder),
    supportKnowledgeCategoriesDeletedAtIdx: index('support_knowledge_categories_deleted_at_idx').on(table.deletedAt)
  })
)

export const supportTroubleshootingEntries = pgTable(
  'support_troubleshooting_entries',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    code: text('code').notNull(),
    title: text('title').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    supportTroubleshootingSortIdx: index('support_troubleshooting_entries_sort_idx').on(table.sortOrder),
    supportTroubleshootingDeletedAtIdx: index('support_troubleshooting_entries_deleted_at_idx').on(table.deletedAt)
  })
)

export const internalSupportTickets = pgTable(
  'internal_support_tickets',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    submittedByUserId: integer('submitted_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    serviceArea: supportTicketServiceAreaEnum('service_area').notNull(),
    urgency: supportTicketUrgencyEnum('urgency').notNull().default('NORMAL'),
    subject: text('subject').notNull(),
    description: text('description').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    internalSupportTicketsUserIdIdx: index('internal_support_tickets_user_id_idx').on(table.submittedByUserId),
    internalSupportTicketsDeletedAtIdx: index('internal_support_tickets_deleted_at_idx').on(table.deletedAt)
  })
)
