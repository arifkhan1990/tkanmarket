import { getRedisClient } from '@/lib/redis/client'

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedisClient()
  if (!redis) {
    // If Redis isn't configured, don't block traffic in edge/runtime.
    return { allowed: true, remaining: limit }
  }

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSeconds)
  }

  const remaining = Math.max(0, limit - count)
  return { allowed: count <= limit, remaining }
}

