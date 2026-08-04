import crypto from 'node:crypto'

import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { apiKeys } from '@/db/schema/api-keys.schema'
import { users } from '@/db/schema/users.schema'
import { auditLog } from '@/db/schema/audit.schema'
import { crawlerRuns } from '@/db/schema/crawler.schema'

import type { ApiKeyCreateResponse, ApiKeyListItem, ApiKeysListResponse, ApiKeyRevokeResponse, CrawlerIntegrationItem, CrawlerIntegrationsResponse } from '@/types/api-keys-admin.types'

export class ApiKeysAdminService {
  public static async list(params: { page: number; limit: number; q?: string | null }): Promise<ApiKeysListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const q = params.q?.trim() ?? ''
    const where =
      q.length > 0
        ? and(
            isNull(apiKeys.deletedAt),
            or(ilike(apiKeys.name, `%${q}%`), ilike(apiKeys.prefix, `%${q}%`))
          )
        : isNull(apiKeys.deletedAt)

    const [totalRow, rows] = await Promise.all([
      db.select({ total: count() }).from(apiKeys).where(where),
      db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          prefix: apiKeys.prefix,
          scopes: apiKeys.scopes,
          lastUsedAt: apiKeys.lastUsedAt,
          revokedAt: apiKeys.revokedAt,
          isActive: apiKeys.isActive,
          createdAt: apiKeys.createdAt,
          createdByName: users.name,
          createdByEmail: users.email
        })
        .from(apiKeys)
        .leftJoin(users, eq(apiKeys.createdById, users.id))
        .where(where)
        .orderBy(desc(apiKeys.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    const items: ApiKeyListItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      prefix: r.prefix,
      scopes: r.scopes,
      last_used_at: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
      revoked_at: r.revokedAt ? r.revokedAt.toISOString() : null,
      is_active: r.isActive,
      created_at: r.createdAt.toISOString(),
      created_by_name: r.createdByName ?? null,
      created_by_email: r.createdByEmail ?? null
    }))

    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        total: totalRow[0]?.total ?? 0,
        totalPages: Math.max(1, Math.ceil((totalRow[0]?.total ?? 0) / params.limit))
      }
    }
  }

  public static async create(params: { name: string; scopes: string[]; createdById: number; }): Promise<ApiKeyCreateResponse> {
    const db = getDb()
    const createdById = params.createdById

    const randomBytes = crypto.randomBytes(24).toString('hex')
    const secret = `tm_${randomBytes}`
    const prefix = secret.slice(0, 8)
    const keyHash = crypto.createHash('sha256').update(secret).digest('hex')

    // Ensure hash uniqueness (extremely low collision risk).
    const existing = await db.select({ id: apiKeys.id }).from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1)
    if (existing[0]?.id) throw new Error('Key generation collision, please retry.')

    const inserted = await db
      .insert(apiKeys)
      .values({
        name: params.name.trim(),
        prefix,
        keyHash,
        scopes: params.scopes,
        createdById,
        lastUsedAt: null,
        revokedAt: null,
        isActive: true,
        updatedAt: new Date(),
        createdAt: new Date(),
        deletedAt: null
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt
      })

    const row = inserted[0]
    if (!row) throw new Error('Failed to create API key')

    const apiKey: ApiKeyListItem = {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      scopes: row.scopes,
      last_used_at: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
      revoked_at: row.revokedAt ? row.revokedAt.toISOString() : null,
      is_active: row.isActive,
      created_at: row.createdAt.toISOString(),
      created_by_name: null,
      created_by_email: null
    }

    return {
      api_key: apiKey,
      secret,
      preview: `${prefix}••••••••`
    }
  }

  public static async revoke(params: { apiKeyId: number; revokedById: number; ip: string | null; userAgent: string | null }): Promise<ApiKeyRevokeResponse> {
    const db = getDb()
    const now = new Date()

    const [existing] = await db.select({ id: apiKeys.id }).from(apiKeys).where(and(eq(apiKeys.id, params.apiKeyId), isNull(apiKeys.deletedAt))).limit(1)
    if (!existing?.id) throw new Error('API key not found')

    const updated = await db
      .update(apiKeys)
      .set({
        isActive: false,
        revokedAt: now,
        updatedAt: now
      })
      .where(and(eq(apiKeys.id, params.apiKeyId), isNull(apiKeys.deletedAt)))
      .returning({ id: apiKeys.id, isActive: apiKeys.isActive, revokedAt: apiKeys.revokedAt })

    if (!updated[0]) throw new Error('Failed to revoke API key')

    await db.insert(auditLog).values({
      actorId: params.revokedById,
      action: 'api_key.revoked',
      entityType: 'api_key',
      entityId: params.apiKeyId,
      success: true,
      message: `Revoked API key #${params.apiKeyId}`,
      payload: { ip: params.ip, userAgent: params.userAgent },
      ip: params.ip,
      userAgent: params.userAgent,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    })

    return {
      api_key: {
        id: updated[0].id,
        is_active: updated[0].isActive,
        revoked_at: updated[0].revokedAt ? updated[0].revokedAt.toISOString() : null
      }
    }
  }

  public static async getCrawlerIntegrations(params: { enabledDays: number }): Promise<CrawlerIntegrationsResponse> {
    const db = getDb()
    const now = new Date()
    const since = new Date(now.getTime() - params.enabledDays * 24 * 60 * 60 * 1000)

    const runs = await db
      .select({
        id: crawlerRuns.id,
        source: crawlerRuns.source,
        status: crawlerRuns.status,
        startedAt: crawlerRuns.startedAt,
        completedAt: crawlerRuns.completedAt,
        productsFound: crawlerRuns.productsFound,
        productsSaved: crawlerRuns.productsSaved,
        errorsCount: crawlerRuns.errorsCount
      })
      .from(crawlerRuns)
      .orderBy(desc(crawlerRuns.id))
      .limit(200)

    const bySource = new Map<string, { last: typeof runs[number] }>()
    for (const r of runs) {
      if (!bySource.has(r.source)) bySource.set(r.source, { last: r })
    }

    const items: CrawlerIntegrationItem[] = []
    for (const [, v] of bySource.entries()) {
      const lastRunAt = v.last.completedAt ?? v.last.startedAt ?? null
      items.push({
        source: v.last.source,
        status: v.last.status,
        last_run_at: lastRunAt ? lastRunAt.toISOString() : null,
        products_found: v.last.productsFound,
        products_saved: v.last.productsSaved,
        errors_count: v.last.errorsCount,
        enabled: lastRunAt ? lastRunAt.getTime() >= since.getTime() : false
      })
    }

    items.sort((a, b) => (a.source < b.source ? -1 : a.source > b.source ? 1 : 0))
    return { items }
  }
}

