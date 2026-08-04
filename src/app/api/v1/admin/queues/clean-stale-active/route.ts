import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { getQueueInstanceByName } from '@/lib/queue/get-queue-by-name'
import { logger } from '@/lib/logger'

const BodySchema = z.object({
  queue: z
    .enum([QUEUE_NAMES.CRAWLER, QUEUE_NAMES.AI, QUEUE_NAMES.IMAGE, QUEUE_NAMES.SOCIAL])
    .optional(),
  /** Force-remove ACTIVE jobs older than this. Default: 60 minutes. */
  graceMinutes: z.coerce.number().int().min(1).max(10_080).default(60),
  /** Max jobs to inspect. Default: 200 (hard-capped at 500). */
  limit: z.coerce.number().int().min(1).max(500).default(200),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    const graceMs = body.graceMinutes * 60_000
    const now = Date.now()

    const queueNames = body.queue
      ? [body.queue]
      : [QUEUE_NAMES.CRAWLER, QUEUE_NAMES.AI, QUEUE_NAMES.IMAGE, QUEUE_NAMES.SOCIAL]

    const results = await Promise.all(
      queueNames.map(async (name) => {
        const q = getQueueInstanceByName(name)
        const activeJobs = await q.getActive(0, body.limit - 1)

        // Use job.timestamp (immutable creation time) — NOT processedOn (which gets reset to
        // "now" every time BullMQ's stall checker re-queues the job and a worker re-picks it up).
        // After a worker restart, stall checker moves orphaned jobs back to waiting, the new
        // worker picks them up immediately, so processedOn becomes recent even for 5h-old jobs.
        // job.timestamp is set once at enqueue time and never changes.
        const stale = activeJobs.filter((job) => {
          const createdAt = job.timestamp ?? 0
          return createdAt > 0 && now - createdAt > graceMs
        })

        const moveResults = await Promise.allSettled(
          stale.map(async (job) => {
            const ageMin = Math.round((now - (job.timestamp ?? 0)) / 60_000)
            const failErr = new Error(
              `Stale active job force-cleaned by admin after ${ageMin}m. Original enqueue: ${new Date(job.timestamp ?? 0).toISOString()}.`
            )

            // Step 1: Delete the BullMQ lock key so moveToFailed succeeds even for jobs
            // that are currently locked by a live worker (re-picked after stall recovery).
            // q.toKey(`${jobId}:lock`) returns the canonical Redis key for this job's lock.
            try {
              const client = await q.client
              const lockKey = q.toKey(`${job.id!}:lock`)
              await client.del(lockKey)
            } catch (lockErr) {
              logger.warn('Could not delete BullMQ lock key', {
                jobId: job.id,
                queue: name,
                message: lockErr instanceof Error ? lockErr.message : String(lockErr)
              })
            }

            // Step 2: Move job to failed state (lock is now gone so the token check passes).
            try {
              await job.moveToFailed(failErr, 'admin-cleanup', false)
            } catch (mfErr) {
              logger.warn('moveToFailed failed, falling back to job.remove()', {
                jobId: job.id,
                queue: name,
                message: mfErr instanceof Error ? mfErr.message : String(mfErr)
              })
              // Hard-remove from all Redis data structures as last resort.
              await job.remove()
            }
            return job.id
          })
        )

        const deletedCount = moveResults.filter((r) => r.status === 'fulfilled').length
        const failedCount = moveResults.filter((r) => r.status === 'rejected').length

        if (failedCount > 0) {
          logger.warn('Some stale active jobs could not be cleaned', { queue: name, failedCount })
        }

        logger.info('Clean stale active jobs', {
          queue: name,
          inspected: activeJobs.length,
          staleFound: stale.length,
          deletedCount
        })

        return { queue: name, inspected: activeJobs.length, staleFound: stale.length, deletedCount }
      })
    )

    return apiSuccess({ graceMinutes: body.graceMinutes, results })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

