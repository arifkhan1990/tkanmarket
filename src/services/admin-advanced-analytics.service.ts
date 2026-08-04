import { and, count, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories } from '@/db/schema/fabrics.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import type { AdvancedAnalyticsResponse, AdvancedAnalyticsSparklines, AdvancedAnalyticsStats } from '@/types/admin-advanced-analytics.types'
import type { LeadsBySourcePoint, TrafficVsConversionsPoint, TopFabricCategoriesPoint } from '@/types/admin-stats.types'
import type { MarketplaceAnalyticsPeriod } from '@/types/marketplace-analytics.types'

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function addDaysUtc(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

function toDayKey(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildDayKeys(from: Date, days: number): string[] {
  return Array.from({ length: days }).map((_, i) => toDayKey(addDaysUtc(from, i)))
}

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function safeNum(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? v : 0
}

async function getSeriesByDay(params: {
  fromUtc: Date
  toExclusiveUtc: Date
  query: () => Promise<Array<{ day: string; count: number }>>
  keys: string[]
}): Promise<{ day: string; count: number }[]> {
  const rows = await params.query()
  const map = new Map(rows.map((r) => [r.day, r.count]))
  return params.keys.map((k) => ({ day: k, count: map.get(k) ?? 0 }))
}

async function getRevenueSeriesByDay(params: {
  fromUtc: Date
  toExclusiveUtc: Date
  query: () => Promise<Array<{ day: string; revenue: number }>>
  keys: string[]
}): Promise<Array<{ date: string; revenue: number }>> {
  const rows = await params.query()
  const map = new Map(rows.map((r) => [r.day, r.revenue]))
  return params.keys.map((k) => ({ date: k, revenue: map.get(k) ?? 0 }))
}

type WindowParams = {
  fromUtc: Date
  toExclusiveUtc: Date
  prevFromUtc: Date
  prevToExclusiveUtc: Date
  dayKeys: string[]
}

export class AdminAdvancedAnalyticsService {
  /** Rolling window of daily analytics (revenue, traffic, conversions, etc.). */
  public static async getRollingDays(dayCount: number): Promise<AdvancedAnalyticsResponse> {
    const safe = Math.min(365, Math.max(7, Math.floor(dayCount)))
    const now = new Date()
    const toUtc = startOfUtcDay(now)
    const fromUtc = addDaysUtc(toUtc, -(safe - 1))
    const prevToExclusiveUtc = fromUtc
    const prevFromUtc = addDaysUtc(fromUtc, -safe)
    const toExclusiveUtc = addDaysUtc(toUtc, 1)
    const dayKeys = buildDayKeys(fromUtc, safe)
    return this.computeForWindow({ fromUtc, toExclusiveUtc, prevFromUtc, prevToExclusiveUtc, dayKeys })
  }

  public static async getLast30Days(): Promise<AdvancedAnalyticsResponse> {
    return this.getRollingDays(30)
  }

  public static async getForMarketplacePeriod(period: MarketplaceAnalyticsPeriod): Promise<AdvancedAnalyticsResponse> {
    const now = new Date()
    const toUtc = startOfUtcDay(now)
    const toExclusiveUtc = addDaysUtc(toUtc, 1)

    if (period === '30d') {
      const dayCount = 30
      const fromUtc = addDaysUtc(toUtc, -(dayCount - 1))
      const prevToExclusiveUtc = fromUtc
      const prevFromUtc = addDaysUtc(fromUtc, -dayCount)
      const dayKeys = buildDayKeys(fromUtc, dayCount)
      return this.computeForWindow({ fromUtc, toExclusiveUtc, prevFromUtc, prevToExclusiveUtc, dayKeys })
    }

    if (period === 'quarter') {
      const dayCount = 90
      const fromUtc = addDaysUtc(toUtc, -(dayCount - 1))
      const prevToExclusiveUtc = fromUtc
      const prevFromUtc = addDaysUtc(fromUtc, -dayCount)
      const dayKeys = buildDayKeys(fromUtc, dayCount)
      return this.computeForWindow({ fromUtc, toExclusiveUtc, prevFromUtc, prevToExclusiveUtc, dayKeys })
    }

    const year = toUtc.getUTCFullYear()
    const fromUtc = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0))
    const dayCount = Math.max(1, Math.round((toExclusiveUtc.getTime() - fromUtc.getTime()) / 86400000))
    const prevToExclusiveUtc = fromUtc
    const prevFromUtc = addDaysUtc(fromUtc, -dayCount)
    const dayKeys = buildDayKeys(fromUtc, dayCount)
    return this.computeForWindow({ fromUtc, toExclusiveUtc, prevFromUtc, prevToExclusiveUtc, dayKeys })
  }

  private static async computeForWindow(params: WindowParams): Promise<AdvancedAnalyticsResponse> {
    const { fromUtc, toExclusiveUtc, prevFromUtc, prevToExclusiveUtc, dayKeys } = params
    const db = getDb()

    const trafficSeries = await getSeriesByDay({
      fromUtc,
      toExclusiveUtc,
      keys: dayKeys,
      query: async () => {
        const rows = await db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${leads.createdAt}), 'YYYY-MM-DD')`,
            count: count()
          })
          .from(leads)
          .where(
            and(
              isNull(leads.deletedAt),
              gte(leads.createdAt, fromUtc),
              lt(leads.createdAt, toExclusiveUtc)
            )
          )
          .groupBy(sql`date_trunc('day', ${leads.createdAt})`)
          .orderBy(sql`date_trunc('day', ${leads.createdAt})`)
        return rows.map((r) => ({ day: r.day, count: Number(r.count) }))
      }
    })

    const conversionsSeries = await getSeriesByDay({
      fromUtc,
      toExclusiveUtc,
      keys: dayKeys,
      query: async () => {
        const rows = await db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${leads.updatedAt}), 'YYYY-MM-DD')`,
            count: count()
          })
          .from(leads)
          .where(
            and(
              isNull(leads.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, fromUtc),
              lt(leads.updatedAt, toExclusiveUtc)
            )
          )
          .groupBy(sql`date_trunc('day', ${leads.updatedAt})`)
          .orderBy(sql`date_trunc('day', ${leads.updatedAt})`)
        return rows.map((r) => ({ day: r.day, count: Number(r.count) }))
      }
    })

    const revenueDaily = await getRevenueSeriesByDay({
      fromUtc,
      toExclusiveUtc,
      keys: dayKeys,
      query: async () => {
        const rows = await db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${leads.updatedAt}), 'YYYY-MM-DD')`,
            revenue: sql<number>`COALESCE(SUM(COALESCE(${fabrics.priceUsd}::numeric, 0) * COALESCE(NULLIF(${fabrics.moq}, 0), 1)), 0)`
          })
          .from(leads)
          .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
          .where(
            and(
              isNull(leads.deletedAt),
              isNull(fabrics.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, fromUtc),
              lt(leads.updatedAt, toExclusiveUtc)
            )
          )
          .groupBy(sql`date_trunc('day', ${leads.updatedAt})`)
          .orderBy(sql`date_trunc('day', ${leads.updatedAt})`)

        return rows.map((r) => ({ day: r.day, revenue: safeNum(r.revenue) }))
      }
    })

    const activeSuppliersSeries = await getSeriesByDay({
      fromUtc,
      toExclusiveUtc,
      keys: dayKeys,
      query: async () => {
        const rows = await db
          .select({
            day: sql<string>`to_char(date_trunc('day', ${fabrics.updatedAt}), 'YYYY-MM-DD')`,
            count: sql<number>`COUNT(DISTINCT ${fabrics.supplierId})`
          })
          .from(fabrics)
          .where(
            and(
              isNull(fabrics.deletedAt),
              eq(fabrics.status, 'approved'),
              gte(fabrics.updatedAt, fromUtc),
              lt(fabrics.updatedAt, toExclusiveUtc)
            )
          )
          .groupBy(sql`date_trunc('day', ${fabrics.updatedAt})`)
          .orderBy(sql`date_trunc('day', ${fabrics.updatedAt})`)
        return rows.map((r) => ({ day: r.day, count: safeNum(r.count) }))
      }
    })

    const trafficTotal = trafficSeries.reduce((a, b) => a + b.count, 0)
    const conversionsTotal = conversionsSeries.reduce((a, b) => a + b.count, 0)
    const revenueTotal = revenueDaily.reduce((a, b) => a + b.revenue, 0)
    const newLeads = trafficTotal
    const activeSuppliers = activeSuppliersSeries.reduce((max, p) => Math.max(max, p.count), 0)

    const conversionRate = trafficTotal === 0 ? 0 : (conversionsTotal / trafficTotal) * 100

    const [prevTrafficRows, prevConversionsRows, prevRevenueRows, prevActiveSuppliersRow] = await Promise.all([
      (async () => {
        const rows = await db
          .select({
            count: count()
          })
          .from(leads)
          .where(and(isNull(leads.deletedAt), gte(leads.createdAt, prevFromUtc), lt(leads.createdAt, prevToExclusiveUtc)))
        return Number(rows[0]?.count ?? 0)
      })(),
      (async () => {
        const rows = await db
          .select({
            count: count()
          })
          .from(leads)
          .where(
            and(
              isNull(leads.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, prevFromUtc),
              lt(leads.updatedAt, prevToExclusiveUtc)
            )
          )
        return Number(rows[0]?.count ?? 0)
      })(),
      (async () => {
        const rows = await db
          .select({
            revenue: sql<number>`COALESCE(SUM(COALESCE(${fabrics.priceUsd}::numeric, 0) * COALESCE(NULLIF(${fabrics.moq}, 0), 1)), 0)`
          })
          .from(leads)
          .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
          .where(
            and(
              isNull(leads.deletedAt),
              isNull(fabrics.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, prevFromUtc),
              lt(leads.updatedAt, prevToExclusiveUtc)
            )
          )
        return safeNum(rows[0]?.revenue ?? 0)
      })(),
      (async () => {
        const rows = await db
          .select({
            count: sql<number>`COUNT(DISTINCT ${fabrics.supplierId})`
          })
          .from(fabrics)
          .where(
            and(
              isNull(fabrics.deletedAt),
              eq(fabrics.status, 'approved'),
              gte(fabrics.updatedAt, prevFromUtc),
              lt(fabrics.updatedAt, prevToExclusiveUtc)
            )
          )
        return safeNum(rows[0]?.count ?? 0)
      })()
    ])

    const prevTrafficTotal = prevTrafficRows
    const prevConversionsTotal = prevConversionsRows
    const prevRevenueTotal = prevRevenueRows
    const prevActiveSuppliers = prevActiveSuppliersRow

    const revenueGrowthPercent = pctDelta(revenueTotal, prevRevenueTotal)

    const prevConversionRate = prevTrafficTotal === 0 ? 0 : (prevConversionsTotal / prevTrafficTotal) * 100
    const conversionRateGrowthPercent = prevConversionRate === 0 ? null : pctDelta(conversionRate, prevConversionRate)

    const newLeadsGrowthPercent = pctDelta(newLeads, prevTrafficTotal)
    const activeSuppliersGrowthPercent = prevActiveSuppliers === 0 ? null : pctDelta(activeSuppliers, prevActiveSuppliers)

    const stats: AdvancedAnalyticsStats = {
      totalRevenue: revenueTotal,
      revenueGrowthPercent,
      conversionRate,
      conversionRateGrowthPercent,
      newLeads,
      newLeadsGrowthPercent,
      activeSuppliers,
      activeSuppliersGrowthPercent
    }

    const trafficVsConversions: TrafficVsConversionsPoint[] = dayKeys.map((k, i) => ({
      date: k,
      traffic: trafficSeries[i]?.count ?? 0,
      conversions: conversionsSeries[i]?.count ?? 0
    }))

    const leadsBySource = await db
      .select({ source: leads.source, count: count() })
      .from(leads)
      .where(and(isNull(leads.deletedAt), gte(leads.createdAt, fromUtc), lt(leads.createdAt, toExclusiveUtc)))
      .groupBy(leads.source)
      .orderBy(desc(count()))

    const leadsBySourcePoints: LeadsBySourcePoint[] = leadsBySource.map((r) => ({
      source: String(r.source),
      count: Number(r.count)
    }))

    const topFabricCategories = await db
      .select({ category: fabricCategories.categorySlug, count: count() })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(
        and(
          isNull(fabricCategories.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved'),
          gte(fabrics.updatedAt, fromUtc),
          lt(fabrics.updatedAt, toExclusiveUtc)
        )
      )
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(count()))
      .limit(5)

    const topFabricCategoriesPoints: TopFabricCategoriesPoint[] = topFabricCategories.map((r) => ({
      category: String(r.category),
      count: Number(r.count)
    }))

    const sparklines: AdvancedAnalyticsSparklines = {
      revenue: revenueDaily.map((r) => ({ date: r.date, value: r.revenue })),
      traffic: trafficSeries.map((r) => ({ date: r.day, value: r.count })),
      conversions: conversionsSeries.map((r) => ({ date: r.day, value: r.count })),
      activeSuppliers: activeSuppliersSeries.map((r) => ({ date: r.day, value: r.count }))
    }

    return {
      period: { from: fromUtc.toISOString(), to: toExclusiveUtc.toISOString() },
      stats,
      trafficVsConversions,
      leadsBySource: leadsBySourcePoints,
      topFabricCategories: topFabricCategoriesPoints,
      sparklines
    }
  }
}
