import { eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { users } from '@/db/schema/users.schema'
import { buildTotpProvisioningUri, generateTotpSecretBase32, verifyTotp } from '@/lib/auth/totp'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { AdminTotpRecoveryCodeService } from '@/services/admin-totp-recovery-codes.service'
import type { AdminProfile } from '@/types/admin-profile.types'

export class AdminProfileService {
  public static async getProfile(userId: number): Promise<AdminProfile> {
    const db = getDb()
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        totpEnabled: users.totpEnabled
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const u = rows[0]
    if (!u) throw new Error('User not found')

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      avatar_url: u.avatarUrl ?? null,
      role: u.role,
      totp_enabled: u.totpEnabled
    }
  }

  public static async updateProfile(
    userId: number,
    input: { name?: string; avatar_url?: string | null }
  ): Promise<AdminProfile> {
    const db = getDb()
    const patch: { name?: string; avatarUrl?: string | null; updatedAt: Date } = {
      updatedAt: new Date()
    }
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.avatar_url !== undefined) patch.avatarUrl = input.avatar_url

    const [row] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        totpEnabled: users.totpEnabled
      })

    if (!row) throw new Error('User not found')

    return {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar_url: row.avatarUrl ?? null,
      role: row.role,
      totp_enabled: row.totpEnabled
    }
  }

  public static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    const u = rows[0]
    if (!u?.passwordHash) {
      throw new Error('Password change unavailable for this account')
    }
    if (!verifyPassword(currentPassword, u.passwordHash)) {
      throw new Error('Current password is incorrect')
    }

    await db
      .update(users)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  public static async startTotpSetup(
    userId: number
  ): Promise<{ secret_base32: string; provisioning_uri: string; recovery_codes: string[] }> {
    const db = getDb()
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const email = rows[0]?.email
    if (!email) throw new Error('User not found')

    const secret = generateTotpSecretBase32()
    await db
      .update(users)
      .set({ totpSecret: secret, totpEnabled: false, updatedAt: new Date() })
      .where(eq(users.id, userId))

    const provisioning_uri = buildTotpProvisioningUri({
      secretBase32: secret,
      account: email,
      issuer: 'TkanMarket'
    })

    const recovery_codes = await AdminTotpRecoveryCodeService.createForUser(userId, 8)

    return { secret_base32: secret, provisioning_uri, recovery_codes }
  }

  public static async enableTotp(userId: number, code: string): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({ totpSecret: users.totpSecret })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const secret = rows[0]?.totpSecret
    if (!secret) throw new Error('TOTP setup not started')

    if (!verifyTotp(secret, code)) {
      throw new Error('Invalid authenticator code')
    }

    await db
      .update(users)
      .set({ totpEnabled: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  public static async disableTotp(userId: number, password: string): Promise<void> {
    const db = getDb()
    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    const u = rows[0]
    if (!u?.passwordHash || !verifyPassword(password, u.passwordHash)) {
      throw new Error('Invalid password')
    }

    await db
      .update(users)
      .set({ totpSecret: null, totpEnabled: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }
}
