import { randomBytes } from 'node:crypto'

import { and, eq, isNotNull, isNull, lte, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialActivityLog, socialOauthStates, socialPlatformCredentials } from '@/db/schema/social.schema'
import { SOCIAL_OAUTH_STATE_TTL_MS, SOCIAL_TOKEN_REFRESH_LEEWAY_MS } from '@/constants'
import { AppError, NotFoundError, ValidationError } from '@/lib/errors'
import { decryptToken, encryptToken, encryptTokenNullable } from '@/lib/crypto/token-crypto'
import { logger } from '@/lib/logger'
import { getPublisher, type PlatformCredential } from '@/lib/social/platforms'

import type { SocialPlatform } from '@/types/queue.types'

export interface PublicCredential {
  id: number
  userId: number
  platform: SocialPlatform
  accountId: string
  accountName: string | null
  accountUsername: string | null
  avatarUrl: string | null
  scopes: string[] | null
  expiresAt: string | null
  lastRefreshedAt: string | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

function mapPublic(row: typeof socialPlatformCredentials.$inferSelect): PublicCredential {
  return {
    id: row.id,
    userId: row.userId,
    platform: row.platform,
    accountId: row.accountId,
    accountName: row.accountName,
    accountUsername: row.accountUsername,
    avatarUrl: row.avatarUrl,
    scopes: row.scopes,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    lastRefreshedAt: row.lastRefreshedAt ? row.lastRefreshedAt.toISOString() : null,
    isActive: row.isActive,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  }
}

async function writeActivity(params: {
  credentialId: number | null
  action: 'CREDENTIALS_CONNECTED' | 'CREDENTIALS_DISCONNECTED' | 'CREDENTIALS_REFRESHED'
  actorUserId: number | null
  details?: Record<string, unknown>
}): Promise<void> {
  const db = getDb()
  await db.insert(socialActivityLog).values({
    credentialId: params.credentialId,
    action: params.action,
    actorUserId: params.actorUserId,
    details: params.details ?? null
  })
}

export class SocialCredentialsService {
  public static async startOAuth(params: {
    userId: number
    platform: SocialPlatform
    redirectUri: string
  }): Promise<{ authorizationUrl: string }> {
    const publisher = getPublisher(params.platform)
    const target = await publisher.getAuthorizationUrl({ userId: params.userId, redirectUri: params.redirectUri })
    const nonce = target.state || randomBytes(24).toString('hex')
    const db = getDb()
    const expiresAt = new Date(Date.now() + SOCIAL_OAUTH_STATE_TTL_MS)
    await db.insert(socialOauthStates).values({
      state: nonce,
      codeVerifier: target.codeVerifier,
      userId: params.userId,
      platform: params.platform,
      redirectUri: params.redirectUri,
      expiresAt
    })
    return { authorizationUrl: target.url }
  }

