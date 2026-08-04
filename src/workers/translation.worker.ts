import { Worker } from 'bullmq'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getBullConnection, installGracefulShutdown, discardIfNonRetryable } from '@/workers/worker-utils'
import { FabricTranslationService } from '@/services/translation.service'

const TranslationJobSchema = z.object({
  jobId: z.string().min(1),
  fabricId: z.number().int().positive(),
  sourceLang: z.enum(['ru', 'en']).optional()
})

export const translationWorker = new Worker(
  QUEUE_NAMES.TRANSLATION,
  async (job) => {
    await job.updateProgress(1)
    const payload = TranslationJobSchema.parse(job.data)
    await job.updateProgress(10)

    let result
    try {
      result = await FabricTranslationService.ensureBilingual(payload.fabricId)
    } catch (err) {
      await discardIfNonRetryable(job, err)
      throw err
    }
    await job.updateProgress(100)

    if (result) {
      logger.info('Translation completed', {
        fabricId: result.fabricId,
        fields: result.translatedFields,
        sourceLang: result.sourceLang
      })
    }
  },
  {
    connection: getBullConnection(),
    concurrency: 10
  }
)

translationWorker.on('completed', (job) => {
  logger.info('Translation job completed', { jobId: job.id })
})

translationWorker.on('failed', async (job, err) => {
  const message = err?.message ?? 'Unknown error'
  logger.error('Translation job failed', { jobId: job?.id ?? null, fabricId: job?.data?.fabricId ?? null, message })
})

installGracefulShutdown([translationWorker])

export default translationWorker
