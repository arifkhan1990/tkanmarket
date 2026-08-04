import { and, count, desc, eq, gte, ilike, isNull, not, lte, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog, authSecurityEvents } from '@/db/schema/audit.schema'
import { users } from '@/db/schema/users.schema'
import type { UserActivityLogsListResponse, UserActivityLogItem, UserActivityMetrics } from '@/types/user-activity-logs.types'
import type { UserActivityActionType } from '@/types/user-activity-logs.types'

type ListParams = {
  userId: number
  page: number
  limit: number
  from: Date
  to: Date
  q?: string | null
  actionType?: UserActivityActionType | null
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function safeIso(d: Date | null | undefined): string | null {
  if (!d) return null
  const t = d.getTime()
  if (Number.isNaN(t)) return null
  return d.toISOString()
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sum = nums.reduce((a, b) => a + b, 0)
  const out = sum / nums.length
  return Number.isFinite(out) ? out : null
}

export class UserActivityLogsService {
  public static async get(params: ListParams): Promise<UserActivityLogsListResponse> {
    try {
      const db = getDb()

      const page = Math.max(1, params.page)
      const limit = clamp(Math.floor(params.limit), 1, 100)
      const offset = (page - 1) * limit
      const fetchLimit = clamp(offset + limit, 1, 2000)

      const q = params.q?.trim() ? params.q.trim() : undefined
      const qTerm = q ? `%${q}%` : undefined

      const [userRow, auditFirst, auditLast, authFirst, authLast] = await Promise.all([
        db
          .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, email: users.email })
          .from(users)
          .where(eq(users.id, params.userId))
          .limit(1),
        db
          .select({ createdAt: auditLog.createdAt })
          .from(auditLog)
          .where(
            and(
              isNull(auditLog.deletedAt),
              eq(auditLog.actorId, params.userId),
              gte(auditLog.createdAt, params.from),
              lte(auditLog.createdAt, params.to)
            )
          )
          .orderBy(auditLog.createdAt)
          .limit(1),
        db
          .select({ createdAt: auditLog.createdAt })
          .from(auditLog)
          .where(
            and(
              isNull(auditLog.deletedAt),
              eq(auditLog.actorId, params.userId),
              gte(auditLog.createdAt, params.from),
              lte(auditLog.createdAt, params.to)
            )
          )
          .orderBy(desc(auditLog.createdAt))
          .limit(1),
        db
          .select({ createdAt: authSecurityEvents.createdAt })
          .from(authSecurityEvents)
          .where(
            and(
              isNull(authSecurityEvents.deletedAt),
              eq(authSecurityEvents.userId, params.userId),
              gte(authSecurityEvents.createdAt, params.from),
              lte(authSecurityEvents.createdAt, params.to)
            )
          )
          .orderBy(authSecurityEvents.createdAt)
          .limit(1),
        db
          .select({ createdAt: authSecurityEvents.createdAt })
          .from(authSecurityEvents)
          .where(
            and(
              isNull(authSecurityEvents.deletedAt),
              eq(authSecurityEvents.userId, params.userId),
              gte(authSecurityEvents.createdAt, params.from),
              lte(authSecurityEvents.createdAt, params.to)
            )
          )
          .orderBy(desc(authSecurityEvents.createdAt))
          .limit(1)
      ])

      const user = userRow[0]
        ? {
            id: userRow[0].id,
            name: userRow[0].name ?? null,
            avatarUrl: userRow[0].avatarUrl ?? null,
            email: userRow[0].email ?? null
          }
        : null

      let auditWhere = and(
        isNull(auditLog.deletedAt),
        eq(auditLog.actorId, params.userId),
        gte(auditLog.createdAt, params.from),
        lte(auditLog.createdAt, params.to)
      )

      let authWhere = and(
        isNull(authSecurityEvents.deletedAt),
        eq(authSecurityEvents.userId, params.userId),
        gte(authSecurityEvents.createdAt, params.from),
        lte(authSecurityEvents.createdAt, params.to)
      )

      if (qTerm) {
        auditWhere = and(
          auditWhere,
          or(ilike(auditLog.action, qTerm), ilike(auditLog.entityType, qTerm), ilike(auditLog.message, qTerm))
        )
        authWhere = and(
          authWhere,
          or(ilike(authSecurityEvents.eventType, qTerm), ilike(authSecurityEvents.email, qTerm), ilike(authSecurityEvents.ip, qTerm))
        )
      }

      const actionType = params.actionType ?? null
      let actionTypeAuditWhere: ReturnType<typeof or> | null = null
      if (actionType && actionType !== 'ALL') {
        actionTypeAuditWhere =
          actionType === 'FABRIC_APPROVAL'
            ? or(
                ilike(auditLog.action, '%approve%'),
                ilike(auditLog.action, '%approved%'),
                ilike(auditLog.entityType, '%fabric%'),
                ilike(auditLog.entityType, '%fabrics%')
              )
            : actionType === 'LEAD_ASSIGNED'
              ? or(
                  ilike(auditLog.action, '%lead%'),
                  ilike(auditLog.action, '%assigned%'),
                  ilike(auditLog.entityType, '%lead%'),
                  ilike(auditLog.entityType, '%leads%')
                )
              : actionType === 'USER_PERMISSIONS'
                ? or(
                    ilike(auditLog.action, '%role%'),
                    ilike(auditLog.action, '%permission%'),
                    ilike(auditLog.entityType, '%role%'),
                    ilike(auditLog.entityType, '%permission%')
                  )
                : or(
                    ilike(auditLog.action, '%supplier%'),
                    ilike(auditLog.action, '%verify%'),
                    ilike(auditLog.action, '%verified%'),
                    ilike(auditLog.entityType, '%supplier%')
                  )

        auditWhere = and(auditWhere, actionTypeAuditWhere)
      }

      const [
        auditTotalRow,
        authTotalRow,
        auditFailedRow,
        authFailedRow,
        auditSuccessRow,
        authSuccessRow,
        auditIpsRows,
        authIpsRows
      ] = await Promise.all([
        db.select({ total: count() }).from(auditLog).where(auditWhere),
        db.select({ total: count() }).from(authSecurityEvents).where(authWhere),
        db.select({ total: count() }).from(auditLog).where(and(auditWhere, eq(auditLog.success, false))),
        db.select({ total: count() }).from(authSecurityEvents).where(and(authWhere, eq(authSecurityEvents.success, false))),
        db.select({ total: count() }).from(auditLog).where(and(auditWhere, eq(auditLog.success, true))),
        db.select({ total: count() }).from(authSecurityEvents).where(and(authWhere, eq(authSecurityEvents.success, true))),
        db
          .select({ ip: auditLog.ip })
          .from(auditLog)
          .where(and(auditWhere, not(isNull(auditLog.ip))))
          .groupBy(auditLog.ip),
        db
          .select({ ip: authSecurityEvents.ip })
          .from(authSecurityEvents)
          .where(and(authWhere, not(isNull(authSecurityEvents.ip))))
          .groupBy(authSecurityEvents.ip)
      ])

      const auditTotal = auditTotalRow[0]?.total ?? 0
      const authTotal = authTotalRow[0]?.total ?? 0
      const actions = auditTotal + authTotal

      const failedRequests = (auditFailedRow[0]?.total ?? 0) + (authFailedRow[0]?.total ?? 0)
      const successTotal = (auditSuccessRow[0]?.total ?? 0) + (authSuccessRow[0]?.total ?? 0)

      const uniqueIpsSet = new Set<string>()
      for (const r of auditIpsRows) {
        if (r.ip) uniqueIpsSet.add(r.ip)
      }
      for (const r of authIpsRows) {
        if (r.ip) uniqueIpsSet.add(r.ip)
      }

      const totalPages = Math.max(1, Math.ceil(actions / limit))

      let auditEarliestCreatedAt: Date | null = auditFirst[0]?.createdAt ?? null
      let auditLatestCreatedAt: Date | null = auditLast[0]?.createdAt ?? null
      let authEarliestCreatedAt: Date | null = authFirst[0]?.createdAt ?? null
      let authLatestCreatedAt: Date | null = authLast[0]?.createdAt ?? null

      if (qTerm || actionTypeAuditWhere != null) {
        const [auditEarliestRow, auditLatestRow, authEarliestRow, authLatestRow] = await Promise.all([
          db
            .select({ createdAt: auditLog.createdAt })
            .from(auditLog)
            .where(auditWhere)
            .orderBy(auditLog.createdAt)
            .limit(1),
          db
            .select({ createdAt: auditLog.createdAt })
            .from(auditLog)
            .where(auditWhere)
            .orderBy(desc(auditLog.createdAt))
            .limit(1),
          db
            .select({ createdAt: authSecurityEvents.createdAt })
            .from(authSecurityEvents)
            .where(authWhere)
            .orderBy(authSecurityEvents.createdAt)
            .limit(1),
          db
            .select({ createdAt: authSecurityEvents.createdAt })
            .from(authSecurityEvents)
            .where(authWhere)
            .orderBy(desc(authSecurityEvents.createdAt))
            .limit(1)
        ])

        auditEarliestCreatedAt = auditEarliestRow[0]?.createdAt ?? null
        auditLatestCreatedAt = auditLatestRow[0]?.createdAt ?? null
        authEarliestCreatedAt = authEarliestRow[0]?.createdAt ?? null
        authLatestCreatedAt = authLatestRow[0]?.createdAt ?? null
      }

      const earliestCandidates = [auditEarliestCreatedAt, authEarliestCreatedAt].filter(
        (x): x is Date => x instanceof Date
      )

      const latestCandidates = [auditLatestCreatedAt, authLatestCreatedAt].filter(
        (x): x is Date => x instanceof Date
      )

      const earliest = earliestCandidates.length ? earliestCandidates.sort((a, b) => a.getTime() - b.getTime())[0] : null
      const latest = latestCandidates.length ? latestCandidates.sort((a, b) => b.getTime() - a.getTime())[0] : null

      const sessionDurationMs =
        earliest && latest ? (latest.getTime() - earliest.getTime() >= 0 ? latest.getTime() - earliest.getTime() : null) : null

      const lastSeenAt = safeIso(latest)

      // avg_response_ms: approximate from available timestamps (capped for performance).
      const [auditTimes, authTimes] = await Promise.all([
        db
          .select({ createdAt: auditLog.createdAt })
          .from(auditLog)
          .where(auditWhere)
          .orderBy(auditLog.createdAt)
          .limit(600),
        db
          .select({ createdAt: authSecurityEvents.createdAt })
          .from(authSecurityEvents)
          .where(authWhere)
          .orderBy(authSecurityEvents.createdAt)
          .limit(600)
      ])

      const allTimes = [...auditTimes, ...authTimes]
        .map((r) => r.createdAt)
        .filter((x): x is Date => x instanceof Date)
        .sort((a, b) => a.getTime() - b.getTime())
      const intervals: number[] = []
      for (let i = 1; i < allTimes.length; i++) {
        const prev = allTimes[i - 1]
        const curr = allTimes[i]
        if (!prev || !curr) continue
        const d = curr.getTime() - prev.getTime()
        if (Number.isFinite(d) && d >= 0) intervals.push(d)
      }

      const avgResponseMs = avg(intervals)

      const productivityScore = actions === 0 ? null : (successTotal / actions) * 100

      const metrics: UserActivityMetrics = {
        session_duration_ms: sessionDurationMs,
        productivity_score: productivityScore == null ? null : Number(productivityScore.toFixed(1)),
        actions,
        unique_ips: uniqueIpsSet.size,
        avg_response_ms: avgResponseMs,
        failed_requests: failedRequests,
        last_seen_at: lastSeenAt
      }

      const [auditRows, authRows] = await Promise.all([
        db
          .select({
            id: auditLog.id,
            createdAt: auditLog.createdAt,
            action: auditLog.action,
            entityType: auditLog.entityType,
            entityId: auditLog.entityId,
            success: auditLog.success,
            message: auditLog.message,
            ip: auditLog.ip
          })
          .from(auditLog)
          .where(auditWhere)
          .orderBy(desc(auditLog.createdAt))
          .limit(fetchLimit),
        db
          .select({
            id: authSecurityEvents.id,
            createdAt: authSecurityEvents.createdAt,
            eventType: authSecurityEvents.eventType,
            success: authSecurityEvents.success,
            email: authSecurityEvents.email,
            userId: authSecurityEvents.userId,
            ip: authSecurityEvents.ip
          })
          .from(authSecurityEvents)
          .where(authWhere)
          .orderBy(desc(authSecurityEvents.createdAt))
          .limit(fetchLimit)
      ])

      const auditItems: UserActivityLogItem[] = auditRows.map((r) => ({
        id: r.id,
        source: 'AUDIT',
        created_at: r.createdAt.toISOString(),
        action_event: r.message && r.message.trim().length > 0 ? r.message : r.action,
        resource_id: r.entityId != null ? `${r.entityType} #${r.entityId}` : r.entityType,
        ip: r.ip ?? null,
        success: r.success
      }))

      const authItems: UserActivityLogItem[] = authRows.map((r) => ({
        id: r.id,
        source: 'AUTH',
        created_at: r.createdAt.toISOString(),
        action_event: `${r.eventType}${r.email ? ` for ${r.email}` : ''}`,
        resource_id: r.email ? r.email : r.userId != null ? `User #${r.userId}` : 'User',
        ip: r.ip ?? null,
        success: r.success
      }))

      const all = [...auditItems, ...authItems].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
      const items = all.slice(offset, offset + limit)

      return {
        user,
        items,
        meta: {
          page,
          limit,
          total: actions,
          totalPages
        },
        metrics
      }
    } catch (err) {
      throw err
    }
  }
}

