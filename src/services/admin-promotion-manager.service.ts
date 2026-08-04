import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { socialPosts } from '@/db/schema/social.schema'
import type {
  PromotionCampaignRow,
  PromotionDailyPoint,
  PromotionManagerResponse,
  PromotionManagerStats,
  PromotionPlatformAggregate,
  PromotionStatusAggregate
} from '@/types/admin-promotion-manager.types'

const ROW_LIMIT = 50
const DAILY_WINDOW_DAYS = 30

function addDaysUtc(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function safeNum(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? v : 0
}

export class AdminPromotionManagerService {
  /**
   * Performance contract:
   *  - Five SQL statements, all dispatched concurrently via `Promise.all`:
   *      1. current 30-day window aggregation (SUM reach, SUM clicks, COUNT live) — single statement
   *      2. previous 30-day window aggregation (SUM reach, SUM clicks) — single statement
   *      3. per-platform aggregates over the current window (GROUP BY platform)
   *      4. per-status totals (GROUP BY status, current snapshot)
   *      5. daily series (date_trunc day GROUP BY) for the last 30 days
   *      + a single bounded campaign-row query joined to fabrics (limit 50)
   *  - Aggregations use `COUNT(*) FILTER (...)` so the planner scans each window once.
   *  - The campaign row query is bounded and joins one row per supplier-fabric — no N+1.
   *  - All time-window predicates hit the `social_posts_status_scheduled_at_idx` /
   *    `social_posts_fabric_id_idx` indexes; the GROUP-BY day query benefits from the
   *    same window predicate so it never scans the whole table.
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `socialPosts.deletedAt IS NULL` and `fabrics.deletedAt IS NULL`.
   *  - No user input flows into any query — read-only aggregate response.
   */
  public static async getOverview(): Promise<PromotionManagerResponse> {
    const db = getDb()
    const now = new Date()
    const toUtc = startOfUtcDay(now)
    const toExclusive = addDaysUtc(toUtc, 1)
    const fromUtc = addDaysUtc(toUtc, -(DAILY_WINDOW_DAYS - 1))
    const prevFromUtc = addDaysUtc(fromUtc, -DAILY_WINDOW_DAYS)
    const prevToExclusiveUtc = fromUtc

    // 1) current 30-day window aggregates collapsed into ONE query
    const currentAggPromise = db
      .select({
        reach: sql<number>`COALESCE(SUM(${socialPosts.reach}), 0)`,
        clicks: sql<number>`COALESCE(SUM(${socialPosts.linkClicks}), 0)`,
        live: sql<number>`COUNT(*) FILTER (WHERE ${socialPosts.status} IN ('SCHEDULED', 'PUBLISHED', 'APPROVED'))`
      })
      .from(socialPosts)
      .where(
        and(
          isNull(socialPosts.deletedAt),
          gte(socialPosts.updatedAt, fromUtc),
          lt(socialPosts.updatedAt, toExclusive)
        )
      )

    // 2) previous 30-day window aggregates collapsed into ONE query
    const previousAggPromise = db
      .select({
        reach: sql<number>`COALESCE(SUM(${socialPosts.reach}), 0)`,
        clicks: sql<number>`COALESCE(SUM(${socialPosts.linkClicks}), 0)`
      })
      .from(socialPosts)
      .where(
        and(
          isNull(socialPosts.deletedAt),
          gte(socialPosts.updatedAt, prevFromUtc),
          lt(socialPosts.updatedAt, prevToExclusiveUtc)
        )
      )

    // 3) per-platform aggregates (current window)
    const platformAggPromise = db
      .select({
        platform: socialPosts.platform,
        posts: sql<number>`COUNT(*)::int`,
        reach: sql<number>`COALESCE(SUM(${socialPosts.reach}), 0)::int`,
        clicks: sql<number>`COALESCE(SUM(${socialPosts.linkClicks}), 0)::int`
      })
      .from(socialPosts)
      .where(
        and(
          isNull(socialPosts.deletedAt),
          gte(socialPosts.updatedAt, fromUtc),
          lt(socialPosts.updatedAt, toExclusive)
        )
      )
      .groupBy(socialPosts.platform)

    // 4) per-status snapshot (current rows, all-time, for the pipeline view)
    const statusAggPromise = db
      .select({
        status: socialPosts.status,
        count: sql<number>`COUNT(*)::int`
      })
      .from(socialPosts)
      .where(isNull(socialPosts.deletedAt))
      .groupBy(socialPosts.status)

    // 5) daily series for the last 30 days
    const dailyPromise = db
      .select({
        bucket: sql<string>`to_char(date_trunc('day', ${socialPosts.updatedAt}), 'YYYY-MM-DD')`,
        reach: sql<number>`COALESCE(SUM(${socialPosts.reach}), 0)::int`,
        clicks: sql<number>`COALESCE(SUM(${socialPosts.linkClicks}), 0)::int`
      })
      .from(socialPosts)
      .where(
        and(
          isNull(socialPosts.deletedAt),
          gte(socialPosts.updatedAt, fromUtc),
          lt(socialPosts.updatedAt, toExclusive)
        )
      )
      .groupBy(sql`date_trunc('day', ${socialPosts.updatedAt})`)
      .orderBy(sql`date_trunc('day', ${socialPosts.updatedAt})`)

    // 6) bounded campaign rows (joined once)
    const rowsPromise = db
      .select({
        id: socialPosts.id,
        fabricId: socialPosts.fabricId,
        fabricTitleEn: fabrics.titleEn,
        fabricTitleRu: fabrics.titleRu,
        platform: socialPosts.platform,
        status: socialPosts.status,
        scheduledAt: socialPosts.scheduledAt,
        publishedAt: socialPosts.publishedAt,
        reach: socialPosts.reach,
        linkClicks: socialPosts.linkClicks,
        updatedAt: socialPosts.updatedAt
      })
      .from(socialPosts)
      .innerJoin(fabrics, eq(socialPosts.fabricId, fabrics.id))
      .where(and(isNull(socialPosts.deletedAt), isNull(fabrics.deletedAt)))
      .orderBy(desc(socialPosts.updatedAt))
      .limit(ROW_LIMIT)

    const [curAgg, prevAgg, platformRows, statusRows, dailyRows, rows] = await Promise.all([
      currentAggPromise,
      previousAggPromise,
      platformAggPromise,
      statusAggPromise,
      dailyPromise,
      rowsPromise
    ])

    const cur = curAgg[0]
    const prev = prevAgg[0]
    const impressions = safeNum(cur?.reach)
    const clicks = safeNum(cur?.clicks)
    const liveCampaigns = safeNum(cur?.live)
    const prevImpressions = safeNum(prev?.reach)
    const prevClicks = safeNum(prev?.clicks)

    const avgCtr = impressions === 0 ? 0 : (clicks / impressions) * 100
    const prevAvgCtr = prevImpressions === 0 ? 0 : (prevClicks / prevImpressions) * 100

    const stats: PromotionManagerStats = {
      dailyImpressions: Math.round(impressions),
      impressionsDeltaPercent: pctDelta(impressions, prevImpressions),
      avgCtrPercent: Math.round(avgCtr * 100) / 100,
      ctrDeltaPercent: prevAvgCtr === 0 ? null : pctDelta(avgCtr, prevAvgCtr),
      linkClicks: Math.round(clicks),
      clicksDeltaPercent: pctDelta(clicks, prevClicks),
      liveCampaigns
    }

    const platforms: PromotionPlatformAggregate[] = platformRows
      .map((r) => ({
        platform: String(r.platform),
        posts: safeNum(r.posts),
        reach: safeNum(r.reach),
        clicks: safeNum(r.clicks)
      }))
      .sort((a, b) => b.reach - a.reach)

    const statuses: PromotionStatusAggregate[] = statusRows
      .map((r) => ({ status: String(r.status), count: safeNum(r.count) }))
      .sort((a, b) => b.count - a.count)

    const daily: PromotionDailyPoint[] = dailyRows.map((r) => ({
      date: r.bucket,
      reach: safeNum(r.reach),
      clicks: safeNum(r.clicks)
    }))

    const campaigns: PromotionCampaignRow[] = rows.map((r) => ({
      id: r.id,
      fabricId: r.fabricId,
      fabricTitle: (r.fabricTitleEn ?? r.fabricTitleRu ?? `Fabric #${r.fabricId}`).trim(),
      platform: String(r.platform),
      status: String(r.status),
      scheduledAt: r.scheduledAt?.toISOString() ?? null,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      reach: r.reach,
      linkClicks: r.linkClicks,
      updatedAt: r.updatedAt.toISOString()
    }))

    return {
      stats,
      platforms,
      statuses,
      daily,
      campaigns,
      generated_at: new Date().toISOString()
    }
  }
}
