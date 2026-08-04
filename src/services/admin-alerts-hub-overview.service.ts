import { and, desc, eq, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'
import { notifications } from '@/db/schema/notifications.schema'
import {
  systemAlertChannels,
  systemAlertMonitors,
  systemAlertPerformanceLogs
} from '@/db/schema/supplier-ops.schema'
import { DEFAULT_SYSTEM_ALERTS } from '@/lib/admin-system-alerts-defaults'
import type {
  AdminAlertsHubOverviewDto,
  AdminAlertsHubRecentNotification,
  AdminAlertsHubRecentTrigger
} from '@/types/admin-alerts-hub-overview.types'
import type { SystemAlertsConfig } from '@/types/system-alerts.types'

function safeInt(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

function countActiveTriggersFromJson(stored: unknown): number {
  if (!stored || typeof stored !== 'object') return 0
  const s = stored as Partial<SystemAlertsConfig>
  const t = s.triggers
  if (!t) return 0
  const flags = [
    t.crawlerErrorRate?.enabled,
    t.largeBulkOrder?.enabled,
    t.failedPayout?.enabled,
    t.databaseLatency?.enabled
  ]
  return flags.filter((f) => f === true).length
}

export class AdminAlertsHubOverviewService {
  /**
   * Returns a single, cohesive snapshot for the `/admin/alerts` overview tab.
   *
   * Performance contract:
   *  - Exactly 6 SQL statements, all dispatched concurrently via `Promise.all`.
   *  - No per-row joins, no per-row follow-up queries (no N+1).
   *  - Each query touches an indexed column (notifications.user_id_idx,
   *    system_alert_*_enabled_idx, system_alert_perf_logs_monitor_key_idx, etc.).
   *  - Aggregate counts are collapsed into one statement per table using
   *    PostgreSQL `COUNT(*) FILTER (...)` so the planner can scan once.
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - Notification rows are scoped strictly to `userId` — no cross-user reads.
   *  - Soft-deleted and archived rows are excluded everywhere.
   */
  public static async getOverview(params: { userId: number }): Promise<AdminAlertsHubOverviewDto> {
    const { userId } = params
    if (!Number.isFinite(userId) || userId <= 0) {
      throw new Error('AdminAlertsHubOverviewService.getOverview: invalid userId')
    }
    const db = getDb()

    const notifCountsPromise = db
      .select({
        unreadTotal: sql<number>`COUNT(*) FILTER (WHERE ${notifications.readAt} IS NULL)`,
        highPriorityUnread: sql<number>`COUNT(*) FILTER (WHERE ${notifications.readAt} IS NULL AND ${notifications.isHighPriority} = true)`,
        last7d: sql<number>`COUNT(*) FILTER (WHERE ${notifications.createdAt} > NOW() - INTERVAL '7 days')`
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
          isNull(notifications.archivedAt)
        )
      )

    const recentUnreadPromise = db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        isHighPriority: notifications.isHighPriority,
        createdAt: notifications.createdAt
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
          isNull(notifications.archivedAt),
          isNull(notifications.readAt)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(5)

    const monitorCountsPromise = db
      .select({
        enabled: sql<number>`COUNT(*) FILTER (WHERE ${systemAlertMonitors.enabled} = true)`,
        total: sql<number>`COUNT(*)`
      })
      .from(systemAlertMonitors)
      .where(isNull(systemAlertMonitors.deletedAt))

    const channelCountsPromise = db
      .select({
        enabled: sql<number>`COUNT(*) FILTER (WHERE ${systemAlertChannels.enabled} = true)`,
        total: sql<number>`COUNT(*)`
      })
      .from(systemAlertChannels)
      .where(isNull(systemAlertChannels.deletedAt))

    const recentTriggeredPromise = db
      .select({
        id: systemAlertPerformanceLogs.id,
        monitorKey: systemAlertPerformanceLogs.monitorKey,
        label: systemAlertPerformanceLogs.label,
        workerHint: systemAlertPerformanceLogs.workerHint,
        status: systemAlertPerformanceLogs.status,
        avgLoadMs: systemAlertPerformanceLogs.avgLoadMs,
        lastTriggeredAt: systemAlertPerformanceLogs.lastTriggeredAt
      })
      .from(systemAlertPerformanceLogs)
      .where(isNull(systemAlertPerformanceLogs.deletedAt))
      .orderBy(desc(systemAlertPerformanceLogs.lastTriggeredAt))
      .limit(5)

    const settingsRowPromise = db
      .select({ systemAlertsJson: adminSettings.systemAlertsJson })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const [
      notifCountsRows,
      recentUnreadRows,
      monitorCountsRows,
      channelCountsRows,
      recentTriggeredRows,
      settingsRows
    ] = await Promise.all([
      notifCountsPromise,
      recentUnreadPromise,
      monitorCountsPromise,
      channelCountsPromise,
      recentTriggeredPromise,
      settingsRowPromise
    ])

    const counts = notifCountsRows[0]
    const monitorAgg = monitorCountsRows[0]
    const channelAgg = channelCountsRows[0]

    const recentUnread: AdminAlertsHubRecentNotification[] = recentUnreadRows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      isHighPriority: r.isHighPriority,
      createdAt: r.createdAt.toISOString()
    }))

    const recentTriggered: AdminAlertsHubRecentTrigger[] = recentTriggeredRows.map((r) => ({
      id: r.id,
      monitorKey: r.monitorKey,
      label: r.label,
      workerHint: r.workerHint,
      status: r.status,
      avgLoadMs: r.avgLoadMs,
      lastTriggeredAt: r.lastTriggeredAt.toISOString()
    }))

    const settingsJson = settingsRows[0]?.systemAlertsJson ?? DEFAULT_SYSTEM_ALERTS
    const settingsActiveTriggerCount = countActiveTriggersFromJson(settingsJson)

    return {
      notifications: {
        unreadTotal: safeInt(counts?.unreadTotal),
        highPriorityUnread: safeInt(counts?.highPriorityUnread),
        last7dCount: safeInt(counts?.last7d),
        recentUnread
      },
      monitors: {
        dbEnabledCount: safeInt(monitorAgg?.enabled),
        dbTotalCount: safeInt(monitorAgg?.total),
        channelsEnabledCount: safeInt(channelAgg?.enabled),
        channelsTotalCount: safeInt(channelAgg?.total),
        settingsActiveTriggerCount,
        recentTriggered
      },
      generatedAt: new Date().toISOString()
    }
  }
}
