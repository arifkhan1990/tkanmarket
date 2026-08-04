import crypto from 'node:crypto'

import { and, eq, isNull, inArray } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { getRedisClient } from '@/lib/redis/client'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function urlHash(url: string): string {
  return sha256Hex(url).slice(0, 16)
}

function keyFor(url: string): string {
  return `crawler:url:${urlHash(url)}`
}

function ttlSeconds(): number {
  const v = Number(process.env.CRAWLER_DEDUPE_TTL_SECONDS)
  if (Number.isFinite(v) && v > 60) return Math.floor(v)
  return 7 * 24 * 60 * 60
}

export async function isDuplicate(sourceUrl: string): Promise<boolean> {
  const url = sourceUrl.trim()
  if (!url) return true

  const redis = getRedisClient()
  if (redis) {
    const hit = await redis.get(keyFor(url))
    if (hit) return true
  }

  const db = getDb()
  const rows = await db
    .select({ id: fabrics.id })
    .from(fabrics)
    .where(and(eq(fabrics.sourceUrl, url), isNull(fabrics.deletedAt)))
    .limit(1)

  if (rows[0]?.id) {
    if (redis) await redis.set(keyFor(url), '1', 'EX', ttlSeconds())
    return true
  }

  if (redis) await redis.set(keyFor(url), '1', 'EX', ttlSeconds())
  return false
}

export async function markAsProcessed(sourceUrl: string): Promise<void> {
  const url = sourceUrl.trim()
  if (!url) return
  const redis = getRedisClient()
  if (!redis) return
  await redis.set(keyFor(url), '1', 'EX', ttlSeconds())
}

export async function batchIsDuplicate(urls: string[]): Promise<Map<string, boolean>> {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean)
  const out = new Map<string, boolean>()
  for (const u of cleaned) out.set(u, false)
  if (cleaned.length === 0) return out

  const redis = getRedisClient()
  const keys = cleaned.map(keyFor)
  const redisHits = redis ? await redis.mget(keys) : null
  const misses: string[] = []

  cleaned.forEach((url, idx) => {
    const hit = redisHits ? redisHits[idx] : null
    if (hit) out.set(url, true)
    else misses.push(url)
  })

  if (misses.length > 0) {
    const db = getDb()
    const rows = await db
      .select({ sourceUrl: fabrics.sourceUrl })
      .from(fabrics)
      .where(and(inArray(fabrics.sourceUrl, misses), isNull(fabrics.deletedAt)))

    for (const r of rows) {
      if (r.sourceUrl) out.set(r.sourceUrl, true)
    }
  }

  if (redis) {
    const ttl = ttlSeconds()
    const pipeline = redis.pipeline()
    for (const url of cleaned) {
      if (out.get(url) === true) {
        pipeline.set(keyFor(url), '1', 'EX', ttl)
      }
    }
    await pipeline.exec()
  }

  return out
}

