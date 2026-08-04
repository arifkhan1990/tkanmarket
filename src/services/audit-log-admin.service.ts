import { and, count, desc, eq, gte, ilike, isNull, lte, lt, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog } from '@/db/schema/audit.schema'
import { users } from '@/db/schema/users.schema'
import type { AuditLogListItem, AuditLogListResponse, AuditLogStats } from '@/types/audit-log-admin.types'

export class AuditLogAdminService {
  public static async list(params: {
    page: number
    limit: number
    actorId?: number | null
    action?: string | null
    from?: string | null
    to?: string | null
    q?: string | null
  }): Promise<AuditLogListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const conditions = [isNull(auditLog.deletedAt)]

    if (params.actorId) {
      conditions.push(eq(auditLog.actorId, params.actorId))
    }
    if (params.action && params.action.trim().length > 0) {
      conditions.push(ilike(auditLog.action, `%${params.action.trim()}%`))
    }
    if (params.from) {
      const d = new Date(params.from)
      if (!Number.isNaN(d.getTime())) conditions.push(gte(auditLog.createdAt, d))
    }
    if (params.to) {
      const d = new Date(params.to)
      if (!Number.isNaN(d.getTime())) conditions.push(lte(auditLog.createdAt, d))
    }
    if (params.q && params.q.trim().length > 0) {
      const term = `%${params.q.trim()}%`
      conditions.push(
        or(ilike(auditLog.action, term), ilike(auditLog.entityType, term), ilike(auditLog.message, term))!
      )
    }

    const whereClause = and(...conditions)

    const [totalRow, rows] = await Promise.all([
      db.select({ total: count() }).from(auditLog).where(whereClause),
      db
        .select({
          id: auditLog.id,
          actorId: auditLog.actorId,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          success: auditLog.success,
          message: auditLog.message,
          ip: auditLog.ip,
          userAgent: auditLog.userAgent,
          payload: auditLog.payload,
          createdAt: auditLog.createdAt,
          actorName: users.name,
          actorEmail: users.email,
          actorAvatarUrl: users.avatarUrl
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.actorId, users.id))
        .where(whereClause)
        .orderBy(desc(auditLog.createdAt))
        .limit(params.limit)
        .offset(offset)
    ])

    const total = totalRow[0]?.total ?? 0
    const items: AuditLogListItem[] = rows.map((r) => ({
      id: r.id,
      actor_id: r.actorId,
      actor_name: r.actorName ?? null,
      actor_email: r.actorEmail ?? null,
      actor_avatar_url: r.actorAvatarUrl ?? null,
      action: r.action,
      entity_type: r.entityType,
      entity_id: r.entityId,
      success: r.success,
      message: r.message,
      ip: r.ip ?? null,
      user_agent: r.userAgent ?? null,
      payload: r.payload ?? null,
      created_at: r.createdAt.toISOString()
    }))

    return {
      items,
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.limit))
      }
    }
  }

  public static async getStats(params: { rangeDays: number }): Promise<AuditLogStats> {
    const db = getDb()
    const rangeDays = Math.max(1, Math.floor(params.rangeDays))
    const now = new Date()
    const currFrom = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000)
    const prevFrom = new Date(currFrom.getTime() - rangeDays * 24 * 60 * 60 * 1000)
    const prevToExclusive = currFrom

    const baseCurr = [isNull(auditLog.deletedAt), gte(auditLog.createdAt, currFrom), lte(auditLog.createdAt, now)]
    const basePrev = [isNull(auditLog.deletedAt), gte(auditLog.createdAt, prevFrom), lt(auditLog.createdAt, prevToExclusive)]

    const startToday = new Date(now)
    startToday.setUTCHours(0, 0, 0, 0)
    const startYesterday = new Date(startToday.getTime() - 86400000)

    const [
      currTotalRow,
      currFailedRow,
      currSuccessRow,
      currUniqueIpsRow,
      prevTotalRow,
      prevSuccessRow,
      todayRow,
      yesterdayRow,
      topEntityRow
    ] = await Promise.all([
      db.select({ total: count() }).from(auditLog).where(and(...baseCurr)),
      db.select({ total: count() }).from(auditLog).where(and(...baseCurr, eq(auditLog.success, false))),
      db.select({ total: count() }).from(auditLog).where(and(...baseCurr, eq(auditLog.success, true))),
      db.select({ total: sql<number>`COUNT(DISTINCT ${auditLog.ip})` }).from(auditLog).where(and(...baseCurr)),
      db.select({ total: count() }).from(auditLog).where(and(...basePrev)),
      db.select({ total: count() }).from(auditLog).where(and(...basePrev, eq(auditLog.success, true))),
      db
        .select({ total: count() })
        .from(auditLog)
        .where(and(isNull(auditLog.deletedAt), gte(auditLog.createdAt, startToday), lte(auditLog.createdAt, now))),
      db
        .select({ total: count() })
        .from(auditLog)
        .where(
          and(isNull(auditLog.deletedAt), gte(auditLog.createdAt, startYesterday), lt(auditLog.createdAt, startToday))
        ),
      db
        .select({ entityType: auditLog.entityType, c: count() })
        .from(auditLog)
        .where(and(...baseCurr))
        .groupBy(auditLog.entityType)
        .orderBy(desc(count()))
        .limit(1)
    ])

    const currTotal = Number(currTotalRow[0]?.total ?? 0)
    const currFailed = Number(currFailedRow[0]?.total ?? 0)
    const currSuccess = Number(currSuccessRow[0]?.total ?? 0)
    const currUniqueIps = Number(currUniqueIpsRow[0]?.total ?? 0)

    const prevTotal = Number(prevTotalRow[0]?.total ?? 0)
    const prevSuccess = Number(prevSuccessRow[0]?.total ?? 0)

    const currRate = currTotal === 0 ? 0 : (currSuccess / currTotal) * 100
    const prevRate = prevTotal === 0 ? 0 : (prevSuccess / prevTotal) * 100

    const successRateDeltaPct =
      prevRate === 0 ? (currRate === 0 ? 0 : 100) : ((currRate - prevRate) / prevRate) * 100

    const failedRate = currTotal === 0 ? 0 : currFailed / currTotal
    const health_label = currTotal === 0 ? 'No recent data' : failedRate >= 0.25 ? 'Requires Review' : failedRate >= 0.12 ? 'Watchlist' : 'Healthy'

    const todayActions = Number(todayRow[0]?.total ?? 0)
    const yesterdayActions = Number(yesterdayRow[0]?.total ?? 0)
    const today_delta_pct =
      yesterdayActions === 0 ? (todayActions === 0 ? 0 : 100) : ((todayActions - yesterdayActions) / yesterdayActions) * 100

    return {
      total_actions: currTotal,
      failed_actions: currFailed,
      successRateDeltaPct,
      health_label,
      unique_ips: currUniqueIps,
      today_actions: todayActions,
      yesterday_actions: yesterdayActions,
      today_delta_pct,
      top_entity_type: topEntityRow[0]?.entityType ?? null
    }
  }
}
