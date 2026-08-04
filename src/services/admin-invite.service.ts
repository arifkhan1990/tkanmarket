import { createHash, randomBytes } from 'node:crypto'

import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminInvites } from '@/db/schema/auth-flow.schema'
import { users } from '@/db/schema/users.schema'
import { sendTransactionalEmail } from '@/lib/email/resend-mail'
import { logger } from '@/lib/logger'
import { hashPassword } from '@/lib/auth/password'
import { AuthSecurityEventService } from '@/services/auth-security-event.service'
import type { AdminInviteRow } from '@/types/admin-invite.types'

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function appBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
}

export class AdminInviteService {
  public static async createInvite(params: {
    email: string
    role: 'ADMIN' | 'SALES' | 'VIEWER'
    invitedByUserId: number
  }): Promise<{ invite: AdminInviteRow; plainToken: string }> {
    const db = getDb()
    const normalized = params.email.trim().toLowerCase()

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, normalized), isNull(users.deletedAt)))
      .limit(1)
    if (existing[0]?.id) {
      throw new Error('User with this email already exists')
    }

    const plainToken = randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(plainToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const [inserted] = await db
      .insert(adminInvites)
      .values({
        email: normalized,
        tokenHash,
        invitedByUserId: params.invitedByUserId,
        role: params.role,
        expiresAt,
        acceptedAt: null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({
        id: adminInvites.id,
        email: adminInvites.email,
        role: adminInvites.role,
        expiresAt: adminInvites.expiresAt,
        acceptedAt: adminInvites.acceptedAt,
        invitedByUserId: adminInvites.invitedByUserId
      })

    if (!inserted) throw new Error('Failed to create invite')

    const invite: AdminInviteRow = {
      id: inserted.id,
      email: inserted.email,
      role: inserted.role,
      expires_at: inserted.expiresAt.toISOString(),
      accepted_at: inserted.acceptedAt?.toISOString() ?? null,
      invited_by_user_id: inserted.invitedByUserId
    }

    const url = `${appBaseUrl().replace(/\/$/, '')}/invite/accept?token=${encodeURIComponent(plainToken)}`

    try {
      await sendTransactionalEmail({
        to: normalized,
        subject: 'TkanMarket admin invitation',
        html: `<p>You have been invited to TkanMarket Admin.</p><p><a href="${url}">Complete registration</a></p>`
      })
    } catch (err) {
      logger.error('admin_invite.email_failed', { err })
    }

    return { invite, plainToken }
  }

  public static async listPending(): Promise<AdminInviteRow[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: adminInvites.id,
        email: adminInvites.email,
        role: adminInvites.role,
        expiresAt: adminInvites.expiresAt,
        acceptedAt: adminInvites.acceptedAt,
        invitedByUserId: adminInvites.invitedByUserId
      })
      .from(adminInvites)
      .where(and(isNull(adminInvites.deletedAt), isNull(adminInvites.acceptedAt)))
      .orderBy(adminInvites.id)
      .limit(200)

    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      expires_at: r.expiresAt.toISOString(),
      accepted_at: r.acceptedAt?.toISOString() ?? null,
      invited_by_user_id: r.invitedByUserId
    }))
  }

  public static async acceptInvite(params: {
    token: string
    name: string
    password: string
  }): Promise<void> {
    const db = getDb()
    const tokenHash = sha256Hex(params.token.trim())

    const rows = await db
      .select({
        id: adminInvites.id,
        email: adminInvites.email,
        role: adminInvites.role,
        expiresAt: adminInvites.expiresAt,
        acceptedAt: adminInvites.acceptedAt
      })
      .from(adminInvites)
      .where(
        and(
          eq(adminInvites.tokenHash, tokenHash),
          isNull(adminInvites.deletedAt),
          isNull(adminInvites.acceptedAt)
        )
      )
      .limit(1)

    const inv = rows[0]
    if (!inv) {
      throw new Error('Invalid or expired invitation')
    }
    if (inv.expiresAt.getTime() < Date.now()) {
      throw new Error('Invitation has expired')
    }

    const dup = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, inv.email), isNull(users.deletedAt)))
      .limit(1)
    if (dup[0]?.id) {
      throw new Error('Account already exists')
    }

    const passwordHash = hashPassword(params.password)

    const [userRow] = await db
      .insert(users)
      .values({
        email: inv.email,
        name: params.name.trim(),
        role: inv.role,
        passwordHash,
        avatarUrl: null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: users.id })

    if (!userRow?.id) throw new Error('Failed to create user')

    await db
      .update(adminInvites)
      .set({ acceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(adminInvites.id, inv.id))

    await AuthSecurityEventService.record({
      userId: userRow.id,
      email: inv.email,
      eventType: 'invite_accepted',
      success: true,
      metadata: { inviteId: inv.id }
    })
  }
}
