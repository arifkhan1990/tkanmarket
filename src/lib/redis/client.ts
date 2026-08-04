import IORedis from 'ioredis'

import { logger } from '@/lib/logger'

let redis: IORedis | null = null
let bullRedis: IORedis | null = null

const retryStrategy = (times: number) => Math.min(1000 * Math.max(1, times), 10_000)

const reconnectOnError = (err: Error) => {
  const message = err?.message ?? ''
  if (message.includes('READONLY')) return true
  if (message.includes('ETIMEDOUT')) return true
  return false
}

function attachRedisLogs(client: IORedis, label: string) {
  client.on('error', (err) => {
    logger.warn('Redis connection error', { label, message: err?.message })
  })

  client.on('reconnecting', (time: number) => {
    logger.info('Redis reconnecting', { label, time })
  })

  client.on('ready', () => {
    logger.info('Redis ready', { label })
  })
}

export function getRedisClient(): IORedis | null {
  if (redis) return redis
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy,
    reconnectOnError
  })

  attachRedisLogs(redis, 'app')
  return redis
}

/**
 * BullMQ workers (and blocking Redis commands) require `maxRetriesPerRequest: null`.
 * Use this for `Worker` connections only — keep `getRedisClient()` for normal API/cache usage.
 */
export function getBullRedisConnection(): IORedis | null {
  if (bullRedis) return bullRedis
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  bullRedis = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy,
    reconnectOnError
  })

  attachRedisLogs(bullRedis, 'bullmq')
  return bullRedis
}

