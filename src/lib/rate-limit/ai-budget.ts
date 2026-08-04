import { getRedisClient } from '@/lib/redis/client'
import { logger } from '@/lib/logger'

const IMAGE_DAILY_KEY = 'budget:images:daily'
const VIDEO_DAILY_KEY = 'budget:videos:daily'
const MONTHLY_SPEND_KEY = 'budget:monthly:spend'

const DAILY_MAX_IMAGES = 200
const DAILY_MAX_VIDEOS = 20
const MONTHLY_BUDGET_USD = 100

export class AIBudgetTracker {
  static async consumeImageQuota(): Promise<boolean> {
    const redis = getRedisClient()
    if (!redis) return true

    try {
      const today = dateKey()
      const count = await redis.incr(`${IMAGE_DAILY_KEY}:${today}`)
      if (count === 1) await redis.expire(`${IMAGE_DAILY_KEY}:${today}`, 86_400)
      if (count > DAILY_MAX_IMAGES) {
        logger.warn('Image daily quota exceeded', { count, limit: DAILY_MAX_IMAGES })
        return false
      }
      return true
    } catch (err) {
      logger.warn('Image quota check failed, allowing', { message: (err as Error)?.message })
      return true
    }
  }

  static async consumeVideoQuota(): Promise<boolean> {
    const redis = getRedisClient()
    if (!redis) return true

    try {
      const today = dateKey()
      const count = await redis.incr(`${VIDEO_DAILY_KEY}:${today}`)
      if (count === 1) await redis.expire(`${VIDEO_DAILY_KEY}:${today}`, 86_400)
      if (count > DAILY_MAX_VIDEOS) {
        logger.warn('Video daily quota exceeded', { count, limit: DAILY_MAX_VIDEOS })
        return false
      }

      const monthly = await AIBudgetTracker.getMonthlySpend()
      if (monthly >= MONTHLY_BUDGET_USD) {
        logger.warn('Monthly budget exceeded', { spend: monthly, limit: MONTHLY_BUDGET_USD })
        return false
      }

      return true
    } catch (err) {
      logger.warn('Video quota check failed, allowing', { message: (err as Error)?.message })
      return true
    }
  }

  static async recordSpend(costUsd: number): Promise<void> {
    const redis = getRedisClient()
    if (!redis) return

    try {
      const month = monthKey()
      await redis.incrbyfloat(`${MONTHLY_SPEND_KEY}:${month}`, costUsd)
      await redis.expire(`${MONTHLY_SPEND_KEY}:${month}`, 31 * 86_400)
    } catch (err) {
      logger.warn('Failed to record spend', { message: (err as Error)?.message })
    }
  }

  static async getDailyUsage(): Promise<{ images: number; videos: number; cost: number }> {
    const redis = getRedisClient()
    if (!redis) return { images: 0, videos: 0, cost: 0 }

    try {
      const today = dateKey()
      const [images, videos, monthlyStr] = await Promise.all([
        redis.get(`${IMAGE_DAILY_KEY}:${today}`).then((v: string | null) => Number(v) || 0),
        redis.get(`${VIDEO_DAILY_KEY}:${today}`).then((v: string | null) => Number(v) || 0),
        redis.get(`${MONTHLY_SPEND_KEY}:${monthKey()}`).then((v: string | null) => Number(v) || 0)
      ])
      return { images, videos, cost: monthlyStr }
    } catch {
      return { images: 0, videos: 0, cost: 0 }
    }
  }

  static async getMonthlySpend(): Promise<number> {
    const redis = getRedisClient()
    if (!redis) return 0

    try {
      const val = await redis.get(`${MONTHLY_SPEND_KEY}:${monthKey()}`)
      return Number(val) || 0
    } catch {
      return 0
    }
  }
}

function dateKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function monthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
