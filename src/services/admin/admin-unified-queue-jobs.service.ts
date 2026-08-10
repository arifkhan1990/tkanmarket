import type { Job } from 'bullmq'

import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { inArray } from 'drizzle-orm'
import { getAIQueue, getCrawlerQueue, getImageGenerationQueue, getImageQueue, getSocialQueue, getTranslationQueue, getVideoGenerationQueue } from '@/lib/queue/definitions'
import type { AdminUnifiedQueueJobItem, AdminUnifiedQueueJobsResponse } from '@/types/admin-job-queue.types'

const JOB_STATES = ['waiting', 'active', 'delayed', 'completed', 'failed'] as const
const PER_STATE_LIMIT = 16

const QUEUE_CONFIG = [
  { name: QUEUE_NAMES.CRAWLER, queue: getCrawlerQueue, kind: 'crawler' as const },
  { name: QUEUE_NAMES.AI, queue: getAIQueue, kind: 'ai' as const },
  { name: QUEUE_NAMES.TRANSLATION, queue: getTranslationQueue, kind: 'ai' as const },
  { name: QUEUE_NAMES.IMAGE, queue: getImageQueue, kind: 'image' as const },
  { name: QUEUE_NAMES.IMAGE_GENERATION, queue: getImageGenerationQueue, kind: 'image' as const },
  { name: QUEUE_NAMES.VIDEO_GENERATION, queue: getVideoGenerationQueue, kind: 'image' as const },
  { name: QUEUE_NAMES.SOCIAL, queue: getSocialQueue, kind: 'social' as const }
] as const

function toIso(ms: number | undefined): string | null {
  if (ms === undefined || ms === 0) return null
  return new Date(ms).toISOString()
}

function runtimeMs(job: Job): number | null {
  if (!job.processedOn) return null
  const end = job.finishedOn && job.finishedOn > 0 ? job.finishedOn : Date.now()
  return Math.max(0, end - job.processedOn)
}

function parseCrawlerRunId(job: Job): number | null {
  const rawId = job.id ?? ''
  const fromId = /^crawler_run_(\d+)$/.exec(rawId)
  if (fromId) return Number(fromId[1])
  const data = job.data as { jobId?: string } | undefined
  if (data?.jobId && typeof data.jobId === 'string') {
    const fromPayload = /^crawler_run_(\d+)$/.exec(data.jobId)
    if (fromPayload) return Number(fromPayload[1])
  }
  return null
}

function parseFabricId(job: Job): number | null {
  const data = job.data as { entityId?: unknown; fabricId?: unknown } | undefined
  const raw = data?.entityId ?? data?.fabricId
  if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) {
    return raw
  }
  return null
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

function mapJob(job: Job, queueName: (typeof QUEUE_CONFIG)[number]['name'], kind: (typeof QUEUE_CONFIG)[number]['kind'], state: string): AdminUnifiedQueueJobItem {
  const failedRaw = job.failedReason && job.failedReason.length > 0 ? job.failedReason : null
  return {
    id: job.id ?? 'unknown',
    queueName,
    jobKind: kind,
    jobName: String(job.name ?? ''),
    state,
    createdAt: toIso(job.timestamp),
    processedAt: toIso(job.processedOn),
    finishedAt: toIso(job.finishedOn),
    runtimeMs: runtimeMs(job),
    failedReason: failedRaw ? truncate(failedRaw, 400) : null,
    crawlerRunId: kind === 'crawler' ? parseCrawlerRunId(job) : null,
    fabricId: kind !== 'crawler' ? parseFabricId(job) : null,
    fabricTitle: null
  }
}

async function attachFabricTitles(items: AdminUnifiedQueueJobItem[]): Promise<void> {
  const fabricIds = Array.from(
    new Set(items.map((row) => row.fabricId).filter((id): id is number => id !== null && id > 0))
  )
  if (fabricIds.length === 0) return

  try {
    const db = getDb()
    const rows = await db
      .select({ id: fabrics.id, titleRu: fabrics.titleRu, titleEn: fabrics.titleEn })
      .from(fabrics)
      .where(inArray(fabrics.id, fabricIds))
    const byId = new Map(rows.map((r) => [r.id, r.titleEn ?? r.titleRu]))
    for (const item of items) {
      if (item.fabricId) item.fabricTitle = byId.get(item.fabricId) ?? null
    }
  } catch (err) {
    logger.error('AdminUnifiedQueueJobsService.attachFabricTitles failed', { err })
  }
}

export class AdminUnifiedQueueJobsService {
  public static async listRecent(params: {
    page: number
    pageSize: number
    q?: string
    queueName?: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
  }): Promise<AdminUnifiedQueueJobsResponse> {
    const page = Math.max(1, params.page)
    const pageSize = Math.min(50, Math.max(1, params.pageSize))
    const q = params.q?.trim().toLowerCase() ?? ''

    const merged: AdminUnifiedQueueJobItem[] = []

    try {
      for (const cfg of QUEUE_CONFIG) {
        if (params.queueName && params.queueName !== cfg.name) continue
        const queue = cfg.queue()
        for (const state of JOB_STATES) {
          const batch = await queue.getJobs([state], 0, PER_STATE_LIMIT - 1, false)
          for (const job of batch) {
            merged.push(mapJob(job, cfg.name, cfg.kind, state))
          }
        }
      }
    } catch (err) {
      logger.error('AdminUnifiedQueueJobsService.listRecent failed', { err })
      throw err
    }

    await attachFabricTitles(merged)

    const sortKey = (row: AdminUnifiedQueueJobItem) => {
      const fin = row.finishedAt ? new Date(row.finishedAt).getTime() : 0
      const proc = row.processedAt ? new Date(row.processedAt).getTime() : 0
      const cre = row.createdAt ? new Date(row.createdAt).getTime() : 0
      return Math.max(fin, proc, cre)
    }

    merged.sort((a, b) => sortKey(b) - sortKey(a))

    let filtered = merged
    if (q.length > 0) {
      filtered = merged.filter(
        (row) =>
          row.id.toLowerCase().includes(q) ||
          row.jobName.toLowerCase().includes(q) ||
          row.queueName.toLowerCase().includes(q)
      )
    }

    const total = filtered.length
    const offset = (page - 1) * pageSize
    const items = filtered.slice(offset, offset + pageSize)

    return {
      items,
      total,
      page,
      pageSize
    }
  }
}
