import type { Worker } from 'bullmq'

import { classifyAiError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { getBullRedisConnection } from '@/lib/redis/client'

export function getBullConnection() {
  const connection = getBullRedisConnection()
  if (!connection) {
    throw new Error('REDIS_URL is not configured')
  }
  return connection
}

const NON_RETRYABLE_AI_CODES = new Set(['AI_BLOCKED', 'AI_INVALID_RESPONSE', 'AI_NOT_CONFIGURED'])

export function isNonRetryableError(err: unknown): boolean {
  return NON_RETRYABLE_AI_CODES.has(classifyAiError(err).code)
}

export async function discardIfNonRetryable(job: { discard: () => void }, err: unknown): Promise<void> {
  if (!isNonRetryableError(err)) return
  try {
    await job.discard()
  } catch {
    // job may already be finalized — never mask the original error
  }
}

let shutdownInstalled = false
let shuttingDown = false

export function installGracefulShutdown(workers: Worker[]) {
  if (shutdownInstalled) return
  shutdownInstalled = true

  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    try {
      logger.info('Worker shutting down', { signal })
      await Promise.allSettled(workers.map((w) => w.close()))
    } catch (err) {
      logger.error('Worker shutdown error', { message: (err as Error | undefined)?.message })
    } finally {
      process.exit(0)
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

