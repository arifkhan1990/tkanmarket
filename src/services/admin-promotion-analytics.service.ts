import { and, gte, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialPosts } from '@/db/schema/social.schema'
import type { PromotionAnalyticsResponse, PromotionAnalyticsWeeklyPoint } from '@/types/admin-promotion-analytics.types'

function addDaysUtc(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86400000)
}

export class AdminPromotionAnalyticsService {
  public static async getWeeklySeries(): Promise<PromotionAnalyticsResponse> {
    const db = getDb()
    const now = new Date()
    const from = addDaysUtc(now, -12 * 7)

    const rows = await db
      .select({
        weekStart: sql<string>`to_char(date_trunc('week', ${socialPosts.updatedAt}), 'YYYY-MM-DD')`,
        reach: sql<number>`COALESCE(SUM(${socialPosts.reach}), 0)`,
        linkClicks: sql<number>`COALESCE(SUM(${socialPosts.linkClicks}), 0)`,
        posts: sql<number>`COUNT(*)::int`
      })
      .from(socialPosts)
      .where(and(isNull(socialPosts.deletedAt), gte(socialPosts.updatedAt, from)))
      .groupBy(sql`date_trunc('week', ${socialPosts.updatedAt})`)
      .orderBy(sql`date_trunc('week', ${socialPosts.updatedAt})`)

    const series: PromotionAnalyticsWeeklyPoint[] = rows.map((r) => ({
      weekStart: r.weekStart,
      reach: Number(r.reach ?? 0),
      linkClicks: Number(r.linkClicks ?? 0),
      posts: Number(r.posts ?? 0)
    }))

    const totals = series.reduce(
      (acc, p) => ({
        reach: acc.reach + p.reach,
        clicks: acc.clicks + p.linkClicks,
        posts: acc.posts + p.posts
      }),
      { reach: 0, clicks: 0, posts: 0 }
    )

    return {
      series,
      totals,
      periodLabel: 'Last ~12 weeks (UTC weeks)'
    }
  }
}
