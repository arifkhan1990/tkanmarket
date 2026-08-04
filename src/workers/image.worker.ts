import { Worker } from 'bullmq'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getBullConnection, installGracefulShutdown } from '@/workers/worker-utils'
import { FabricImageJobService } from '@/services/workers/fabric-image-job.service'

const ImageJobSchema = z.object({
  jobId: z.string().min(1),
  entityId: z.number().int().positive(),
  imageUrls: z.array(z.string().url()).min(1)
})

export const imageWorker = new Worker(
  QUEUE_NAMES.IMAGE,
  async (job) => {
    const payload = ImageJobSchema.parse(job.data)
    await FabricImageJobService.attachImages({ fabricId: payload.entityId, imageUrls: payload.imageUrls })
  },
  {
    connection: getBullConnection(),
    concurrency: 2
  }
)

imageWorker.on('completed', (job) => {
  logger.info('Image job completed', { jobId: job.id })
})

imageWorker.on('failed', (job, err) => {
  logger.error('Image job failed', { jobId: job?.id ?? null, message: err?.message })
})

installGracefulShutdown([imageWorker])

