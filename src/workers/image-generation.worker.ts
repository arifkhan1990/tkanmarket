import { Worker } from 'bullmq'

import { QUEUE_NAMES } from '@/constants'
import { getBullRedisConnection } from '@/lib/redis/client'
import { ImageGenerationService } from '@/services/image-generation.service'
import { addImageJob } from '@/lib/queue/helpers'
import { logger } from '@/lib/logger'
import { discardIfNonRetryable } from '@/workers/worker-utils'

import type { ImageGenerationJobPayload } from '@/types/queue.types'

const connection = getBullRedisConnection()
if (!connection) {
  throw new Error('REDIS_URL is not configured')
}

const worker = new Worker<ImageGenerationJobPayload>(
  QUEUE_NAMES.IMAGE_GENERATION,
  async (job) => {
    const { fabricId, prompt, isBatch, promptType, count } = job.data

    if (isBatch) {
      logger.info('Processing batch image generation', { jobId: job.id, fabricId })
      let results
      try {
        results = await ImageGenerationService.generateBatchForFabric(fabricId)
      } catch (err) {
        await discardIfNonRetryable(job, err)
        throw err
      }
      const urls = results.map(r => r.storageUrl).filter(Boolean) as string[]
      if (urls.length > 0) {
        await addImageJob(fabricId, urls)
      }
      logger.info('Batch image generation completed', { jobId: job.id, fabricId, count: results.length })
      return
    }

    if (promptType) {
      logger.info('Processing targeted image generation', { jobId: job.id, fabricId, promptType, count })
      let results
      try {
        results = await ImageGenerationService.generateByTypeForFabric(fabricId, promptType, count ?? 1)
      } catch (err) {
        await discardIfNonRetryable(job, err)
        throw err
      }
      const urls = results.map(r => r.storageUrl).filter(Boolean) as string[]
      if (urls.length > 0) {
        await addImageJob(fabricId, urls)
      }
      logger.info('Targeted image generation completed', { jobId: job.id, fabricId, promptType, count: results.length })
      return
    }

    logger.info('Processing image generation job', { jobId: job.id, fabricId })
    let result
    try {
      result = await ImageGenerationService.generateForFabric(fabricId, prompt)
    } catch (err) {
      await discardIfNonRetryable(job, err)
      throw err
    }
    if (result.storageUrl) {
      await addImageJob(fabricId, [result.storageUrl])
    }
  },
  { connection, concurrency: 2 }
)

worker.on('completed', (job) => {
  logger.info('Image generation job completed', { jobId: job.id, fabricId: job.data.fabricId })
})

worker.on('failed', (job, err) => {
  logger.error('Image generation job failed', { jobId: job?.id, fabricId: job?.data.fabricId, message: err.message })
})

logger.info('Image generation worker registered', { queue: QUEUE_NAMES.IMAGE_GENERATION })

export default worker
