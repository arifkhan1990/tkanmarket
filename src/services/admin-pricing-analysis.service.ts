import { and, avg, desc, eq, gte, isNotNull, isNull, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { commissionRules } from '@/db/schema/commission-rules.schema'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  PricingAnalysisChartPoint,
  PricingAnalysisFabricRow,
  PricingAnalysisMarketHealth,
  PricingAnalysisOptimizationItem,
  PricingAnalysisResponse,
  PricingAnalysisRiskDistribution,
  PricingRiskLevel
} from '@/types/admin-pricing-analysis.types'

const FABRIC_ROW_LIMIT = 40

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function safeNum(v: unknown, fallback = 0): number {
  const n = toNum(v)
  return n ?? fallback
}

function riskFromMargin(m: number | null, confidence: number | null): PricingRiskLevel {
  if (m === null) return 'Volatile'
  if (m < 12) return 'Critical'
  if (m < 22 || (confidence !== null && confidence < 0.55)) return 'Volatile'
  return 'Stable'
}

/** Compute trend delta from monthly chart points: avg of second half vs avg of first half. */
function computeTrendDelta(points: PricingAnalysisChartPoint[]): number | null {
  const valid = points.filter((p): p is { month_label: string; avg_price_usd: number } => p.avg_price_usd !== null)
  if (valid.length < 4) return null
  const half = Math.floor(valid.length / 2)
  const firstAvg = valid.slice(0, half).reduce((a, b) => a + b.avg_price_usd, 0) / half
  const secondAvg = valid.slice(half).reduce((a, b) => a + b.avg_price_usd, 0) / (valid.length - half)
  if (firstAvg === 0) return null
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 1000) / 10
}

