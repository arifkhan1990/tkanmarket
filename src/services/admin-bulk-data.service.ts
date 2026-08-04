import { and, count, desc, eq, gte } from 'drizzle-orm'

import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import type { BulkDataJobStatus, BulkDataOperationsResponse, BulkDataOperationSummary } from '@/types/admin-bulk-data.types'

function mapRunToSummary(run: {
  id: number
  status: string
  source: string
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: Date | null
  completedAt: Date | null
}): BulkDataOperationSummary {
  return {
    id: run.id,
    status: run.status as BulkDataJobStatus,
    source: run.source,
    productsFound: run.productsFound,
    productsSaved: run.productsSaved,
    errorsCount: run.errorsCount,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    completedAt: run.completedAt ? run.completedAt.toISOString() : null
  }
}

export class AdminBulkDataService {
  public static async get(): Promise<BulkDataOperationsResponse> {
    const db = getDb()
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [latestRows, runningCountRows, historyRows, metricsRows] = await Promise.all([
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          source: crawlerRuns.source,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved,
          errorsCount: crawlerRuns.errorsCount,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      db
        .select({ count: count() })
        .from(crawlerRuns)
        .where(eq(crawlerRuns.status, 'RUNNING')),
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          source: crawlerRuns.source,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved,
          errorsCount: crawlerRuns.errorsCount,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(10),
      db
        .select({
          totalProcessed: count()
        })
        .from(crawlerRuns)
        .where(and(gte(crawlerRuns.createdAt, last24h), eq(crawlerRuns.status, 'COMPLETED')))
    ])

    const latest = latestRows[0] ?? null
    const runningCount = runningCountRows[0]?.count ?? 0

    const completedInLast24 = metricsRows[0]?.totalProcessed ?? 0

    const totalWarnings = historyRows.reduce((acc, run) => acc + run.errorsCount, 0)
    const totalSuccessful = historyRows.reduce(
      (acc, run) => acc + (run.status === 'COMPLETED' ? run.productsSaved : 0),
      0
    )

    return {
      activeRun: latest ? mapRunToSummary(latest) : null,
      runningCount,
      recentHistory: historyRows.map(mapRunToSummary),
      metrics: {
        totalProcessed: completedInLast24,
        totalSuccessful,
        totalWarnings
      }
    }
  }
}

