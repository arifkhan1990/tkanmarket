import type { NextRequest } from 'next/server'

import { AppError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { getRedisClient } from '@/lib/redis/client'

type RateLimitOptions = {
  limit: number
  windowSeconds: number
  routeKey: string
}

type MemoryState = {
  count: number
  resetAtMs: number
}

const memory = new Map<string, MemoryState>()

// On serverless, the in-memory fallback is per-instance — it does NOT enforce per-IP
// limits across the fleet. Warn once per instance when we have to fall back so the
// degradation is observable in prod (pairs with a Redis-health alert).
let redisFallbackWarned = false

/**
 * Best-effort client IP for per-IP buckets.
 *
 * Trusted-proxy headers win: Cloudflare's `cf-connecting-ip` (set only when
 * behind Cloudflare) and `x-real-ip` (set by nginx/GCP LB) are proxy-verified.
 * For `x-forwarded-for` we take the LAST entry — the IP appended by the trusted
 * platform proxy (Cloud Run / App Engine / GCP LB) closest to the app. Clients
 * can spoof the leading entries of XFF, so trusting the first one lets an
 * attacker rotate per-IP buckets and bypass limits. Without any header (typical
 * local `next dev`) all traffic shares one `anonymous` key — combine with the
 * dev bypass or sensible limits.
 */
function getIdentifier(req: NextRequest) {
  const cf = req.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf

  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const entries = xff.split(',').map((v) => v.trim()).filter(Boolean)
    const last = entries[entries.length - 1]
    if (last) return last
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'anonymous'
}

async function rateLimitWithRedis(identifier: string, options: RateLimitOptions) {
  const client = getRedisClient()
  if (!client) return null

  const key = `rl:${options.routeKey}:${identifier}`
  try {
    const count = await client.incr(key)
    if (count === 1) {
      await client.expire(key, options.windowSeconds)
    }
    return count
  } catch (err) {
    // Redis reachable-at-startup but the command failed (network, AUTH, OOM…).
    // Return null so we degrade to memory rather than crashing the request.
    if (!redisFallbackWarned) {
      redisFallbackWarned = true
      logger.warn('Rate limit degraded to in-memory fallback (Redis command failed)', {
        routeKey: options.routeKey,
        error: err instanceof Error ? err.message : 'unknown'
      })
    }
    return null
  }
}

export async function enforceRateLimit(req: NextRequest, options: RateLimitOptions) {
  // Local dev rarely sends forwarded IP headers → one shared bucket hits limits fast.
  // Set RATE_LIMIT_FORCE=1 to test limits locally.
  if (process.env.NODE_ENV === 'development' && process.env.RATE_LIMIT_FORCE !== '1') {
    return
  }

  const identifier = getIdentifier(req)

  const redisCount = await rateLimitWithRedis(identifier, options)
  if (typeof redisCount === 'number') {
    if (redisCount > options.limit) {
      throw new AppError('Too many requests. Please try again later.', 'RATE_LIMITED', 429)
    }
    return
  }

  if (!redisFallbackWarned && getRedisClient() === null) {
    redisFallbackWarned = true
    logger.warn('Rate limit using in-memory fallback (no Redis client configured)', {
      routeKey: options.routeKey
    })
  }

  const now = Date.now()
  const key = `rl:${options.routeKey}:${identifier}`
  const current = memory.get(key)

  if (!current || now > current.resetAtMs) {
    memory.set(key, { count: 1, resetAtMs: now + options.windowSeconds * 1000 })
    return
  }

  const nextCount = current.count + 1
  current.count = nextCount

  if (nextCount > options.limit) {
    throw new AppError('Too many requests. Please try again later.', 'RATE_LIMITED', 429)
  }
}

