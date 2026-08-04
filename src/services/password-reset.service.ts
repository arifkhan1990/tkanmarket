import { createHash, randomBytes } from 'node:crypto'

import { and, eq, gt, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { passwordResetTokens } from '@/db/schema/auth-flow.schema'
import { users } from '@/db/schema/users.schema'
import { sendTransactionalEmail } from '@/lib/email/resend-mail'
import { logger } from '@/lib/logger'
import { AuthSecurityEventService } from '@/services/auth-security-event.service'

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
}

export class PasswordResetService {
  public static async requestReset(email: string): Promise<void> {
    const db = getDb()
    const normalized = email.trim().toLowerCase()

    const rows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.email, normalized), isNull(users.deletedAt)))
      .limit(1)

    const u = rows[0]
    if (!u) {
      // Do not reveal whether the email exists
      return
    }

    const plainToken = randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(plainToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.insert(passwordResetTokens).values({
      userId: u.id,
      tokenHash,
      expiresAt,
      usedAt: null,
      updatedAt: new Date(),
      deletedAt: null
    })

    const resetUrl = `${appBaseUrl().replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(plainToken)}`

    try {
      await sendTransactionalEmail({
        to: u.email,
        subject: 'Reset your TkanMarket admin password',
        html: `<p>Click the link to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      })
    } catch (err) {
      logger.error('password_reset.email_failed', { err })
    }

    await AuthSecurityEventService.record({
      userId: u.id,
      email: u.email,
      eventType: 'password_reset_requested',
      success: true,
      metadata: null
    })
  }

  public static async completeReset(token: string, newPassword: string): Promise<void> {
    const db = getDb()
    const tokenHash = sha256Hex(token.trim())

    const rows = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
        usedAt: passwordResetTokens.usedAt
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.deletedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1)

    const row = rows[0]
    if (!row) {
      throw new Error('Invalid or expired reset link')
    }

    const { hashPassword } = await import('@/lib/auth/password')
    const hash = hashPassword(newPassword)

    await db
      .update(users)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(users.id, row.userId))

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id))

    const u = await db.select({ email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1)

    await AuthSecurityEventService.record({
      userId: row.userId,
      email: u[0]?.email ?? null,
      eventType: 'password_reset_completed',
      success: true,
      metadata: null
    })
  }
}
