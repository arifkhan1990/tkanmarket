import { NotFoundError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { getQueueInstanceByName } from '@/lib/queue/get-queue-by-name'
import type { AdminQueueName } from '@/types/admin-job-queue.types'
import type { AdminBullJobDetailDto } from '@/types/admin-bull-job.types'

export class BullJobAdminService {
  public static async getDetail(queueName: string, jobId: string): Promise<AdminBullJobDetailDto> {
    try {
      const queue = getQueueInstanceByName(queueName)
      const job = await queue.getJob(jobId)
      if (!job) throw new NotFoundError('Job not found')
      const state = await job.getState()
      return {
        queueName: queueName as AdminQueueName,
        state,
        id: job.id ?? jobId,
        name: String(job.name ?? ''),
        data: job.data,
        opts: job.opts,
        progress: job.progress,
        attemptsMade: job.attemptsMade,
        attemptsStarted: job.attemptsStarted,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason && job.failedReason.length > 0 ? job.failedReason : null,
        stacktrace: Array.isArray(job.stacktrace) ? job.stacktrace : [],
        returnvalue: job.returnvalue ?? null,
        delay: job.delay,
        priority: job.priority
      }
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError) throw err
      logger.error('BullJobAdminService.getDetail failed', { err, queueName, jobId })
      throw err
    }
  }

  public static async retry(queueName: string, jobId: string): Promise<{ ok: true }> {
    try {
      const queue = getQueueInstanceByName(queueName)
      const job = await queue.getJob(jobId)
      if (!job) throw new NotFoundError('Job not found')
      const state = await job.getState()
      if (state !== 'failed') {
        throw new ValidationError('Only failed jobs can be retried')
      }
      await job.retry()
      return { ok: true }
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ValidationError) throw err
      logger.error('BullJobAdminService.retry failed', { err, queueName, jobId })
      throw err
    }
  }
}
