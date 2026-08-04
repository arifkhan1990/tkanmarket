import { pgTable, integer, text, timestamp, index } from 'drizzle-orm/pg-core'

import { users } from './users.schema'

export const adminTotpRecoveryCodes = pgTable(
  'admin_totp_recovery_codes',
  {
    id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    codeHash: text('code_hash').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true })
  },
  (table) => ({
    adminTotpRecoveryCodesUserIdIdx: index('admin_totp_recovery_codes_user_id_idx').on(table.userId),
    adminTotpRecoveryCodesCodeHashIdx: index('admin_totp_recovery_codes_code_hash_idx').on(table.codeHash)
  })
)

