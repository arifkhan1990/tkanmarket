import { desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { adminSettings } from '@/db/schema/admin-settings.schema'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { DEFAULT_SYSTEM_ALERTS } from '@/lib/admin-system-alerts-defaults'
import type {
  SystemAlertActivityRow,
  SystemAlertsConfig,
  SystemAlertsPayload,
  SystemAlertMonitorStatus
} from '@/types/system-alerts.types'

export { DEFAULT_SYSTEM_ALERTS }

function mergeConfig(stored: unknown): SystemAlertsConfig {
  const base: SystemAlertsConfig = structuredClone(DEFAULT_SYSTEM_ALERTS)
  if (!stored || typeof stored !== 'object') return base
  const s = stored as Partial<SystemAlertsConfig>
  if (s.triggers) {
    if (s.triggers.crawlerErrorRate) {
      base.triggers.crawlerErrorRate = {
        ...base.triggers.crawlerErrorRate,
        ...s.triggers.crawlerErrorRate
      }
    }
    if (s.triggers.largeBulkOrder) {
      base.triggers.largeBulkOrder = { ...base.triggers.largeBulkOrder, ...s.triggers.largeBulkOrder }
    }
    if (s.triggers.failedPayout) {
      base.triggers.failedPayout = { ...base.triggers.failedPayout, ...s.triggers.failedPayout }
    }
    if (s.triggers.databaseLatency) {
      base.triggers.databaseLatency = { ...base.triggers.databaseLatency, ...s.triggers.databaseLatency }
    }
  }
  if (s.delivery) {
    if (s.delivery.slackWebhook) {
      base.delivery.slackWebhook = { ...base.delivery.slackWebhook, ...s.delivery.slackWebhook }
    }
    if (s.delivery.adminDigestEmail) {
      base.delivery.adminDigestEmail = { ...base.delivery.adminDigestEmail, ...s.delivery.adminDigestEmail }
    }
    if (s.delivery.smsCritical) {
      base.delivery.smsCritical = { ...base.delivery.smsCritical, ...s.delivery.smsCritical }
    }
    if (s.delivery.customWebhook) {
      base.delivery.customWebhook = { ...base.delivery.customWebhook, ...s.delivery.customWebhook }
    }
  }
  return base
}

function mapRunStatus(status: string, errorsCount: number): SystemAlertMonitorStatus {
  if (status === 'FAILED') return 'failed'
  if (errorsCount > 0 || status === 'PARTIAL') return 'warning'
  return 'operational'
}

export class AdminSystemAlertsService {
  public static async getPayload(): Promise<SystemAlertsPayload> {
    const db = getDb()
    const row = await db
      .select({ systemAlertsJson: adminSettings.systemAlertsJson })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const raw = row[0]?.systemAlertsJson
    const config = mergeConfig(raw)

    const enabledTriggers = [
      config.triggers.crawlerErrorRate.enabled,
      config.triggers.largeBulkOrder.enabled,
      config.triggers.failedPayout.enabled,
      config.triggers.databaseLatency.enabled
    ].filter(Boolean).length

    const runs = await db
      .select()
      .from(crawlerRuns)
      .orderBy(desc(crawlerRuns.createdAt))
      .limit(8)

    const activity: SystemAlertActivityRow[] = runs.map((r) => {
      const rowStatus = mapRunStatus(r.status, r.errorsCount)
      const kw = (r.keywords ?? []).slice(0, 2).join(', ') || '—'
      const last = r.completedAt ?? r.startedAt ?? r.createdAt
      return {
        monitorId: `CRW-${r.id}`,
        title: `Crawler · ${r.source}`,
        subtitle: `${r.status} · ${kw}`,
        metricLabel: `${r.errorsCount} errors · ${r.productsSaved} saved`,
        status: rowStatus,
        lastTriggered: last.toISOString()
      }
    })

    return {
      config,
      activeMonitorCount: enabledTriggers,
      activity
    }
  }

  public static async updateConfig(next: SystemAlertsConfig): Promise<SystemAlertsConfig> {
    const db = getDb()
    const row = await db
      .select({ id: adminSettings.id })
      .from(adminSettings)
      .where(isNull(adminSettings.deletedAt))
      .limit(1)

    const id = row[0]?.id
    if (!id) {
      await db.insert(adminSettings).values({
        crawlerEnabled: true,
        crawlerDefaultMaxProducts: 200,
        leadRateLimitPerHour: 5,
        notificationEmail: null,
        leadOpsJson: {},
        systemAlertsJson: next,
        updatedAt: new Date()
      })
      return next
    }

    await db
      .update(adminSettings)
      .set({
        systemAlertsJson: next,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.id, id))

    return next
  }
}
