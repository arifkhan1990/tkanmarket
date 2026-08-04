import { and, count, desc, eq, gte, isNull, notInArray, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { crawlerRuns } from '@/db/schema/crawler.schema'
import type {
  CrawlerStats,
  FabricStats,
  FabricsPublishedSeriesPoint,
  LeadStats,
  LeadsBySourcePoint,
  TopFabricCategoriesPoint,
  TrafficVsConversionsPoint,
  SocialStats
} from '@/types/admin-stats.types'

function startOfTodayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

function startOfMonthUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
}

function daysAgoUtc(days: number): Date {
  const now = new Date()
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

export class StatsService {
  private static daysAgoUtc(days: number): Date {
    const now = new Date()
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  }

  private static startOfDayUtc(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
  }

  public static async getFabricStats(): Promise<FabricStats> {
    const db = getDb()
    const today = startOfTodayUtc()

    const [total, pendingReview, aiProcessing, publishedToday] = await Promise.all([
      db
        .select({ count: count() })
        .from(fabrics)
        .where(isNull(fabrics.deletedAt)),
      db
        .select({ count: count() })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'ai_processed'))),
      db
        .select({ count: count() })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'ai_processing'))),
      db
        .select({ count: count() })
        .from(fabrics)
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'), gte(fabrics.updatedAt, today)))
    ])

    return {
      total: total[0]?.count ?? 0,
      pending_review: pendingReview[0]?.count ?? 0,
      ai_processing: aiProcessing[0]?.count ?? 0,
      published_today: publishedToday[0]?.count ?? 0
    }
  }

  public static async getLeadStats(): Promise<LeadStats> {
    const db = getDb()
    const today = startOfTodayUtc()
    const monthStart = startOfMonthUtc()

    const [total, newToday, open, closedWonThisMonth] = await Promise.all([
      db
        .select({ count: count() })
        .from(leads)
        .where(isNull(leads.deletedAt)),
      db
        .select({ count: count() })
        .from(leads)
        .where(and(isNull(leads.deletedAt), gte(leads.createdAt, today))),
      db
        .select({ count: count() })
        .from(leads)
        .where(and(isNull(leads.deletedAt), notInArray(leads.status, ['CLOSED_WON', 'CLOSED_LOST']))),
      db
        .select({ count: count() })
        .from(leads)
        .where(and(isNull(leads.deletedAt), eq(leads.status, 'CLOSED_WON'), gte(leads.updatedAt, monthStart)))
    ])

    return {
      total: total[0]?.count ?? 0,
      new_today: newToday[0]?.count ?? 0,
      open: open[0]?.count ?? 0,
      closed_won_this_month: closedWonThisMonth[0]?.count ?? 0
    }
  }

  public static async getSocialStats(): Promise<SocialStats> {
    const db = getDb()
    const weekAgo = daysAgoUtc(7)

    const [postsThisWeek, scheduled, publishedTotal] = await Promise.all([
      db
        .select({ count: count() })
        .from(socialPosts)
        .where(and(eq(socialPosts.status, 'PUBLISHED'), gte(socialPosts.publishedAt, weekAgo))),
      db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.status, 'SCHEDULED')),
      db
        .select({ count: count() })
        .from(socialPosts)
        .where(eq(socialPosts.status, 'PUBLISHED'))
    ])

    return {
      posts_this_week: postsThisWeek[0]?.count ?? 0,
      scheduled: scheduled[0]?.count ?? 0,
      published_total: publishedTotal[0]?.count ?? 0
    }
  }

  public static async getCrawlerStats(): Promise<CrawlerStats> {
    const db = getDb()
    const [lastRun, runningJobs] = await Promise.all([
      db
        .select({
          status: crawlerRuns.status,
          startedAt: crawlerRuns.startedAt,
          completedAt: crawlerRuns.completedAt,
          createdAt: crawlerRuns.createdAt,
          productsFound: crawlerRuns.productsFound,
          productsSaved: crawlerRuns.productsSaved
        })
        .from(crawlerRuns)
        .orderBy(desc(crawlerRuns.id))
        .limit(1),
      db
        .select({ count: count() })
        .from(crawlerRuns)
        .where(eq(crawlerRuns.status, 'RUNNING'))
    ])

    const row = lastRun[0]
    const lastRunAt = row?.startedAt ?? row?.createdAt ?? null

    return {
      last_run_at: lastRunAt ? lastRunAt.toISOString() : null,
      last_run_status: row?.status ?? null,
      products_found_last_run: row?.productsFound ?? 0,
      products_saved_last_run: row?.productsSaved ?? 0,
      running_jobs: runningJobs[0]?.count ?? 0
    }
  }

  public static async getFabricsPublishedSeriesLast30Days(): Promise<FabricsPublishedSeriesPoint[]> {
    const db = getDb()
    const since = StatsService.daysAgoUtc(30)

    const rows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${fabrics.updatedAt}), 'YYYY-MM-DD')`,
        count: count()
      })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'), gte(fabrics.updatedAt, since)))
      .groupBy(sql`date_trunc('day', ${fabrics.updatedAt})`)
      .orderBy(sql`date_trunc('day', ${fabrics.updatedAt})`)

    return rows.map((r) => ({ date: r.day, count: r.count }))
  }

  public static async getLeadsBySourceLast30Days(): Promise<LeadsBySourcePoint[]> {
    const db = getDb()
    const since = StatsService.daysAgoUtc(30)

    const rows = await db
      .select({ source: leads.source, count: count() })
      .from(leads)
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, since)))
      .groupBy(leads.source)
      .orderBy(desc(count()))

    return rows.map((r) => ({ source: String(r.source), count: r.count }))
  }

  public static async getTrafficVsConversionsSeriesLast30Days(): Promise<TrafficVsConversionsPoint[]> {
    const db = getDb()
    const since = StatsService.daysAgoUtc(30)

    const [trafficRows, conversionRows] = await Promise.all([
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`,
          count: count()
        })
        .from(leads)
        .where(and(isNull(leads.deletedAt), gte(leads.createdAt, since)))
        .groupBy(sql`date_trunc('day', ${leads.createdAt})`)
        .orderBy(sql`date_trunc('day', ${leads.createdAt})`),
      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${leads.updatedAt}), 'YYYY-MM-DD')`,
          count: count()
        })
        .from(leads)
        .where(and(isNull(leads.deletedAt), eq(leads.status, 'CLOSED_WON'), gte(leads.updatedAt, since)))
        .groupBy(sql`date_trunc('day', ${leads.updatedAt})`)
        .orderBy(sql`date_trunc('day', ${leads.updatedAt})`)
    ])

    const byDate = new Map<string, { traffic: number; conversions: number }>()
    for (const r of trafficRows) byDate.set(r.day, { traffic: r.count, conversions: 0 })
    for (const r of conversionRows) {
      const cur = byDate.get(r.day)
      if (!cur) byDate.set(r.day, { traffic: 0, conversions: r.count })
      else byDate.set(r.day, { traffic: cur.traffic, conversions: r.count })
    }

    // Ensure stable sorting for chart.
    const points: TrafficVsConversionsPoint[] = Array.from(byDate.entries())
      .map(([date, v]) => ({ date, traffic: v.traffic, conversions: v.conversions }))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

    // Backfill missing days so x-axis doesn't jump.
    const sinceStart = StatsService.startOfDayUtc(since)
    const now = new Date()
    const nowStart = StatsService.startOfDayUtc(now)
    const totalDays = Math.max(0, Math.round((nowStart.getTime() - sinceStart.getTime()) / (24 * 60 * 60 * 1000)))
    const trafficByDate = new Map(points.map((p) => [p.date, p]))

    const filled: TrafficVsConversionsPoint[] = []
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(sinceStart.getTime() + i * 24 * 60 * 60 * 1000)
      const date = d.toISOString().slice(0, 10)
      const existing = trafficByDate.get(date)
      filled.push({ date, traffic: existing?.traffic ?? 0, conversions: existing?.conversions ?? 0 })
    }

    return filled
  }

  public static async getTopFabricCategoriesLast30Days(limit = 5): Promise<TopFabricCategoriesPoint[]> {
    const db = getDb()
    const since = StatsService.daysAgoUtc(30)

    const rows = await db
      .select({
        categorySlug: fabricCategories.categorySlug,
        count: count()
      })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(
        and(
          isNull(fabricCategories.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved'),
          gte(fabrics.updatedAt, since)
        )
      )
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(count()))
      .limit(limit)

    return rows.map((r) => ({
      category: r.categorySlug,
      count: r.count
    }))
  }
}

