import { pgTable, integer, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'

import { fabrics } from './fabrics.schema'
import { users } from './users.schema'

export const fabricActivityLog = pgTable(
  'fabric_activity_log',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    fabricId: integer('fabric_id')
      .notNull()
      .references(() => fabrics.id, { onDelete: 'restrict' }),
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'restrict' }),
    eventType: text('event_type').notNull(),
    message: text('message').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    fabricActivityLogFabricIdIdx: index('fabric_activity_log_fabric_id_idx').on(table.fabricId),
    fabricActivityLogActorIdIdx: index('fabric_activity_log_actor_id_idx').on(table.actorId),
    fabricActivityLogCreatedAtDescIdx: index('fabric_activity_log_created_at_desc_idx').on(table.createdAt)
  })
)

