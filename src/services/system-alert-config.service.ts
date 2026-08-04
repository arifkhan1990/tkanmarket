import { and, asc, desc, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import {
  systemAlertChannels,
  systemAlertMonitors,
  systemAlertPerformanceLogs
} from '@/db/schema/supplier-ops.schema'
import type { SystemAlertConfigBundleDto } from '@/types/supplier-ops.types'

const THRESHOLD_BOUNDS: Record<string, { min: number; max: number }> = {
  crawler_error_rate: { min: 100, max: 2000 },
  large_bulk_order: { min: 1000, max: 50000 },
  database_latency: { min: 50, max: 1000 }
}

function clampThreshold(monitorKey: string, value: number | null): number | null {
  if (value === null) return null
  const b = THRESHOLD_BOUNDS[monitorKey]
  if (!b) return null
  return Math.min(b.max, Math.max(b.min, Math.round(value)))
}

export class SystemAlertConfigService {
  public static async getBundle(): Promise<SystemAlertConfigBundleDto> {
    const db = getDb()

    const monitors = await db
      .select()
      .from(systemAlertMonitors)
      .where(isNull(systemAlertMonitors.deletedAt))
      .orderBy(asc(systemAlertMonitors.sortOrder), asc(systemAlertMonitors.id))

    const channels = await db
      .select()
      .from(systemAlertChannels)
      .where(isNull(systemAlertChannels.deletedAt))
      .orderBy(asc(systemAlertChannels.id))

    const logs = await db
      .select()
      .from(systemAlertPerformanceLogs)
      .where(isNull(systemAlertPerformanceLogs.deletedAt))
      .orderBy(desc(systemAlertPerformanceLogs.lastTriggeredAt))
      .limit(25)

    return {
      monitors: monitors.map((m) => ({
        id: m.id,
        monitorKey: m.monitorKey,
        title: m.title,
        description: m.description,
        enabled: m.enabled,
        thresholdInt: m.thresholdInt,
        accent: m.accent,
        sortOrder: m.sortOrder
      })),
      channels: channels.map((c) => ({
        id: c.id,
        channelKey: c.channelKey,
        label: c.label,
        subtitle: c.subtitle,
        enabled: c.enabled
      })),
      logs: logs.map((l) => ({
        id: l.id,
        monitorKey: l.monitorKey,
        label: l.label,
        workerHint: l.workerHint,
        avgLoadMs: l.avgLoadMs,
        status: l.status,
        lastTriggeredAt: l.lastTriggeredAt.toISOString()
      }))
    }
  }

  public static async updateMonitor(
    id: number,
    input: { enabled?: boolean; thresholdInt?: number | null }
  ): Promise<SystemAlertConfigBundleDto | null> {
    const db = getDb()
    const row = await db
      .select({ id: systemAlertMonitors.id, monitorKey: systemAlertMonitors.monitorKey })
      .from(systemAlertMonitors)
      .where(and(eq(systemAlertMonitors.id, id), isNull(systemAlertMonitors.deletedAt)))
      .limit(1)
    if (!row[0]) return null

    const monitorKey = row[0].monitorKey
    const patch: {
      enabled?: boolean
      thresholdInt?: number | null
      updatedAt: Date
    } = { updatedAt: new Date() }

    if (input.enabled !== undefined) {
      patch.enabled = input.enabled
    }

    if (input.thresholdInt !== undefined) {
      if (monitorKey === 'failed_payout') {
        patch.thresholdInt = null
      } else if (THRESHOLD_BOUNDS[monitorKey]) {
        patch.thresholdInt = clampThreshold(monitorKey, input.thresholdInt)
      }
    }

    await db.update(systemAlertMonitors).set(patch).where(eq(systemAlertMonitors.id, id))

    return SystemAlertConfigService.getBundle()
  }

  public static async updateChannel(
    id: number,
    input: { enabled: boolean }
  ): Promise<SystemAlertConfigBundleDto | null> {
    const db = getDb()
    const row = await db
      .select({ id: systemAlertChannels.id })
      .from(systemAlertChannels)
      .where(and(eq(systemAlertChannels.id, id), isNull(systemAlertChannels.deletedAt)))
      .limit(1)
    if (!row[0]) return null

    await db
      .update(systemAlertChannels)
      .set({ enabled: input.enabled, updatedAt: new Date() })
      .where(eq(systemAlertChannels.id, id))

    return SystemAlertConfigService.getBundle()
  }
}
