import Redis from 'ioredis'
import { logger } from '@/lib/logger'

// ============================================================
// Redis client singleton
// Used for: BullMQ queues, rate limiting, session cache
// ============================================================

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (redis) return redis

  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL environment variable is required')

  redis = new Redis(url, {
    maxRetriesPerRequest: null, // required for BullMQ
    enableReadyCheck:     false,
    lazyConnect:          true,
  })

  redis.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message })
  })

  redis.on('connect', () => {
    logger.info('Redis connected')
  })

  return redis
}

// ============================================================
// Rate limiting helper
// ============================================================
export async function checkRateLimit(
  key:           string,
  limit:         number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const client  = getRedisClient()
  const current = await client.incr(key)

  if (current === 1) {
    await client.expire(key, windowSeconds)
  }

  const ttl       = await client.ttl(key)
  const remaining = Math.max(0, limit - current)
  const allowed   = current <= limit

  return { allowed, remaining, resetIn: ttl }
}
