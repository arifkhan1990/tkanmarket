import { Worker } from 'bullmq'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getBullConnection, installGracefulShutdown } from '@/workers/worker-utils'
import { getDb } from '@/db'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { getS3Client } from '@/lib/storage/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'

const MediaCleanupJobSchema = z.object({
  jobId: z.string().min(1),
  batchSize: z.number().int().positive().optional().default(50)
})

async function deleteR2Objects(s3: ReturnType<typeof getS3Client>, bucket: string, mediaId: number, urls: Array<string | null | undefined>) {
  for (const url of urls) {
    if (!url) continue
    try {
      const key = url.replace(/^https?:\/\/[^/]+\//, '')
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        })
      )
    } catch {
      logger.warn('R2 delete failed', { url, mediaId })
    }
  }
}

export const mediaCleanupWorker = new Worker(
  QUEUE_NAMES.MEDIA_CLEANUP,
  async job => {
    const payload = MediaCleanupJobSchema.parse(job.data)
    const db = getDb()

    // Media eligible for cleanup:
    //  1. SUPERSEDED versions (replaced by a newer generation, still active rows)
    //  2. Already soft-deleted rows whose R2 objects were never freed
    //  3. Expired media (expires_at passed)
    const eligibleMedia = await db
      .select({
        id: generatedMedia.id,
        fabricId: generatedMedia.fabricId,
        url: generatedMedia.url,
        thumbnailUrl: generatedMedia.thumbnailUrl,
        status: generatedMedia.status,
        deletedAt: generatedMedia.deletedAt
      })
      .from(generatedMedia)
      .where(
        or(
          and(eq(generatedMedia.status, 'SUPERSEDED'), isNull(generatedMedia.deletedAt)),
          isNotNull(generatedMedia.deletedAt),
          and(isNotNull(generatedMedia.expiresAt), lt(generatedMedia.expiresAt, new Date()))
        )
      )
      .limit(payload.batchSize)

    if (eligibleMedia.length === 0) {
      logger.info('Media cleanup: no eligible media found')
      return { deletedCount: 0 }
    }

    let deletedCount = 0

    const s3 = getS3Client()
    const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? ''

    for (const media of eligibleMedia) {
      try {
        await deleteR2Objects(s3, bucket, media.id, [media.url, media.thumbnailUrl])

        const alreadyDeleted = media.deletedAt != null
        if (!alreadyDeleted) {
          await db
            .update(generatedMedia)
            .set({
              deletedAt: sql`now()`,
              updatedAt: sql`now()`
            })
            .where(eq(generatedMedia.id, media.id))

          await db.insert(fabricActivityLog).values({
            fabricId: media.fabricId,
            actorId: null,
            eventType: 'MEDIA_CLEANED_UP',
            message: `Media cleanup: removed ${media.status} media record ${media.id}`,
            payload: { mediaId: media.id, status: media.status, deletedAt: new Date().toISOString() },
            updatedAt: new Date()
          })
        }

        deletedCount++
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.error('Media cleanup failed for record', { mediaId: media.id, message })
      }
    }

    logger.info('Media cleanup completed', { deletedCount, batchSize: payload.batchSize })

    return { deletedCount }
  },
  {
    connection: getBullConnection(),
    concurrency: 1
  }
)

mediaCleanupWorker.on('completed', (job, result) => {
  logger.info('Media cleanup job completed', { jobId: job.id, result })
})

mediaCleanupWorker.on('failed', (job, err) => {
  logger.error('Media cleanup job failed', {
    jobId: job?.id ?? null,
    message: err.message
  })
})

installGracefulShutdown([mediaCleanupWorker])
