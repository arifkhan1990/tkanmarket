import { sql } from 'drizzle-orm'
import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

import { userRoleEnum, users } from './users.schema'

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    prtUserIdIdx: index('password_reset_tokens_user_id_idx').on(table.userId),
    prtTokenHashIdx: index('password_reset_tokens_token_hash_idx').on(table.tokenHash),
    prtExpiresAtIdx: index('password_reset_tokens_expires_at_idx').on(sql`${table.expiresAt} desc`)
  })
)

export const adminInvites = pgTable(
  'admin_invites',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    invitedByUserId: integer('invited_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    role: userRoleEnum('role').notNull().default('VIEWER'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminInvitesEmailIdx: index('admin_invites_email_idx').on(table.email),
    adminInvitesTokenHashIdx: index('admin_invites_token_hash_idx').on(table.tokenHash),
    adminInvitesInvitedByIdx: index('admin_invites_invited_by_user_id_idx').on(table.invitedByUserId)
  })
)
