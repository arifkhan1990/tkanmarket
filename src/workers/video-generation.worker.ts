import { Worker } from 'bullmq'

import { QUEUE_NAMES } from '@/constants'
import { getBullRedisConnection } from '@/lib/redis/client'
import { VideoGenerationService } from '@/services/video-generation.service'
import { logger } from '@/lib/logger'
import { discardIfNonRetryable } from '@/workers/worker-utils'

import type { VideoGenerationJobPayload } from '@/types/queue.types'

const connection = getBullRedisConnection()
if (!connection) {
  throw new Error('REDIS_URL is not configured')
}

const worker = new Worker<VideoGenerationJobPayload>(
  QUEUE_NAMES.VIDEO_GENERATION,
  async (job) => {
    const { fabricId, prompt, durationSeconds, aspectRatio, socialPostId, thumbnailPrompt } = job.data
    logger.info('Processing video generation job', { jobId: job.id, fabricId, durationSeconds })

    try {
      await VideoGenerationService.generateForFabric(fabricId, {
        prompt,
        durationSeconds,
        aspectRatio,
        socialPostId,
        thumbnailPrompt
      })
    } catch (err) {
      await discardIfNonRetryable(job, err)
      throw err
    }

    logger.info('Video generation completed', { jobId: job.id, fabricId })
  },
  { connection, concurrency: 2 }
)

worker.on('completed', (job) => {
  logger.info('Video generation job completed', { jobId: job.id, fabricId: job.data.fabricId })
})

worker.on('failed', (job, err) => {
  logger.error('Video generation job failed', { jobId: job?.id, fabricId: job?.data.fabricId, message: err.message })
})

logger.info('Video generation worker registered', { queue: QUEUE_NAMES.VIDEO_GENERATION })

export default worker
