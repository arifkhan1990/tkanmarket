import { QUEUE_NAMES } from '@/constants'
import { logger } from '@/lib/logger'
import { getQueueInstanceByName } from '@/lib/queue/get-queue-by-name'
import type { AdminQueuePauseStatusMap } from '@/types/admin-job-queue.types'

const QUEUE_LIST = [
  QUEUE_NAMES.CRAWLER,
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.SOCIAL
] as const

export class QueuePauseAdminService {
  public static async getPauseStates(): Promise<AdminQueuePauseStatusMap> {
    try {
      const entries = await Promise.all(
        QUEUE_LIST.map(async (name) => {
          const q = getQueueInstanceByName(name)
          const isPaused = await q.isPaused()
          return [name, { isPaused }] as const
        })
      )
      return Object.fromEntries(entries) as AdminQueuePauseStatusMap
    } catch (err) {
      logger.error('QueuePauseAdminService.getPauseStates failed', { err })
      throw err
    }
  }

  public static async setPaused(queueName: string, paused: boolean): Promise<{ isPaused: boolean }> {
    try {
      const q = getQueueInstanceByName(queueName)
      if (paused) {
        await q.pause()
      } else {
        await q.resume()
      }
      const isPaused = await q.isPaused()
      return { isPaused }
    } catch (err) {
      logger.error('QueuePauseAdminService.setPaused failed', { err, queueName, paused })
      throw err
    }
  }
}
