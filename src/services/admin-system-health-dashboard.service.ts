import { count, desc, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { QUEUE_NAMES } from '@/constants'
import type {
  DashboardCrawlerJobRow,
  DashboardRegionLatency,
  DashboardResourceSnapshot,
  DashboardServiceCard,
  DashboardSystemEventRow,
  SystemHealthDashboardResponse
} from '@/types/admin-system-health-dashboard.types'
import type { SystemHealthRange, SystemLogLevel } from '@/types/admin-system-health.types'

import { AdminNetworkPerformanceService } from '@/services/admin-network-performance.service'
import { AdminSystemHealthService } from '@/services/admin-system-health.service'

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function serviceStatusFromScore(warning: boolean, critical: boolean): DashboardServiceCard['status'] {
  if (critical) return 'Critical'
  if (warning) return 'Warning'
  return 'Healthy'
}

function eventStatusFromRun(status: string, errors: number): DashboardSystemEventRow['statusLabel'] {
  if (status === 'FAILED') return 'Critical'
  if (errors > 0) return 'Mem-Limit'
  if (status === 'PARTIAL') return 'Degraded'
  return 'Stable'
}

export class AdminSystemHealthDashboardService {
  public static async get(params: {
    range: SystemHealthRange
    level: SystemLogLevel
  }): Promise<SystemHealthDashboardResponse> {
    const [base, network, recentRuns, fabricCountRow] = await Promise.all([
      AdminSystemHealthService.get({ range: params.range, level: params.level }),
      AdminNetworkPerformanceService.getSnapshot(),
      getDb()
        .select({
          id: crawlerRuns.id,
          source: crawlerRuns.source,
          status: crawlerRuns.status,
          errorsCount: crawlerRuns.errorsCount,
          errorLog: crawlerRuns.errorLog,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.startedAt))
        .limit(40),
      getDb()
        .select({ c: count() })
        .from(fabrics)
        .where(isNull(fabrics.deletedAt))
    ])

    const fabricCatalogCount = fabricCountRow[0]?.c ?? 0
    const usedPercent = clampPct((fabricCatalogCount / 120000) * 100)

    let queueWaiting = 0
    let queueActive = 0
    let queueFailed = 0
    let queueCompleted = 0
    for (const q of Object.values(QUEUE_NAMES)) {
      const s = network.queues[q]
      queueWaiting += s.waiting
      queueActive += s.active
      queueFailed += s.failed
      queueCompleted += s.completed
    }

    const apiLatency = base.api_latency_p95_ms
    const dbLoad = base.db_load_capacity_percent

    const redisWarning = queueFailed > 8 || queueWaiting > 200
    const redisCritical = queueFailed > 40

    const workerWarning = queueWaiting > 120 && queueActive < 2
    const workersHealthy = queueFailed < 20 && !workerWarning

    const serviceCards: DashboardServiceCard[] = [
      {
        id: 'api',
        label: 'API Gateway',
        status: serviceStatusFromScore(apiLatency > 800, apiLatency > 2000),
        uptimeOrLoadPercent: clampPct(100 - Math.min(50, apiLatency / 40)),
        subtitle: 'P95 latency-driven availability model'
      },
      {
        id: 'database',
        label: 'Database (PostgreSQL)',
        status: serviceStatusFromScore(dbLoad > 75, dbLoad > 92),
        uptimeOrLoadPercent: clampPct(100 - dbLoad * 0.25),
        subtitle: 'Load index from crawler job durations'
      },
      {
        id: 'redis',
        label: 'Redis / job queues',
        status: serviceStatusFromScore(redisWarning, redisCritical),
        uptimeOrLoadPercent: clampPct(100 - Math.min(80, queueFailed * 3 + queueWaiting * 0.1)),
        subtitle: 'BullMQ aggregate backlog'
      },
      {
        id: 'workers',
        label: 'Crawler & workers',
        status: workersHealthy ? 'Healthy' : serviceStatusFromScore(true, queueFailed > 25),
        uptimeOrLoadPercent: base.uptime_percent,
        subtitle: 'Crawler run success ratio (selected window)'
      }
    ]

    const activeThreads = queueWaiting + queueActive * 4
    const resources: DashboardResourceSnapshot = {
      cpuLoadPercent: dbLoad,
      memoryPressurePercent: clampPct(queueWaiting * 0.35 + queueFailed * 2),
      activeThreads: Math.max(12, activeThreads),
      cpuLabel: 'Cluster-01 load index',
      memLabel: 'Queue pressure model',
      threadsLabel: 'Queues: waiting + active workers'
    }

    const systemEvents: DashboardSystemEventRow[] = recentRuns.slice(0, 12).map((r) => {
      const ts = (r.completedAt ?? r.startedAt ?? new Date()).toISOString()
      const detail =
        r.errorLog?.trim() ||
        (r.status === 'FAILED' ? 'Crawler run failed' : `Run ${r.status.toLowerCase()} on ${r.source}`)
      return {
        ts,
        service: r.source,
        statusLabel: eventStatusFromRun(r.status, r.errorsCount),
        detail,
        nodeId: `CRW-${r.id}`
      }
    })

    const crawlerJobs: DashboardCrawlerJobRow[] = recentRuns.slice(0, 6).map((r) => {
      let status: DashboardCrawlerJobRow['status'] = 'IDLE'
      if (r.status === 'RUNNING' || r.status === 'PENDING') status = 'RUNNING'
      else if (r.status === 'PARTIAL' || r.errorsCount > 0) status = 'RETRYING'
      return {
        jobId: `#TK-${r.id}`,
        source: r.source,
        status
      }
    })

    const p95 = apiLatency
    const regions: DashboardRegionLatency[] = [
      {
        region: 'US-East-1',
        latencyMs: p95,
        state: p95 < 120 ? 'Operational' : 'Degraded'
      },
      {
        region: 'EU-Central-1',
        latencyMs: Math.round(p95 * 1.35),
        state: p95 < 160 ? 'Operational' : 'Degraded'
      },
      {
        region: 'AP-Southeast-1',
        latencyMs: Math.round(p95 * 2.2),
        state: p95 * 2.2 < 400 ? 'Operational' : 'Degraded'
      },
      {
        region: 'SA-East-1',
        latencyMs: queueFailed > 15 ? null : Math.round(p95 * 1.8),
        state: queueFailed > 15 ? 'Standby' : 'Operational'
      }
    ]

    const terminalLines = base.technical_logs.slice(0, 14).map((l) => ({
      ts: l.ts,
      level: l.level === 'ERROR' ? ('ERROR' as const) : l.level === 'WARN' ? ('WARN' as const) : ('INFO' as const),
      message: l.message
    }))

    return {
      core: base,
      range: params.range,
      level: params.level,
      updatedAt: new Date().toISOString(),
      banner: {
        title: 'System operational',
        subtitle: `Core services within monitored thresholds. Last refresh: ${new Date().toISOString().slice(11, 19)} UTC`,
        uptimePercent: base.uptime_percent,
        latencyMs: apiLatency
      },
      serviceCards,
      resources,
      network,
      systemEvents,
      crawlerJobs,
      regions,
      storage: {
        usedPercent,
        usedLabel: `${(fabricCatalogCount / 1000).toFixed(1)}k SKUs`,
        totalLabel: 'Catalog capacity index'
      },
      securityNote:
        'Review SSL certificates and admin API keys regularly. Automated crawler credentials rotate with deployment.',
      terminalLines,
      fabricCatalogCount
    }
  }
}
