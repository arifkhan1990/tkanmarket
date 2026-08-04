import { desc, eq } from 'drizzle-orm'

import { QUEUE_NAMES } from '@/constants'
import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { getQueueStats } from '@/lib/queue/helpers'
import type {
  CrawlerRunLatencyPoint,
  NetworkPerformanceResponse,
  QueueHealthSlice,
  QueueName
} from '@/types/admin-network-performance.types'

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null
  const idx = Math.floor((p / 100) * (sorted.length - 1))
  return sorted[Math.min(sorted.length - 1, Math.max(0, idx))] ?? null
}

export class AdminNetworkPerformanceService {
  public static async getSnapshot(): Promise<NetworkPerformanceResponse> {
    const db = getDb()
    const queuesRaw = await getQueueStats()

    const queues = {} as Record<QueueName, QueueHealthSlice>
    for (const name of Object.values(QUEUE_NAMES)) {
      const slice = queuesRaw[name]
      queues[name as QueueName] = slice ?? {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0
      }
    }

    const runs = await db
      .select({
        id: crawlerRuns.id,
        source: crawlerRuns.source,
        status: crawlerRuns.status,
        startedAt: crawlerRuns.startedAt,
        completedAt: crawlerRuns.completedAt
      })
      .from(crawlerRuns)
      .where(eq(crawlerRuns.status, 'COMPLETED'))
      .orderBy(desc(crawlerRuns.completedAt))
      .limit(40)

    const durationsMs: number[] = []
    const recent: CrawlerRunLatencyPoint[] = []

    for (const r of runs) {
      let durationMs: number | null = null
      if (r.startedAt && r.completedAt) {
        durationMs = r.completedAt.getTime() - r.startedAt.getTime()
        if (durationMs >= 0) durationsMs.push(durationMs)
      }
      recent.push({
        runId: r.id,
        source: r.source,
        durationMs,
        status: r.status,
        completedAt: r.completedAt?.toISOString() ?? null
      })
    }

    const sorted = [...durationsMs].sort((a, b) => a - b)
    const avgMs =
      sorted.length === 0 ? null : Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
    const p99Ms = sorted.length === 0 ? null : percentile(sorted, 99)

    return {
      queues,
      crawlerLatency: {
        avgMs,
        p99Ms: p99Ms === null ? null : Math.round(p99Ms),
        recent
      },
      updatedAt: new Date().toISOString()
    }
  }
}