  public static async completeOAuth(params: {
    state: string
    code: string
    actorUserId: number
  }): Promise<PublicCredential> {
    const db = getDb()
    const stateRows = await db
      .select()
      .from(socialOauthStates)
      .where(eq(socialOauthStates.state, params.state))
      .limit(1)
    const stateRow = stateRows[0]
    if (!stateRow) throw new ValidationError('Invalid OAuth state')
    if (stateRow.consumedAt) throw new ValidationError('OAuth state already used')
    if (stateRow.expiresAt.getTime() < Date.now()) throw new ValidationError('OAuth state expired')
    if (stateRow.userId !== params.actorUserId) throw new ValidationError('OAuth state user mismatch')

    await db
      .update(socialOauthStates)
      .set({ consumedAt: new Date() })
      .where(eq(socialOauthStates.id, stateRow.id))

    const publisher = getPublisher(stateRow.platform)
    const exchange = await publisher.exchangeCode({
      code: params.code,
      redirectUri: stateRow.redirectUri,
      codeVerifier: stateRow.codeVerifier
    })

    const accessEnc = encryptToken(exchange.accessToken)
    const refreshEnc = encryptTokenNullable(exchange.refreshToken)

    const inserted = await db
      .insert(socialPlatformCredentials)
      .values({
        userId: stateRow.userId,
        platform: stateRow.platform,
        accountId: exchange.accountId,
        accountName: exchange.accountName,
        accountUsername: exchange.accountUsername,
        avatarUrl: exchange.avatarUrl,
        accessTokenEncrypted: accessEnc,
        refreshTokenEncrypted: refreshEnc,
        tokenType: exchange.tokenType,
        scopes: exchange.scopes,
        expiresAt: exchange.expiresAt,
        lastRefreshedAt: new Date(),
        refreshFailureCount: 0,
        isActive: true,
        metadata: exchange.metadata,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [socialPlatformCredentials.userId, socialPlatformCredentials.platform, socialPlatformCredentials.accountId],
        set: {
          accessTokenEncrypted: accessEnc,
          refreshTokenEncrypted: refreshEnc,
          tokenType: exchange.tokenType,
          scopes: exchange.scopes,
          expiresAt: exchange.expiresAt,
          lastRefreshedAt: new Date(),
          refreshFailureCount: 0,
          isActive: true,
          accountName: exchange.accountName,
          accountUsername: exchange.accountUsername,
          avatarUrl: exchange.avatarUrl,
          metadata: exchange.metadata,
          deletedAt: null,
          updatedAt: new Date()
        }
      })
      .returning()

    const row = inserted[0]
    if (!row) throw new AppError('Failed to persist credentials', 'INTERNAL', 500)

    await writeActivity({
      credentialId: row.id,
      action: 'CREDENTIALS_CONNECTED',
      actorUserId: params.actorUserId,
      details: { platform: stateRow.platform, accountId: row.accountId }
    })

    return mapPublic(row)
  }

  public static async list(params: { userId?: number; platform?: SocialPlatform; includeInactive?: boolean }): Promise<PublicCredential[]> {
    const db = getDb()
    const conds = [isNull(socialPlatformCredentials.deletedAt)]
    if (params.userId !== undefined) conds.push(eq(socialPlatformCredentials.userId, params.userId))
    if (params.platform) conds.push(eq(socialPlatformCredentials.platform, params.platform))
    if (!params.includeInactive) conds.push(eq(socialPlatformCredentials.isActive, true))
    const rows = await db
      .select()
      .from(socialPlatformCredentials)
      .where(and(...conds))
      .orderBy(socialPlatformCredentials.platform)
    return rows.map(mapPublic)
  }

  public static async disconnect(params: { credentialId: number; actorUserId: number }): Promise<void> {
    const db = getDb()
    const rows = await db
      .update(socialPlatformCredentials)
      .set({ isActive: false, deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(socialPlatformCredentials.id, params.credentialId), isNull(socialPlatformCredentials.deletedAt)))
      .returning({ id: socialPlatformCredentials.id, platform: socialPlatformCredentials.platform })
    const updated = rows[0]
    if (!updated) throw new NotFoundError('Credential not found')
    await writeActivity({
      credentialId: updated.id,
      action: 'CREDENTIALS_DISCONNECTED',
      actorUserId: params.actorUserId,
      details: { platform: updated.platform }
    })
  }

  public static async getActiveForPlatform(platform: SocialPlatform): Promise<PlatformCredential | null> {
    const db = getDb()
    const rows = await db
      .select()
      .from(socialPlatformCredentials)
      .where(
        and(
          eq(socialPlatformCredentials.platform, platform),
          eq(socialPlatformCredentials.isActive, true),
          isNull(socialPlatformCredentials.deletedAt)
        )
      )
      .orderBy(socialPlatformCredentials.id)
      .limit(1)
    const row = rows[0]
    if (!row) return null
    return this.toPlatformCredentialWithRefresh(row)
  }

  /**
   * Fetches a specific credential by id (the one bound to a post via
   * publish_credential_id). Returns null when the credential is soft-deleted or
   * deactivated, so callers can fall back to the platform's active account.
   */
  public static async getCredentialById(credentialId: number): Promise<PlatformCredential | null> {
    const db = getDb()
    const rows = await db
      .select()
      .from(socialPlatformCredentials)
      .where(and(eq(socialPlatformCredentials.id, credentialId), isNull(socialPlatformCredentials.deletedAt)))
      .limit(1)
    const row = rows[0]
    if (!row || !row.isActive) return null
    return this.toPlatformCredentialWithRefresh(row)
  }

