import {
  pgTable, integer, text, timestamptz, pgEnum, jsonb, index,
} from 'drizzle-orm/pg-core'
import { fabrics }   from './fabrics.schema'
import { users }     from './users.schema'

export const leadStatusEnum = pgEnum('lead_status', [
  'NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST',
])

export const leadSourceEnum = pgEnum('lead_source', [
  'MARKETPLACE_INQUIRY', 'SAMPLE_REQUEST', 'SOCIAL_CAMPAIGN', 'DIRECT_CONTACT', 'MANUAL_ENTRY',
])

export const leads = pgTable('leads', {
  id:           integer('id').generatedAlwaysAsIdentity().primaryKey(),
  source:       leadSourceEnum('source').notNull(),
  status:       leadStatusEnum('status').notNull().default('NEW'),
  companyName:  text('company_name').notNull(),
  contactName:  text('contact_name').notNull(),
  email:        text('email').notNull(),
  phone:        text('phone'),
  country:      text('country').notNull(),
  city:         text('city'),
  fabricId:     integer('fabric_id').references(() => fabrics.id, { onDelete: 'set null' }),
  inquiryText:  text('inquiry_text').notNull(),
  assignedToId: integer('assigned_to_id').references(() => users.id, { onDelete: 'set null' }),
  utmSource:    text('utm_source'),
  utmCampaign:  text('utm_campaign'),
  utmMedium:    text('utm_medium'),
  createdAt:    timestamptz('created_at').notNull().defaultNow(),
  updatedAt:    timestamptz('updated_at').notNull().defaultNow(),
  deletedAt:    timestamptz('deleted_at'),
}, (table) => ({
  statusIdx:     index('leads_status_idx').on(table.status),
  assignedIdx:   index('leads_assigned_to_idx').on(table.assignedToId),
  createdAtIdx:  index('leads_created_at_idx').on(table.createdAt),
  fabricIdx:     index('leads_fabric_id_idx').on(table.fabricId),
  deletedAtIdx:  index('leads_deleted_at_idx').on(table.deletedAt),
}))

// Lead notes
export const leadNotes = pgTable('lead_notes', {
  id:        integer('id').generatedAlwaysAsIdentity().primaryKey(),
  leadId:    integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  authorId:  integer('author_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  content:   text('content').notNull(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (table) => ({
  leadIdIdx: index('lead_notes_lead_id_idx').on(table.leadId),
}))

// Lead activity log (audit trail)
export const leadActivityLog = pgTable('lead_activity_log', {
  id:        integer('id').generatedAlwaysAsIdentity().primaryKey(),
  leadId:    integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  actorId:   integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type').notNull(),
  payload:   jsonb('payload'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (table) => ({
  leadIdIdx: index('lead_activity_lead_id_idx').on(table.leadId),
}))

export type Lead            = typeof leads.$inferSelect
export type NewLead         = typeof leads.$inferInsert
export type LeadNote        = typeof leadNotes.$inferSelect
export type NewLeadNote     = typeof leadNotes.$inferInsert
export type LeadActivity    = typeof leadActivityLog.$inferSelect
