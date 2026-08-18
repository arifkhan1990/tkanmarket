import { NextResponse } from 'next/server'

import { getDbClient } from '@/db'
import { getRedisClient } from '@/lib/redis/client'

export const dynamic = 'force-dynamic'

const CHECK_TIMEOUT_MS = 2_500

type CheckResult = {
  status: 'ok' | 'error'
  latencyMs?: number
  error?: string
}

async function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), CHECK_TIMEOUT_MS))
  ])
}

async function checkDatabase(): Promise<CheckResult> {
  const started = Date.now()
  try {
    const client = getDbClient()
    const result = await withTimeout(client`select 1 as ok`)
    if (result === null) return { status: 'error', error: 'timeout' }
    return { status: 'ok', latencyMs: Date.now() - started }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message.slice(0, 200) : 'database unreachable'
    }
  }
}

async function checkRedis(): Promise<CheckResult> {
  const started = Date.now()
  try {
    const redis = getRedisClient()
    if (!redis) return { status: 'error', error: 'redis not configured' }
    const pong = await withTimeout(redis.ping())
    if (pong !== 'PONG') return { status: 'error', error: 'timeout' }
    return { status: 'ok', latencyMs: Date.now() - started }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message.slice(0, 200) : 'redis unreachable'
    }
  }
}

/**
 * Readiness probe: verifies Postgres and Redis are reachable before reporting
 * healthy. Distinct from the liveness probe at `/api/health` (which only checks
 * the process is up) — use this for Cloud Run / LB readiness gates so the
 * instance is taken out of rotation when a dependency is down.
 */
export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()])
  const healthy = database.status === 'ok' && redis.status === 'ok'

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      checks: { database, redis }
    },
    { status: healthy ? 200 : 503 }
  )
}