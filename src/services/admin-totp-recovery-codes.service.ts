import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminTotpRecoveryCodes } from '@/db/schema/admin-totp-recovery-codes.schema'
import { generateRecoveryCodes, hashRecoveryCode, normalizeRecoveryCode } from '@/lib/auth/recovery-codes'
import { logger } from '@/lib/logger'

export class AdminTotpRecoveryCodeService {
  public static async createForUser(userId: number, count = 8): Promise<string[]> {
    try {
      const db = getDb()
      const now = new Date()

      // Soft-delete any previous (unused) recovery codes.
      await db
        .update(adminTotpRecoveryCodes)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(eq(adminTotpRecoveryCodes.userId, userId), isNull(adminTotpRecoveryCodes.deletedAt)))

      const codes = generateRecoveryCodes(count)
      const rows = codes.map((c) => ({
        userId,
        codeHash: hashRecoveryCode(c),
        usedAt: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      }))

      await db.insert(adminTotpRecoveryCodes).values(rows)
      return codes
    } catch (err) {
      logger.error('admin_totp_recovery_codes.create_for_user_failed', { err, userId })
      throw err
    }
  }

  public static async consumeForUser(userId: number, code: string): Promise<boolean> {
    try {
      const db = getDb()
      const now = new Date()
      const normalized = normalizeRecoveryCode(code)
      const codeHash = hashRecoveryCode(normalized)

      const [row] = await db
        .select({ id: adminTotpRecoveryCodes.id })
        .from(adminTotpRecoveryCodes)
        .where(
          and(
            eq(adminTotpRecoveryCodes.userId, userId),
            eq(adminTotpRecoveryCodes.codeHash, codeHash),
            isNull(adminTotpRecoveryCodes.usedAt),
            isNull(adminTotpRecoveryCodes.deletedAt)
          )
        )
        .limit(1)

      if (!row) return false

      await db
        .update(adminTotpRecoveryCodes)
        .set({ usedAt: now, updatedAt: now })
        .where(eq(adminTotpRecoveryCodes.id, row.id))

      return true
    } catch (err) {
      logger.error('admin_totp_recovery_codes.consume_for_user_failed', { err, userId })
      throw err
    }
  }
}

