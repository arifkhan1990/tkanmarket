import { and, gte, isNull, lt } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import type {
  SystemHealthLogItem,
  SystemHealthNode,
  SystemHealthRange,
  SystemHealthResponse,
  SystemLogLevel,
  TrafficVsLatencyPoint
} from '@/types/admin-system-health.types'

function quantile95(values: number[]): number {
  const filtered = values.filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b)
  if (filtered.length === 0) return 0
  const idx = Math.floor(0.95 * (filtered.length - 1))
  return filtered[idx] ?? 0
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000)
}

function startOfHourUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0))
}

function toIsoMinuteTs(d: Date): string {
  return d.toISOString()
}

function extractNodeStatus(params: { runStatus: string; errorsCount: number }): 'ONLINE' | 'BUSY' | 'DEGRADED' {
  if (params.runStatus === 'COMPLETED' && params.errorsCount === 0) return 'ONLINE'
  if (params.runStatus === 'COMPLETED' && params.errorsCount > 0) return 'DEGRADED'
  if (params.runStatus === 'PARTIAL') return 'BUSY'
  if (params.runStatus === 'FAILED') return 'DEGRADED'
  return 'BUSY'
}

function mapLogLevel(level: string): 'INFO' | 'WARN' | 'ERROR' {
  if (level === 'ERROR') return 'ERROR'
  if (level === 'WARN') return 'WARN'
  return 'INFO'
}

function buildLogItem(run: {
  id: number
  startedAt: Date | null
  completedAt: Date | null
  status: string
  errorsCount: number
  errorLog: string | null
}): SystemHealthLogItem {
  const ts = run.completedAt ?? run.startedAt ?? new Date()
  const base = run.errorLog?.trim()
  const message = base && base.length > 0 ? base : run.status === 'FAILED' ? 'Crawler run failed' : 'Crawler run completed'

  let derived: 'INFO' | 'WARN' | 'ERROR' = 'INFO'
  if (run.status === 'FAILED') derived = 'ERROR'
  else if (run.errorsCount > 0) derived = 'WARN'

  return {
    ts: toIsoMinuteTs(ts),
    level: derived,
    message
  }
}

export class AdminSystemHealthService {
  public static async get(params: { range: SystemHealthRange; level: SystemLogLevel }): Promise<SystemHealthResponse> {
    const db = getDb()
    const now = new Date()

    const rangeHours = params.range === '1H' ? 1 : params.range === '24H' ? 24 : 7 * 24
    const from = addHours(now, -rangeHours)

    const bucketFromHour = startOfHourUtc(from)
    const bucketTo = addHours(bucketFromHour, rangeHours)

    const rows = await db.select({
        id: crawlerRuns.id,
        status: crawlerRuns.status,
        nodeName: crawlerRuns.source,
        errorsCount: crawlerRuns.errorsCount,
        startedAt: crawlerRuns.startedAt,
        completedAt: crawlerRuns.completedAt,
        errorLog: crawlerRuns.errorLog
      })
      .from(crawlerRuns)
      .where(and(gte(crawlerRuns.startedAt, bucketFromHour), lt(crawlerRuns.startedAt, bucketTo)))

    const safeRuns = rows
      .filter((r) => r.startedAt != null)
      .map((r) => ({
        ...r,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        errorLog: r.errorLog
      }))

    const completedOrPartial = safeRuns.filter((r) => r.status === 'COMPLETED' || r.status === 'PARTIAL')
    const total = safeRuns.length
    const uptimePercent = total === 0 ? 0 : clampPct((completedOrPartial.length / total) * 100)

    const durationsMs = safeRuns
      .filter((r) => r.completedAt != null && r.startedAt != null)
      .map((r) => (r.completedAt!.getTime() - r.startedAt!.getTime()))
    const apiLatencyP95Ms = Math.round(quantile95(durationsMs))

    const dbLoadCapacityPercent = clampPct((apiLatencyP95Ms / 1500) * 100)

    const buckets: TrafficVsLatencyPoint[] = []
    for (let i = 0; i < rangeHours; i++) {
      const hourStart = addHours(bucketFromHour, i)
      const hourEnd = addHours(hourStart, 1)

      const bucketRuns = safeRuns.filter((r) => r.startedAt && r.startedAt >= hourStart && r.startedAt < hourEnd)
      const traffic = bucketRuns.length
      const bucketDurations = bucketRuns
        .filter((r) => r.completedAt != null && r.startedAt != null)
        .map((r) => (r.completedAt!.getTime() - r.startedAt!.getTime()))

      const p95 = Math.round(quantile95(bucketDurations))

      buckets.push({
        time: hourStart.toISOString(),
        traffic,
        p95_latency_ms: p95
      })
    }

    const byNode = new Map<string, { nodeName: string; latest: typeof safeRuns[number]; durations: number[] }>()
    for (const r of safeRuns) {
      const name = String(r.nodeName ?? 'unknown')
      const existing = byNode.get(name)
      const duration = r.completedAt && r.startedAt ? r.completedAt.getTime() - r.startedAt.getTime() : null
      if (!existing) {
        byNode.set(name, {
          nodeName: name,
          latest: r,
          durations: duration == null ? [] : [duration]
        })
      } else {
        if (r.id > existing.latest.id) existing.latest = r
        if (duration != null) existing.durations.push(duration)
      }
    }

    const nodes: SystemHealthNode[] = Array.from(byNode.values()).map((n) => {
      const duration95 = quantile95(n.durations)
      const cpu_percent = clampPct((duration95 / 1200) * 100)
      return {
        name: n.nodeName,
        node_id: n.latest.id,
        status: extractNodeStatus({ runStatus: n.latest.status, errorsCount: n.latest.errorsCount }),
        cpu_percent
      }
    })

    const logsUnfiltered = safeRuns
      .map((r) => buildLogItem(r))
      .filter((l) => {
        if (params.level === 'ALL') return true
        if (params.level === 'ERRORS') return l.level === 'ERROR'
        return l.level === 'WARN'
      })

    const technicalLogs = logsUnfiltered
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 80)

    return {
      range: params.range,
      uptime_percent: uptimePercent,
      api_latency_p95_ms: apiLatencyP95Ms,
      db_load_capacity_percent: dbLoadCapacityPercent,
      traffic_vs_latency: buckets,
      nodes: nodes.sort((a, b) => b.cpu_percent - a.cpu_percent).slice(0, 6),
      technical_logs: technicalLogs
    }
  }
}

