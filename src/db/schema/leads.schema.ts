import { sql } from 'drizzle-orm'
import { pgEnum, pgTable, text, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

import { users } from './users.schema'
import { fabrics } from './fabrics.schema'

export const leadStatusEnum = pgEnum('lead_status', [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
])

export const leadSourceEnum = pgEnum('lead_source', [
  'MARKETPLACE_INQUIRY',
  'SAMPLE_REQUEST',
  'SOCIAL_CAMPAIGN',
  'DIRECT_CONTACT',
  'MANUAL_ENTRY'
])

export const leads = pgTable(
  'leads',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    source: leadSourceEnum('source').notNull(),
    status: leadStatusEnum('status').notNull().default('NEW'),

    companyName: text('company_name').notNull(),
    contactName: text('contact_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    country: text('country').notNull(),
    city: text('city'),

    fabricId: integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),
    inquiryText: text('inquiry_text').notNull(),

    assignedToId: integer('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),

    utmSource: text('utm_source'),
    utmCampaign: text('utm_campaign'),
    utmMedium: text('utm_medium'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    leadsStatusIdx: index('leads_status_idx').on(table.status),
    leadsAssignedToIdIdx: index('leads_assigned_to_id_idx').on(table.assignedToId),
    leadsCreatedAtDescIdx: index('leads_created_at_desc_idx').on(sql`${table.createdAt} desc`),
    leadsFabricIdIdx: index('leads_fabric_id_idx').on(table.fabricId)
  })
)

export const leadNotes = pgTable(
  'lead_notes',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    content: text('content').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    leadNotesLeadIdIdx: index('lead_notes_lead_id_idx').on(table.leadId),
    leadNotesAuthorIdIdx: index('lead_notes_author_id_idx').on(table.authorId),
    leadNotesDeletedAtIdx: index('lead_notes_deleted_at_idx').on(table.deletedAt)
  })
)

export const leadActivityLog = pgTable(
  'lead_activity_log',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    leadId: integer('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    actorId: integer('actor_id').references(() => users.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    leadActivityLogLeadIdIdx: index('lead_activity_log_lead_id_idx').on(table.leadId),
    leadActivityLogActorIdIdx: index('lead_activity_log_actor_id_idx').on(table.actorId)
  })
)