export class AdminPricingAnalysisService {
  /**
   * Performance contract:
   *  - Five SQL statements, all dispatched concurrently via `Promise.all`.
   *  - Chart aggregation runs entirely in Postgres via `date_trunc('month', ...)` GROUP BY,
   *    so we transfer at most 12 rows instead of every approved fabric created in the last year.
   *  - Top categories query joins on the indexed `fabric_categories.fabric_id` foreign key.
   *  - The fabric row query is bounded (`limit 40`) and joins one row per supplier — no N+1.
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope to soft-delete-not-null (`deletedAt IS NULL`) and `status = 'approved'`.
   *  - No user input flows into SQL — output is read-only and aggregate.
   */
  public static async getOverview(): Promise<PricingAnalysisResponse> {
    const db = getDb()

    const since = new Date()
    since.setUTCMonth(since.getUTCMonth() - 11)
    since.setUTCDate(1)
    since.setUTCHours(0, 0, 0, 0)

    const commissionPromise = db
      .select({ v: avg(commissionRules.baseCommissionPercent) })
      .from(commissionRules)
      .where(and(eq(commissionRules.isActive, true), isNull(commissionRules.deletedAt)))

    const chartPromise = db
      .select({
        bucket: sql<string>`to_char(date_trunc('month', ${fabrics.createdAt}), 'YYYY-MM')`,
        avgPrice: sql<string>`AVG(${fabrics.priceUsd}::numeric)::text`
      })
      .from(fabrics)
      .where(
        and(
          eq(fabrics.status, 'approved'),
          isNull(fabrics.deletedAt),
          isNotNull(fabrics.priceUsd),
          gte(fabrics.createdAt, since)
        )
      )
      .groupBy(sql`date_trunc('month', ${fabrics.createdAt})`)
      .orderBy(sql`date_trunc('month', ${fabrics.createdAt})`)

    const fabricRowsPromise = db
      .select({
        id: fabrics.id,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq,
        aiConfidence: fabrics.aiConfidenceScore,
        supplierName: suppliers.name
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(
        and(
          eq(fabrics.status, 'approved'),
          isNull(fabrics.deletedAt),
          isNull(suppliers.deletedAt),
          isNotNull(fabrics.priceUsd)
        )
      )
      .orderBy(desc(fabrics.updatedAt))
      .limit(FABRIC_ROW_LIMIT)

    const viewsPromise = db
      .select({ avgViews: avg(fabrics.viewsCount) })
      .from(fabrics)
      .where(and(eq(fabrics.status, 'approved'), isNull(fabrics.deletedAt)))

    const topCategoriesPromise = db
      .select({
        categorySlug: fabricCategories.categorySlug,
        cnt: sql<number>`COUNT(*)::int`
      })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(
        and(
          isNull(fabricCategories.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(3)

    const [commRows, chartRows, fabricRows, viewRows, topCategoryRows] = await Promise.all([
      commissionPromise,
      chartPromise,
      fabricRowsPromise,
      viewsPromise,
      topCategoriesPromise
    ])

    const assumedCommission = toNum(commRows[0]?.v ?? null) ?? 18.5

    const chartPoints: PricingAnalysisChartPoint[] = chartRows.map((row) => {
      const avgPrice = toNum(row.avgPrice)
      return {
        month_label: row.bucket,
        avg_price_usd: avgPrice === null ? null : Math.round(avgPrice * 100) / 100
      }
    })

    const rows: PricingAnalysisFabricRow[] = fabricRows.map((f) => {
      const price = toNum(f.priceUsd)
      const conf = toNum(f.aiConfidence)
      const margin =
        price === null
          ? null
          : Math.max(0, Math.min(85, 100 - assumedCommission - (conf === null ? 12 : (1 - conf) * 28)))
      return {
        id: f.id,
        sku: f.sku,
        title: f.titleRu,
        supplierName: f.supplierName,
        price_usd: price,
        moq: f.moq,
        estimated_margin_percent: margin === null ? null : Math.round(margin * 10) / 10,
        risk: riskFromMargin(margin, conf)
      }
    })

    // Conservative revenue proxy: only count rows that have BOTH price and moq.
    const revenueProxy = rows.reduce(
      (acc, r) => acc + (r.price_usd && r.moq ? r.price_usd * r.moq : 0),
      0
    )
    const projected = Math.round(revenueProxy * 0.08)

    const distribution: PricingAnalysisRiskDistribution = {
      stable: rows.filter((r) => r.risk === 'Stable').length,
      volatile: rows.filter((r) => r.risk === 'Volatile').length,
      critical: rows.filter((r) => r.risk === 'Critical').length,
      total: rows.length
    }

    // Build optimization signals from real data — every signal is derived from rows above.
    const optimizations: PricingAnalysisOptimizationItem[] = []
    const nowIso = new Date().toISOString()

    if (rows.length === 0) {
      optimizations.push({
        id: 'no-priced-fabrics',
        tag: 'MARKET_RISK',
        kind: 'NO_PRICED_FABRICS',
        params: {},
        created_at: nowIso
      })
    } else {
      const criticalRows = rows.filter((r) => r.risk === 'Critical')
      const topCritical = criticalRows[0]
      if (topCritical && topCritical.estimated_margin_percent !== null) {
        optimizations.push({
          id: `critical-${topCritical.id}`,
          tag: 'SUPPLY_CHAIN',
          kind: 'CRITICAL_SKU',
          params: {
            sku: topCritical.sku ?? `#${topCritical.id}`,
            margin: topCritical.estimated_margin_percent,
            count: criticalRows.length
          },
          created_at: nowIso
        })
      }

      if (distribution.total > 0 && distribution.volatile > 0) {
        const pct = Math.round((distribution.volatile / distribution.total) * 1000) / 10
        optimizations.push({
          id: 'volatile-share',
          tag: 'MARKET_RISK',
          kind: 'VOLATILE_SHARE',
          params: { percent: pct, count: distribution.volatile },
          created_at: nowIso
        })
      }

      const topMargin = [...rows]
        .filter((r) => r.estimated_margin_percent !== null && r.risk === 'Stable')
        .sort((a, b) => (b.estimated_margin_percent ?? 0) - (a.estimated_margin_percent ?? 0))[0]
      if (topMargin && topMargin.estimated_margin_percent !== null && topMargin.estimated_margin_percent >= 35) {
        optimizations.push({
          id: `high-margin-${topMargin.id}`,
          tag: 'OPPORTUNITY',
          kind: 'HIGH_MARGIN_SKU',
          params: {
            sku: topMargin.sku ?? `#${topMargin.id}`,
            margin: topMargin.estimated_margin_percent
          },
          created_at: nowIso
        })
      }
    }

    const trendDelta = computeTrendDelta(chartPoints)
    if (trendDelta !== null) {
      if (trendDelta >= 1) {
        optimizations.push({
          id: 'price-drift-up',
          tag: 'MARKET_RISK',
          kind: 'PRICE_DRIFT_UP',
          params: { percent: Math.abs(trendDelta) },
          created_at: nowIso
        })
      } else if (trendDelta <= -1) {
        optimizations.push({
          id: 'price-drift-down',
          tag: 'OPPORTUNITY',
          kind: 'PRICE_DRIFT_DOWN',
          params: { percent: Math.abs(trendDelta) },
          created_at: nowIso
        })
      }
    }

    const avgListingViews = Math.round(safeNum(viewRows[0]?.avgViews) * 10) / 10
    const marketHealth: PricingAnalysisMarketHealth = {
      avg_listing_views: avgListingViews,
      inventory_turn_proxy_days: Math.round(
        Math.max(8, Math.min(48, 42 - Math.min(34, Math.log1p(avgListingViews) * 4.5)))
      )
    }

    const seriesTags = topCategoryRows.map((r) => r.categorySlug).filter((s): s is string => Boolean(s))

    return {
      chart_points: chartPoints.length > 12 ? chartPoints.slice(-12) : chartPoints,
      series_tags: seriesTags,
      fabrics: rows,
      assumed_commission_percent: Math.round(assumedCommission * 10) / 10,
      simulator: {
        projected_gross_profit_usd: projected,
        projected_delta_percent: trendDelta
      },
      risk_distribution: distribution,
      optimizations,
      market_health: marketHealth,
      generated_at: nowIso
    }
  }
}
