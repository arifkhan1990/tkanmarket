import { Worker } from 'bullmq'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getBullConnection, installGracefulShutdown, discardIfNonRetryable, isNonRetryableError } from '@/workers/worker-utils'
import { AIService } from '@/services/ai.service'
import { addImageGenerationJob } from '@/lib/queue/helpers'
import { SocialService } from '@/services/social.service'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'

const AIJobSchema = z.object({
  jobId: z.string().min(1),
  entityId: z.number().int().positive(),
  entityType: z.literal('fabric'),
  priority: z.number().int().optional()
})

export const aiWorker = new Worker(
  QUEUE_NAMES.AI,
  async (job) => {
    await job.updateProgress(1)
    const payload = AIJobSchema.parse(job.data)
    await job.updateProgress(10)

    // Atomic claim: only one AI job may process a fabric at a time. If another
    // job already claimed it (status 'ai_processing'), skip to avoid duplicate
    // enrichment/translation/image/social generation cost. 'ai_processed' and
    // 'rejected' fabrics are still claimable (explicit re-processing is allowed).
    const db = getDb()
    const statusRows = await db
      .select({ status: fabrics.status })
      .from(fabrics)
      .where(eq(fabrics.id, payload.entityId))
      .limit(1)
    const prevStatus = statusRows[0]?.status ?? 'raw_scraped'

    const claimed = await db
      .update(fabrics)
      .set({ status: 'ai_processing', updatedAt: sql`now()` })
      .where(and(eq(fabrics.id, payload.entityId), isNull(fabrics.deletedAt), ne(fabrics.status, 'ai_processing')))
      .returning({ id: fabrics.id })

    if (claimed.length === 0) {
      logger.info('AI job skipped — fabric already being processed', { fabricId: payload.entityId, jobId: job.id })
      await job.updateProgress(100)
      return
    }

    try {
      await AIService.processFabric(payload.entityId)
      await job.updateProgress(85)
    } catch (err) {
      // Release the claim on retryable failures (restoring the prior status) so
      // this same job can re-claim and re-process on its BullMQ retry. Non-retryable
      // failures are left for the 'failed' handler, which resets the fabric.
      if (!isNonRetryableError(err)) {
        await db
          .update(fabrics)
          .set({ status: prevStatus, updatedAt: sql`now()` })
          .where(and(eq(fabrics.id, payload.entityId), isNull(fabrics.deletedAt)))
          .catch(() => {})
      }
      await discardIfNonRetryable(job, err)
      throw err
    }

    // Enqueue batch image generation via Prompt Rules (5 images per fabric)
    await addImageGenerationJob(payload.entityId, '', { isBatch: true })

    await SocialService.createContentJob(payload.entityId)

    await job.updateProgress(100)
  },
  {
    connection: getBullConnection(),
    concurrency: 5
  }
)

aiWorker.on('completed', (job) => {
  logger.info('AI job completed', { jobId: job.id })
})

aiWorker.on('failed', async (job, err) => {
  const message = err?.message ?? 'Unknown error'
  logger.error('AI job failed', { jobId: job?.id ?? null, message })

  const entityId = typeof job?.data?.entityId === 'number' ? job.data.entityId : null
  if (!entityId) return

  try {
    const db = getDb()
    await db.transaction(async (tx) => {
      await tx
        .update(fabrics)
        .set({
          status: 'raw_scraped',
          updatedAt: sql`now()`
        })
        .where(and(eq(fabrics.id, entityId), isNull(fabrics.deletedAt)))

      await tx.insert(fabricActivityLog).values({
        fabricId: entityId,
        actorId: null,
        eventType: 'AI_PROCESSING_FAILED',
        message: 'AI processing failed',
        payload: { error: message, jobId: job?.id ?? null },
        updatedAt: new Date()
      })
    })
  } catch (e) {
    logger.error('Failed to persist AI failure', { fabricId: entityId, message: (e as Error | undefined)?.message })
  }
})

installGracefulShutdown([aiWorker])

