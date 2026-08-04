import { sql } from 'drizzle-orm'
import { pgTable, text, integer, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const auditLog = pgTable(
  'audit_log',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),

    action: text('action').notNull(), // e.g. 'role.updated'
    entityType: text('entity_type').notNull(), // e.g. 'role'
    entityId: integer('entity_id'),

    success: boolean('success').notNull().default(true),
    message: text('message'),
    payload: jsonb('payload'),

    ip: text('ip'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    auditLogActorIdIdx: index('audit_log_actor_id_idx').on(table.actorId),
    auditLogEntityIdx: index('audit_log_entity_idx').on(table.entityType, table.entityId),
    auditLogCreatedAtDescIdx: index('audit_log_created_at_desc_idx').on(sql`${table.createdAt} desc`)
  })
)

export const authSecurityEvents = pgTable(
  'auth_security_events',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: text('email'),

    eventType: text('event_type').notNull(), // e.g. 'login_attempt', '2fa_enabled'
    success: boolean('success').notNull().default(true),

    ip: text('ip'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    authSecurityEventsUserIdIdx: index('auth_security_events_user_id_idx').on(table.userId),
    authSecurityEventsEventTypeIdx: index('auth_security_events_event_type_idx').on(table.eventType),
    authSecurityEventsCreatedAtDescIdx: index('auth_security_events_created_at_desc_idx').on(sql`${table.createdAt} desc`)
  })
)