  private static async toPlatformCredentialWithRefresh(row: typeof socialPlatformCredentials.$inferSelect): Promise<PlatformCredential> {
    const needsRefresh = !!row.expiresAt && row.expiresAt.getTime() - Date.now() < SOCIAL_TOKEN_REFRESH_LEEWAY_MS
    if (needsRefresh) {
      try {
        return await this.refreshCredential(row.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'refresh failed'
        logger.warn('Token refresh failed, using stale token', { credentialId: row.id, platform: row.platform, message })
      }
    }
    return this.decryptRow(row)
  }

  private static decryptRow(row: typeof socialPlatformCredentials.$inferSelect): PlatformCredential {
    return {
      id: row.id,
      userId: row.userId,
      platform: row.platform,
      accountId: row.accountId,
      accountName: row.accountName,
      accountUsername: row.accountUsername,
      accessToken: decryptToken(row.accessTokenEncrypted),
      refreshToken: row.refreshTokenEncrypted ? decryptToken(row.refreshTokenEncrypted) : null,
      scopes: row.scopes,
      expiresAt: row.expiresAt,
      metadata: row.metadata
    }
  }

  public static async refreshCredential(credentialId: number): Promise<PlatformCredential> {
    const db = getDb()
    const rows = await db
      .select()
      .from(socialPlatformCredentials)
      .where(and(eq(socialPlatformCredentials.id, credentialId), isNull(socialPlatformCredentials.deletedAt)))
      .limit(1)
    const row = rows[0]
    if (!row) throw new NotFoundError('Credential not found')

    const publisher = getPublisher(row.platform)
    const decrypted = this.decryptRow(row)
    try {
      const refreshed = await publisher.refreshAccessToken(decrypted)
      const updated = await db
        .update(socialPlatformCredentials)
        .set({
          accessTokenEncrypted: encryptToken(refreshed.accessToken),
          refreshTokenEncrypted: encryptTokenNullable(refreshed.refreshToken ?? decrypted.refreshToken),
          expiresAt: refreshed.expiresAt,
          scopes: refreshed.scopes ?? row.scopes,
          lastRefreshedAt: new Date(),
          refreshFailureCount: 0,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(socialPlatformCredentials.id, credentialId))
        .returning()
      const next = updated[0]
      if (!next) throw new AppError('Failed to persist refreshed token', 'INTERNAL', 500)
      await writeActivity({ credentialId: next.id, action: 'CREDENTIALS_REFRESHED', actorUserId: null, details: { platform: next.platform } })
      return this.decryptRow(next)
    } catch (err) {
      await db
        .update(socialPlatformCredentials)
        .set({
          refreshFailureCount: sql`${socialPlatformCredentials.refreshFailureCount} + 1`,
          isActive: sql`CASE WHEN ${socialPlatformCredentials.refreshFailureCount} + 1 >= 5 THEN false ELSE ${socialPlatformCredentials.isActive} END`,
          updatedAt: new Date()
        })
        .where(eq(socialPlatformCredentials.id, credentialId))
      throw err
    }
  }

  public static async findCredentialsNeedingRefresh(limit: number): Promise<number[]> {
    const db = getDb()
    const horizon = new Date(Date.now() + SOCIAL_TOKEN_REFRESH_LEEWAY_MS)
    const rows = await db
      .select({ id: socialPlatformCredentials.id })
      .from(socialPlatformCredentials)
      .where(
        and(
          eq(socialPlatformCredentials.isActive, true),
          isNull(socialPlatformCredentials.deletedAt),
          isNotNull(socialPlatformCredentials.expiresAt),
          lte(socialPlatformCredentials.expiresAt, horizon)
        )
      )
      .limit(limit)
    return rows.map((r) => r.id)
  }
}
