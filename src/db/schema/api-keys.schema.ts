import { sql } from 'drizzle-orm'
import { pgTable, text, integer, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const apiKeys = pgTable(
  'api_keys',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),

    name: text('name').notNull(),
    prefix: text('prefix').notNull(), // public identifier (first chars)
    keyHash: text('key_hash').notNull(), // sha256 of full secret

    scopes: text('scopes').array(), // e.g. ['catalog:read','leads:write']

    createdById: integer('created_by_id').references(() => users.id, { onDelete: 'set null' }),

    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    apiKeysPrefixUnique: unique('api_keys_prefix_unique').on(table.prefix),
    apiKeysKeyHashUnique: unique('api_keys_key_hash_unique').on(table.keyHash),
    apiKeysCreatedByIdIdx: index('api_keys_created_by_id_idx').on(table.createdById),
    apiKeysCreatedAtDescIdx: index('api_keys_created_at_desc_idx').on(sql`${table.createdAt} desc`)
  })
)

