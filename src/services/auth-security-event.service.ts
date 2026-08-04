import { and, count, countDistinct, desc, eq, gte, ilike, isNotNull, isNull, lte, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { authSecurityEvents } from '@/db/schema/audit.schema'
import { logger } from '@/lib/logger'
import type {
  AuthSecurityEventListItem,
  AuthSecurityEventListResponse
} from '@/types/auth-security-events.types'
import type { AuthSecuritySummary } from '@/types/auth-security-summary.types'

export type RecordAuthSecurityEventInput = {
  userId?: number | null
  email?: string | null
  eventType: string
  success: boolean
  ip?: string | null
  userAgent?: string | null
  metadata?: Record<string, unknown> | null
}

const SUMMARY_WINDOW_MS = 24 * 60 * 60 * 1000

export class AuthSecurityEventService {
  /** Aggregates for the security dashboard (rolling 24h). */
  public static async getSummary24h(): Promise<AuthSecuritySummary> {
    const db = getDb()
    const since = new Date(Date.now() - SUMMARY_WINDOW_MS)
    const base = and(isNull(authSecurityEvents.deletedAt), gte(authSecurityEvents.createdAt, since))

    const [totalRow, failRow, ipRow] = await Promise.all([
      db.select({ c: count() }).from(authSecurityEvents).where(base),
      db
        .select({ c: count() })
        .from(authSecurityEvents)
        .where(and(base, eq(authSecurityEvents.success, false))),
      db
        .select({ c: countDistinct(authSecurityEvents.ip) })
        .from(authSecurityEvents)
        .where(and(base, eq(authSecurityEvents.success, false), isNotNull(authSecurityEvents.ip)))
    ])

    const events24h = Number(totalRow[0]?.c ?? 0)
    const failed24h = Number(failRow[0]?.c ?? 0)
    const success24h = Math.max(0, events24h - failed24h)
    const distinctFailedIps = Number(ipRow[0]?.c ?? 0)

    return {
      generated_at: new Date().toISOString(),
      window_hours: 24,
      events24h,
      success24h,
      failed24h,
      distinct_failed_ips: distinctFailedIps
    }
  }

  public static async record(input: RecordAuthSecurityEventInput): Promise<void> {
    try {
      const db = getDb()
      await db.insert(authSecurityEvents).values({
        userId: input.userId ?? null,
        email: input.email ?? null,
        eventType: input.eventType,
        success: input.success,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? null,
        updatedAt: new Date(),
        deletedAt: null
      })
    } catch (err) {
      logger.error('auth_security_event.record_failed', { err })
    }
  }

  public static async list(params: {
    page: number
    limit: number
    eventType?: string | null
    from?: string | null
    to?: string | null
    q?: string | null
  }): Promise<AuthSecurityEventListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const conditions = [isNull(authSecurityEvents.deletedAt)]

    if (params.eventType && params.eventType.trim().length > 0) {
      conditions.push(eq(authSecurityEvents.eventType, params.eventType.trim()))
    }

    if (params.from) {
      const d = new Date(params.from)
      if (!Number.isNaN(d.getTime())) {
        conditions.push(gte(authSecurityEvents.createdAt, d))
      }
    }
    if (params.to) {
      const d = new Date(params.to)
      if (!Number.isNaN(d.getTime())) {
        conditions.push(lte(authSecurityEvents.createdAt, d))
      }
    }

    if (params.q && params.q.trim().length > 0) {
      const term = `%${params.q.trim()}%`
      conditions.push(
        or(
          ilike(authSecurityEvents.email, term),
          ilike(authSecurityEvents.eventType, term),
          ilike(authSecurityEvents.ip, term)
        )!
      )
    }

    const whereClause = and(...conditions)

    const [totalRow, rows] = await Promise.all([
      db.select({ total: count() }).from(authSecurityEvents).where(whereClause),
      db
        .select({
          id: authSecurityEvents.id,
          userId: authSecurityEvents.userId,
          email: authSecurityEvents.email,
          eventType: authSecurityEvents.eventType,
          success: authSecurityEvents.success,
          ip: authSecurityEvents.ip,
          userAgent: authSecurityEvents.userAgent,
          metadata: authSecurityEvents.metadata,
          createdAt: authSecurityEvents.createdAt
        })
        .from(authSecurityEvents)
        .where(whereClause)
        .orderBy(desc(authSecurityEvents.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    const total = totalRow[0]?.total ?? 0
    const items: AuthSecurityEventListItem[] = rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      email: r.email,
      event_type: r.eventType,
      success: r.success,
      ip: r.ip,
      user_agent: r.userAgent,
      metadata: r.metadata as Record<string, unknown> | null,
      created_at: r.createdAt.toISOString()
    }))

    const totalPages = Math.max(1, Math.ceil(total / params.limit))

    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages
      }
    }
  }
}
