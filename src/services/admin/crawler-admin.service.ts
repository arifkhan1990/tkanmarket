import { and, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, or, sql, sum } from 'drizzle-orm'

import { CRAWLER_WORKER_CONCURRENCY, QUEUE_NAMES } from '@/constants'
import { getDb } from '@/db'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { rawProducts } from '@/db/schema/raw-products.schema'
import { supplierDiscoveryRuns } from '@/db/schema/supplier-discovery.schema'
import { NotFoundError } from '@/lib/errors'
import { getCrawlerQueue } from '@/lib/queue/definitions'
import { getQueueStatsSafe } from '@/lib/queue/helpers'
import { CrawlerService } from '@/services/crawler.service'
import { SettingsService } from '@/services/admin/settings.service'

import type {
  AdminCrawlerDiagnosticsResponse,
  AdminCrawlerHistoryResponse,
  AdminCrawlerRun,
  AdminCrawlerStatusResponse
} from '@/types/admin-crawler.types'
import { CRAWLER_CATALOG_SOURCES, type CrawlerSource } from '@/types/crawler.types'

function mapRun(r: {
  id: number
  status: string
  source: string
  keywords: string[]
  productsFound: number
  productsSaved: number
  errorsCount: number
  startedAt: Date | null
  completedAt: Date | null
}): AdminCrawlerRun {
  return {
    id: r.id,
    status: r.status,
    source: r.source,
    keywords: r.keywords,
    productsFound: r.productsFound,
    productsSaved: r.productsSaved,
    errorsCount: r.errorsCount,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null
  }
}

export class CrawlerAdminService {
  public static async getStatus(): Promise<AdminCrawlerStatusResponse> {
    const db = getDb()
    const [latestRows, runningCountRows, historyRows] = await Promise.all([
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          source: crawlerRuns.source,
          keywords: crawlerRuns.keywords,
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
          keywords: crawlerRuns.keywords,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved,
          errorsCount: crawlerRuns.errorsCount,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(20)
    ])

    const latest = latestRows[0] ?? null
    const runningCount = runningCountRows[0]?.count ?? 0

    return {
      runningCount,
      latestRun: latest ? mapRun(latest) : null,
      history: historyRows.map(mapRun)
    }
  }

  public static async listHistory(params: {
    page: number
    pageSize: number
    status?: string
    source?: string
    q?: string
  }): Promise<AdminCrawlerHistoryResponse> {
    const db = getDb()
    const page = Math.max(1, params.page)
    const pageSize = Math.min(100, Math.max(1, params.pageSize))
    const offset = (page - 1) * pageSize

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const filters = []
    if (params.status) {
      const allowed = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL'] as const
      const st = params.status.toUpperCase()
      if ((allowed as readonly string[]).includes(st)) {
        filters.push(eq(crawlerRuns.status, st as (typeof allowed)[number]))
      }
    }
    if (params.source?.trim()) {
      filters.push(ilike(crawlerRuns.source, `%${params.source.trim()}%`))
    }
    if (params.q?.trim()) {
      const term = params.q.trim()
      const idNum = Number(term)
      if (!Number.isNaN(idNum) && idNum > 0) {
        filters.push(eq(crawlerRuns.id, idNum))
      } else {
        const like = `%${term.replace(/\\/g, '\\\\').replace(/%/g, '\\%')}%`
        filters.push(
          or(ilike(crawlerRuns.source, like), sql`array_to_string(${crawlerRuns.keywords}, ',') ILIKE ${like}`)!
        )
      }
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined
    const filterSql = whereClause ?? sql`true`

    const [stats24h, totalRows, pageRows, sumFound] = await Promise.all([
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(gte(crawlerRuns.createdAt, since)),
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(filterSql),
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          source: crawlerRuns.source,
          keywords: crawlerRuns.keywords,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved,
          errorsCount: crawlerRuns.errorsCount,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .where(filterSql)
        .orderBy(desc(crawlerRuns.id))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ total: sum(crawlerRuns.productsFound) })
        .from(crawlerRuns)
        .where(gte(crawlerRuns.createdAt, since))
    ])

    const jobs24h = stats24h[0]?.c ?? 0
    const productsFound24h = Number(sumFound[0]?.total ?? 0)

