import { and, count, desc, eq, gte, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog, authSecurityEvents } from '@/db/schema/audit.schema'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { users } from '@/db/schema/users.schema'
import type { SystemHealthResponse } from '@/types/system-health-monitor.types'
import type { SystemHealthCrawlerEvent } from '@/types/system-health-monitor.types'

import type { AuditLogListItem } from '@/types/audit-log-admin.types'

import type { SystemHealthRange } from '@/types/system-health-monitor.types'

export class SystemHealthAdminService {
  private static rangeToMs(range: SystemHealthRange): number {
    if (range === '1h') return 60 * 60 * 1000
    if (range === '24h') return 24 * 60 * 60 * 1000
    return 7 * 24 * 60 * 60 * 1000
  }

  public static async getSystemHealth(params: { range: SystemHealthRange; alertLimit: number }): Promise<SystemHealthResponse<AuditLogListItem>> {
    const db = getDb()
    const now = new Date()
    const fromDate = new Date(now.getTime() - SystemHealthAdminService.rangeToMs(params.range))

    const base = [isNull(auditLog.deletedAt), gte(auditLog.createdAt, fromDate)]

    const [totalRow, failedRow, uniqueIpsRow, authFailedRow, chartRows, alerts, crawlerHistory] = await Promise.all([
      db.select({ total: count() }).from(auditLog).where(and(...base)),
      db.select({ failed: count() }).from(auditLog).where(and(...base, eq(auditLog.success, false))),
      db.select({ unique: sql<number>`COUNT(DISTINCT ${auditLog.ip})` }).from(auditLog).where(and(...base)),
      db.select({ failed: count() })
        .from(authSecurityEvents)
        .where(and(isNull(authSecurityEvents.deletedAt), gte(authSecurityEvents.createdAt, fromDate), eq(authSecurityEvents.success, false))),
      db.select({
        label:
          params.range === '1h'
            ? sql<string>`to_char(to_timestamp(floor(extract(epoch from ${auditLog.createdAt})/300)*300), 'HH24:MI')`
            : params.range === '24h'
              ? sql<string>`to_char(date_trunc('hour', ${auditLog.createdAt}), 'HH24:00')`
              : sql<string>`to_char(date_trunc('day', ${auditLog.createdAt}), 'YYYY-MM-DD')`,
        count: count()
      })
        .from(auditLog)
        .where(and(...base))
        .groupBy(
          params.range === '1h'
            ? sql`floor(extract(epoch from ${auditLog.createdAt})/300)*300`
            : params.range === '24h'
              ? sql`date_trunc('hour', ${auditLog.createdAt})`
              : sql`date_trunc('day', ${auditLog.createdAt})`
        )
        .orderBy(
          params.range === '1h'
            ? sql`floor(extract(epoch from ${auditLog.createdAt})/300)*300`
            : params.range === '24h'
              ? sql`date_trunc('hour', ${auditLog.createdAt})`
              : sql`date_trunc('day', ${auditLog.createdAt})`
        ),
      db
        .select({
          id: auditLog.id,
          actorId: auditLog.actorId,
          actorName: users.name,
          actorEmail: users.email,
          actorAvatarUrl: users.avatarUrl,
          action: auditLog.action,
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          success: auditLog.success,
          message: auditLog.message,
          ip: auditLog.ip,
          userAgent: auditLog.userAgent,
          payload: auditLog.payload,
          createdAt: auditLog.createdAt
        })
        .from(auditLog)
        .leftJoin(users, eq(auditLog.actorId, users.id))
        .where(and(...base, eq(auditLog.success, false)))
        .orderBy(desc(auditLog.createdAt))
        .limit(params.alertLimit),
      db
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
        .limit(5)
    ])

    const total = totalRow[0]?.total ?? 0
    const failed = failedRow[0]?.failed ?? 0
    const uniqueIps = uniqueIpsRow[0]?.unique ?? 0
    const authFailures = authFailedRow[0]?.failed ?? 0

    const successRatePct = total > 0 ? ((total - failed) / total) * 100 : 0
    const global_uptime_pct = Number(successRatePct.toFixed(3))

    const alertsItems: AuditLogListItem[] = alerts.map((r) => ({
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

    const chart_points = chartRows.map((r) => ({
      label: r.label,
      count: Number(r.count)
    }))

    const crawler_history: SystemHealthCrawlerEvent[] = crawlerHistory.map((r) => ({
      id: r.id,
      source: r.source,
      status: r.status,
      started_at: r.startedAt ? r.startedAt.toISOString() : null,
      completed_at: r.completedAt ? r.completedAt.toISOString() : null,
      products_found: r.productsFound,
      products_saved: r.productsSaved,
      errors_count: r.errorsCount
    }))

    const lastCrawler = crawler_history[0] ?? null

    return {
      range: params.range,
      metrics: {
        global_uptime_pct,
        security_alerts: failed,
        unique_ips: uniqueIps,
        auth_failures: authFailures,
        last_crawler_status: lastCrawler?.status ?? null,
        last_crawler_started_at: lastCrawler?.started_at ?? null
      },
      chart_points,
      alerts: alertsItems,
      crawler_history
    }
  }
}

