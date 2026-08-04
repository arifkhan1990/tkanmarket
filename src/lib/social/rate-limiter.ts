import { SOCIAL_DAILY_QUOTA } from '@/constants'
import { getRedisClient } from '@/lib/redis/client'
import { logger } from '@/lib/logger'

import type { SocialPlatform } from '@/types/queue.types'

type ConsumeResult =
  | { ok: true; remaining: number; resetsAt: Date }
  | { ok: false; remaining: number; resetsAt: Date; reason: 'quota_exceeded' | 'redis_unavailable' }

function dayKey(platform: SocialPlatform, accountId: string, now: Date): string {
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
  return `social:quota:${platform}:${accountId}:${yyyymmdd}`
}

function nextUtcMidnight(now: Date): Date {
  const next = new Date(now)
  next.setUTCHours(24, 0, 0, 0)
  return next
}

/**
 * Consume one publish slot for a platform account. Atomic via INCR + EXPIRE.
 * Fails closed: if Redis is unavailable, returns ok=false so callers can
 * surface an error rather than silently exceeding quotas.
 */
export async function consumePublishSlot(
  platform: SocialPlatform,
  accountId: string,
  now: Date = new Date()
): Promise<ConsumeResult> {
  const quota = SOCIAL_DAILY_QUOTA[platform]
  const resetsAt = nextUtcMidnight(now)
  const client = getRedisClient()
  if (!client) {
    logger.warn('Publish rate limiter: Redis unavailable', { platform, accountId })
    return { ok: false, remaining: 0, resetsAt, reason: 'redis_unavailable' }
  }
  const key = dayKey(platform, accountId, now)
  try {
    const count = await client.incr(key)
    if (count === 1) {
      const ttlSeconds = Math.max(60, Math.floor((resetsAt.getTime() - now.getTime()) / 1000))
      await client.expire(key, ttlSeconds)
    }
    if (count > quota) {
      return { ok: false, remaining: 0, resetsAt, reason: 'quota_exceeded' }
    }
    return { ok: true, remaining: Math.max(0, quota - count), resetsAt }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'rate limiter error'
    logger.error('Publish rate limiter failure', { platform, accountId, message })
    return { ok: false, remaining: 0, resetsAt, reason: 'redis_unavailable' }
  }
}

export async function releasePublishSlot(platform: SocialPlatform, accountId: string, now: Date = new Date()): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  try {
    await client.decr(dayKey(platform, accountId, now))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'rate limiter release error'
    logger.warn('Publish rate limiter release failed', { platform, accountId, message })
  }
}

export async function getRemainingQuota(platform: SocialPlatform, accountId: string, now: Date = new Date()): Promise<number> {
  const client = getRedisClient()
  const quota = SOCIAL_DAILY_QUOTA[platform]
  if (!client) return quota
  try {
    const raw = await client.get(dayKey(platform, accountId, now))
    const used = raw ? Number.parseInt(raw, 10) : 0
    return Math.max(0, quota - (Number.isFinite(used) ? used : 0))
  } catch {
    return quota
  }
}