    const [finishedRow, okRow, runningRow] = await Promise.all([
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(
          and(
            gte(crawlerRuns.createdAt, since),
            inArray(crawlerRuns.status, ['COMPLETED', 'FAILED', 'PARTIAL'])
          )
        ),
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(and(gte(crawlerRuns.createdAt, since), eq(crawlerRuns.status, 'COMPLETED'))),
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(eq(crawlerRuns.status, 'RUNNING'))
    ])

    const finished = finishedRow[0]?.c ?? 0
    const completedOk = okRow[0]?.c ?? 0
    const successRatePercent = finished > 0 ? Math.round((completedOk / finished) * 1000) / 10 : null

    const total = totalRows[0]?.c ?? 0

    return {
      items: pageRows.map(mapRun),
      total,
      page,
      pageSize,
      stats: {
        jobs24h,
        productsFound24h,
        successRatePercent,
        activeRunners: runningRow[0]?.c ?? 0
      }
    }
  }

  public static async getDiagnostics(): Promise<AdminCrawlerDiagnosticsResponse> {
    const db = getDb()
    const { stats: queues, error: queueStatsError } = await getQueueStatsSafe()
    const crawlerQueue = queues[QUEUE_NAMES.CRAWLER]
    const settings = await SettingsService.getSettings()

    const [totalRunsRow, rawCountRow, rawScrapedRow, last24hRow, hourSavedRow, recentIssueRows] = await Promise.all([
      db.select({ c: count() }).from(crawlerRuns),
      db
        .select({ c: count() })
        .from(rawProducts)
        .where(isNull(rawProducts.deletedAt)),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(eq(fabrics.status, 'raw_scraped'), isNull(fabrics.deletedAt))),
      db
        .select({ c: count() })
        .from(crawlerRuns)
        .where(gte(crawlerRuns.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
      db
        .select({ total: sum(crawlerRuns.productsSaved) })
        .from(crawlerRuns)
        .where(gte(crawlerRuns.createdAt, new Date(Date.now() - 60 * 60 * 1000))),
      db
        .select({
          id: crawlerRuns.id,
          status: crawlerRuns.status,
          errorLog: crawlerRuns.errorLog,
          completedAt: crawlerRuns.completedAt
        })
        .from(crawlerRuns)
        .where(or(isNotNull(crawlerRuns.errorLog), inArray(crawlerRuns.status, ['FAILED', 'PARTIAL'])))
        .orderBy(desc(crawlerRuns.id))
        .limit(12)
    ])

    const productsSavedLastHour = Number(hourSavedRow[0]?.total ?? 0)
    const throughputPerSec = productsSavedLastHour / 3600

    return {
      queue: crawlerQueue,
      queueMetricsAvailable: queueStatsError === null,
      queueMetricsNote: queueStatsError,
      workerConcurrency: CRAWLER_WORKER_CONCURRENCY,
      crawlerEnabled: settings.crawlerEnabled,
      throughputPerSec: Math.round(throughputPerSec * 1000) / 1000,
      db: {
        totalRuns: totalRunsRow[0]?.c ?? 0,
        rawProductsCount: rawCountRow[0]?.c ?? 0,
        fabricsRawScrapedCount: rawScrapedRow[0]?.c ?? 0,
        runsLast24h: last24hRow[0]?.c ?? 0,
        productsSavedLastHour
      },
      sourcesSupported: [
        { id: '1688', label: '1688.com', enabled: true },
        { id: 'alibaba', label: 'Alibaba.com', enabled: true },
        { id: 'made_in_china', label: 'Made-in-China', enabled: true }
      ],
      recentIssues: recentIssueRows.map((r) => {
        const raw = r.errorLog?.trim() ?? ''
        const errorPreview =
          raw.length > 0
            ? raw.length > 400
              ? `${raw.slice(0, 400)}…`
              : raw
            : null
        return {
          id: r.id,
          status: r.status,
          errorPreview,
          completedAt: r.completedAt ? r.completedAt.toISOString() : null
        }
      })
    }
  }

  public static async trigger(params: {
    source: CrawlerSource
    keywords: string[]
    maxProducts: number
    triggeredById: number | null
  }): Promise<{ id: number }> {
    const run = await CrawlerService.createRun({
      source: params.source,
      keywords: params.keywords,
      maxProducts: params.maxProducts,
      triggeredById: params.triggeredById
    })
    return { id: run.id }
  }

  public static async retryRun(params: {
    runId: number
    triggeredById: number | null
  }): Promise<{ id: number; keywords: string[]; source: CrawlerSource; maxProducts: number }> {
    const db = getDb()
    const rows = await db
      .select({
        source: crawlerRuns.source,
        keywords: crawlerRuns.keywords
      })
      .from(crawlerRuns)
      .where(eq(crawlerRuns.id, params.runId))
      .limit(1)
    const prev = rows[0]
    if (!prev) throw new NotFoundError('Crawler run not found')

    const settings = await SettingsService.getSettings()
    const source: CrawlerSource = (CRAWLER_CATALOG_SOURCES as readonly string[]).includes(prev.source)
      ? (prev.source as CrawlerSource)
      : 'both'

    const maxProducts = settings.crawlerDefaultMaxProducts
    const { id } = await CrawlerAdminService.trigger({
      source,
      keywords: prev.keywords,
      maxProducts,
      triggeredById: params.triggeredById
    })
    return { id, keywords: prev.keywords, source, maxProducts }
  }

  /**
   * Marks stale RUNNING / PENDING rows as FAILED.
   *
   * For RUNNING jobs the staleness check uses `startedAt` — not `updatedAt`.
   * Workers call updateRun() on every product scrape which keeps `updatedAt` fresh even for very
   * slow or hung jobs, making an `updatedAt`-based check unreliable. `startedAt` is set once at
   * job start and never touched again, making it the correct staleness signal.
   *
   * After updating the DB, any corresponding BullMQ jobs are removed best-effort so the queue does
   * not re-process them.
   */
  public static async reconcileStaleRuns(params: {
    maxAgeMinutes: number
    /** When true, skip the age check and force-fail ALL RUNNING/PENDING rows. */
    force?: boolean
  }): Promise<{ reconciledCount: number; details: string[] }> {
    const db = getDb()
    const maxAge = Math.min(Math.max(params.maxAgeMinutes, 0), 10_080)
    const staleBefore = new Date(Date.now() - maxAge * 60 * 1000)

    const msgRunning =
      'Run marked FAILED: stale RUNNING state (worker crash, OOM, or lost BullMQ job). Reconciled from admin.'
    const msgPending =
      'Run marked FAILED: stale PENDING state (job not processed in time). Reconciled from admin.'

    // RUNNING: check startedAt (set once, never refreshed by worker heartbeats).
    // PENDING:  no startedAt yet — fall back to updatedAt (creation time).
    const runningWhere = params.force
      ? eq(crawlerRuns.status, 'RUNNING')
      : and(
          eq(crawlerRuns.status, 'RUNNING'),
          or(
            and(isNotNull(crawlerRuns.startedAt), lt(crawlerRuns.startedAt, staleBefore)),
            and(isNull(crawlerRuns.startedAt), lt(crawlerRuns.updatedAt, staleBefore))
          )
        )

    const pendingWhere = params.force
      ? eq(crawlerRuns.status, 'PENDING')
      : and(eq(crawlerRuns.status, 'PENDING'), lt(crawlerRuns.updatedAt, staleBefore))

    const [runningRows, pendingRows] = await Promise.all([
      db
        .update(crawlerRuns)
        .set({ status: 'FAILED', completedAt: new Date(), errorLog: msgRunning, updatedAt: new Date() })
        .where(runningWhere!)
        .returning({ id: crawlerRuns.id }),
      db
        .update(crawlerRuns)
        .set({ status: 'FAILED', completedAt: new Date(), errorLog: msgPending, updatedAt: new Date() })
        .where(pendingWhere!)
        .returning({ id: crawlerRuns.id })
    ])

    const allRows = [...runningRows, ...pendingRows]

    // Best-effort: move corresponding BullMQ jobs to FAILED so the worker does not re-pick them up.
    // Uses moveToFailed (works for orphaned/expired-lock jobs); falls back to remove().
    if (allRows.length > 0) {
      try {
        const q = getCrawlerQueue()
        await Promise.allSettled(
          allRows.map(async (r) => {
            const job = await q.getJob(`crawler_run_${r.id}`)
            if (!job) return
            try { const client = await q.client; await client.del(q.toKey(`${job.id!}:lock`)) } catch { /* ignore */ }
            try {
              await job.moveToFailed(new Error('Run reconciled as FAILED by admin.'), 'admin-reconcile', false)
            } catch {
              await job.remove()
            }
          })
        )
      } catch {
        /* queue unavailable — DB is already consistent */
      }
    }

    // Also reconcile supplier_discovery_runs table (same staleness logic, same queue).
    const discRunningWhere = params.force
      ? eq(supplierDiscoveryRuns.status, 'RUNNING')
      : and(
          eq(supplierDiscoveryRuns.status, 'RUNNING'),
          or(
            and(isNotNull(supplierDiscoveryRuns.startedAt), lt(supplierDiscoveryRuns.startedAt, staleBefore)),
            and(isNull(supplierDiscoveryRuns.startedAt), lt(supplierDiscoveryRuns.updatedAt, staleBefore))
          )
        )

    const discPendingWhere = params.force
      ? eq(supplierDiscoveryRuns.status, 'PENDING')
      : and(eq(supplierDiscoveryRuns.status, 'PENDING'), lt(supplierDiscoveryRuns.updatedAt, staleBefore))

    const [discRunningRows, discPendingRows] = await Promise.all([
      db
        .update(supplierDiscoveryRuns)
        .set({
          status: 'FAILED',
          completedAt: new Date(),
          errorLog: 'Run marked FAILED: stale RUNNING state. Reconciled from admin.',
          updatedAt: new Date()
        })
        .where(discRunningWhere!)
        .returning({ id: supplierDiscoveryRuns.id }),
      db
        .update(supplierDiscoveryRuns)
        .set({
          status: 'FAILED',
          completedAt: new Date(),
          errorLog: 'Run marked FAILED: stale PENDING state. Reconciled from admin.',
          updatedAt: new Date()
        })
        .where(discPendingWhere!)
        .returning({ id: supplierDiscoveryRuns.id })
    ])

    // Best-effort: kill BullMQ jobs for supplier discovery runs too.
    const discRows = [...discRunningRows, ...discPendingRows]
    if (discRows.length > 0) {
      try {
        const q = getCrawlerQueue()
        await Promise.allSettled(
          discRows.map(async (r) => {
            const job = await q.getJob(`supplier_discovery_run_${r.id}`)
            if (!job) return
            try { const client = await q.client; await client.del(q.toKey(`${job.id!}:lock`)) } catch { /* ignore */ }
            try {
              await job.moveToFailed(new Error('Run reconciled as FAILED by admin.'), 'admin-reconcile', false)
            } catch {
              await job.remove()
            }
          })
        )
      } catch {
        /* queue unavailable */
      }
    }

    const details: string[] = [
      ...runningRows.map((r) => `crawler #${r.id}: RUNNING → FAILED`),
      ...pendingRows.map((r) => `crawler #${r.id}: PENDING → FAILED`),
      ...discRunningRows.map((r) => `discovery #${r.id}: RUNNING → FAILED`),
      ...discPendingRows.map((r) => `discovery #${r.id}: PENDING → FAILED`)
    ]

    const reconciledCount = allRows.length + discRows.length
    return { reconciledCount, details }
  }

  /**
   * Force-cancels a single RUNNING or PENDING run: marks the DB row as FAILED and removes
   * the corresponding BullMQ job so the worker does not resume it.
   */
  public static async cancelRun(params: { runId: number }): Promise<{ ok: boolean; message: string }> {
    const db = getDb()

    const rows = await db
      .update(crawlerRuns)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: 'Run cancelled by admin.',
        updatedAt: new Date()
      })
      .where(and(eq(crawlerRuns.id, params.runId), inArray(crawlerRuns.status, ['RUNNING', 'PENDING'])))
      .returning({ id: crawlerRuns.id })

    if (rows.length === 0) {
      return { ok: false, message: 'Run not found or already in a terminal state.' }
    }

    // Best-effort BullMQ job removal.
    // Force-delete the lock key first so moveToFailed works even when a live worker holds it.
    try {
      const q = getCrawlerQueue()
      const job = await q.getJob(`crawler_run_${params.runId}`)
      if (job) {
        try {
          const client = await q.client
          await client.del(q.toKey(`${job.id!}:lock`))
        } catch { /* ignore lock deletion errors */ }
        try {
          await job.moveToFailed(new Error('Run cancelled by admin.'), 'admin-cancel', false)
        } catch {
          await job.remove()
        }
      }
    } catch {
      /* queue unavailable */
    }

    return { ok: true, message: `Run #${params.runId} cancelled.` }
  }
}
