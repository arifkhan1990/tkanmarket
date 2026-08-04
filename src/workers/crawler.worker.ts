import { Worker } from 'bullmq'
import { z } from 'zod'

import { CRAWLER_WORKER_CONCURRENCY, QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getBullConnection, installGracefulShutdown } from '@/workers/worker-utils'
import { CrawlerService } from '@/services/crawler.service'
import { DiscoveryCrawlerService } from '@/services/supplier-discovery/discovery-crawler.service'
import { SettingsService } from '@/services/admin/settings.service'

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name])
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeoutMs = Math.max(250, ms)
  let t: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
      })
    ])
  } finally {
    if (t) clearTimeout(t)
  }
}

const CrawlerJobSchema = z.object({
  jobId: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  source: z.string().min(1),
  maxProducts: z.number().int().positive()
})

const SupplierDiscoveryJobSchema = z.object({
  kind: z.literal('supplier_discovery'),
  jobId: z.string().min(1),
  discoveryRunId: z.number().int().positive(),
  keywords: z.array(z.string().min(1)).min(1),
  sources: z.array(z.string().min(1)).min(1),
  maxSuppliers: z.number().int().positive(),
  maxProductsPerSupplier: z.number().int().positive()
})

export const crawlerWorker = new Worker(
  QUEUE_NAMES.CRAWLER,
  async (job) => {
    await job.updateProgress(1)
    const raw = job.data as Record<string, unknown>
    await job.updateProgress(5)

    const settings = await SettingsService.getSettings()
    if (!settings.crawlerEnabled) {
      if (raw && raw.kind === 'supplier_discovery') {
        const discoveryPayload = SupplierDiscoveryJobSchema.parse(job.data)
        await DiscoveryCrawlerService.abortRunDisabled(
          discoveryPayload.discoveryRunId,
          'Crawler is disabled in admin settings.'
        )
        return
      }
      const payloadEarly = CrawlerJobSchema.parse(job.data)
      const runMatchEarly = payloadEarly.jobId.match(/crawler_run_(\d+)/)
      const runIdEarly = runMatchEarly ? Number(runMatchEarly[1]) : null
      if (runIdEarly) {
        await CrawlerService.abortRunDisabled(runIdEarly, 'Crawler is disabled in admin settings.')
      }
      return
    }

    if (raw && raw.kind === 'supplier_discovery') {
      const discoveryPayload = SupplierDiscoveryJobSchema.parse(job.data)
      logger.info('Supplier discovery job started', {
        jobId: discoveryPayload.jobId,
        discoveryRunId: discoveryPayload.discoveryRunId,
        sourcesCount: discoveryPayload.sources.length
      })
      const timeoutMs = envInt('CRAWLER_WORKER_JOB_TIMEOUT_MS', 45 * 60 * 1000)
      try {
        await withTimeout(
          DiscoveryCrawlerService.runDiscovery(discoveryPayload.discoveryRunId),
          timeoutMs,
          'supplier_discovery'
        )
      } catch (err) {
        await DiscoveryCrawlerService.markRunFatalFailure(discoveryPayload.discoveryRunId, err)
        throw err
      }
      await job.updateProgress(100)
      return
    }

    const payload = CrawlerJobSchema.parse(job.data)
    const runIdMatch = payload.jobId.match(/crawler_run_(\d+)/)
    const runId = runIdMatch ? Number(runIdMatch[1]) : null
    if (!runId) throw new Error('Invalid crawler jobId; expected crawler_run_<runId>')

    logger.info('Crawler job started', { jobId: payload.jobId, runId, source: payload.source, keywordsCount: payload.keywords.length })
    const timeoutMs = envInt('CRAWLER_WORKER_JOB_TIMEOUT_MS', 45 * 60 * 1000)
    await withTimeout(CrawlerService.scrapeProducts(runId, payload.keywords, payload.source, payload.maxProducts), timeoutMs, 'crawler_run')
    await job.updateProgress(100)
  },
  {
    connection: getBullConnection(),
    // Crawler jobs can be Playwright-heavy; allow tuning without code changes.
    concurrency: envInt('CRAWLER_WORKER_CONCURRENCY', CRAWLER_WORKER_CONCURRENCY),
    // Prevent "could not renew lock" for long-running jobs under load/GC pauses.
    // Defaults are conservative; override via env if needed.
    lockDuration: envInt('CRAWLER_WORKER_LOCK_DURATION_MS', 10 * 60 * 1000),
    lockRenewTime: envInt('CRAWLER_WORKER_LOCK_RENEW_TIME_MS', 5 * 60 * 1000)
  }
)

crawlerWorker.on('completed', (job) => {
  logger.info('Crawler job completed', { jobId: job.id })
})

crawlerWorker.on('failed', (job, err) => {
  logger.error('Crawler job failed', { jobId: job?.id ?? null, message: err?.message })
})

// BullMQ detects a stall when the worker lock heartbeat stops (crash, OOM, SIGKILL, Playwright
// hang). Without this handler the DB row stays permanently RUNNING even though BullMQ has
// already moved the job back to waiting or failed.
crawlerWorker.on('stalled', (jobId: string) => {
  logger.warn('Crawler job stalled — marking DB run FAILED', { jobId })
  const runIdMatch = jobId.match(/crawler_run_(\d+)/)
  const runId = runIdMatch ? Number(runIdMatch[1]) : null
  if (!runId) return
  CrawlerService.markRunFatalFailure(
    runId,
    new Error('BullMQ stalled: worker heartbeat stopped (OOM, SIGKILL, or Playwright hang). BullMQ will retry the job.')
  ).catch((err: unknown) => {
    logger.error('Failed to update stalled run in DB', {
      runId,
      message: err instanceof Error ? err.message : String(err)
    })
  })
})

process.on('uncaughtException', (err) => {
  logger.error('Crawler worker uncaught exception', { message: err.message, stack: err.stack })
})

process.on('unhandledRejection', (reason) => {
  logger.error('Crawler worker unhandled rejection', {
    message: reason instanceof Error ? reason.message : String(reason)
  })
})

installGracefulShutdown([crawlerWorker])

