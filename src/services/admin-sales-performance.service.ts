import { and, desc, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { users } from '@/db/schema/users.schema'
import { AdminAdvancedAnalyticsService } from '@/services/admin-advanced-analytics.service'
import type {
  AdminSalesPerformanceResponse,
  AdminSalesRecentConversionRow,
  AdminSalesRepPerformanceBand,
  AdminSalesTopRepresentativeRow
} from '@/types/admin-sales-performance.types'

function safeNum(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? v : 0
}

function pctDelta(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function regionFromCountry(country: string): string {
  const c = country.trim().toLowerCase()
  if (['china', 'russia', 'kazakhstan', 'uzbekistan', 'belarus'].includes(c)) return 'CIS · East'
  if (['germany', 'france', 'italy', 'spain', 'netherlands', 'poland', 'united kingdom', 'uk'].includes(c)) {
    return 'EMEA · Central'
  }
  if (['united states', 'usa', 'canada', 'mexico', 'brazil', 'argentina', 'chile'].includes(c)) {
    return 'Americas'
  }
  if (['japan', 'korea, republic of', 'south korea', 'singapore', 'india', 'vietnam', 'thailand'].includes(c)) {
    return 'APAC · East'
  }
  return 'Global'
}

function bandForRank(rank: number, total: number): AdminSalesRepPerformanceBand {
  if (total <= 1) return 'ON_TARGET'
  const topCut = Math.ceil(total * 0.33)
  const midCut = Math.ceil(total * 0.66)
  if (rank <= topCut) return 'EXCEEDING'
  if (rank <= midCut) return 'ON_TARGET'
  return 'DEVELOPING'
}

export class AdminSalesPerformanceService {
  public static async get(params: { days: number }): Promise<AdminSalesPerformanceResponse> {
    const periodDays = Math.min(365, Math.max(7, Math.floor(params.days)))
    const db = getDb()

    const now = new Date()
    const toUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
    const fromUtc = new Date(toUtc.getTime() - (periodDays - 1) * 86400000)
    const prevFromUtc = new Date(fromUtc.getTime() - periodDays * 86400000)
    const toExclusiveUtc = new Date(toUtc.getTime() + 86400000)

    const periodLeadCond = and(
      gte(leads.updatedAt, fromUtc),
      lt(leads.updatedAt, toExclusiveUtc),
      isNull(leads.deletedAt)
    )

    const grossExpr = sql<number>`coalesce(sum(case
      when ${leads.status} = 'CLOSED_WON' and ${leads.fabricId} is not null
      then coalesce(${fabrics.priceUsd}, 0)::numeric * coalesce(nullif(${fabrics.moq}, 0), 1)
      else 0 end), 0)`

    const wonDealsExpr = sql<number>`coalesce(count(${leads.id}) filter (where ${leads.status} = 'CLOSED_WON'), 0)::int`

    const repAggBase = db
      .select({
        userId: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        gross: grossExpr,
        wonDeals: wonDealsExpr
      })
      .from(users)
      .leftJoin(
        leads,
        and(eq(leads.assignedToId, users.id), periodLeadCond)
      )
      .leftJoin(fabrics, and(eq(leads.fabricId, fabrics.id), isNull(fabrics.deletedAt)))
      .where(and(isNull(users.deletedAt), inArray(users.role, ['ADMIN', 'SALES'])))
      .groupBy(users.id, users.name, users.avatarUrl, users.role)
      .orderBy(desc(grossExpr))

    const [analytics, [avgLeadRow, prevAvgLeadRow], recentRows, allRepRows] = await Promise.all([
      AdminAdvancedAnalyticsService.getRollingDays(periodDays),
      Promise.all([
        db
          .select({
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${leads.updatedAt} - ${leads.createdAt})) / 86400.0)`
          })
          .from(leads)
          .where(
            and(
              isNull(leads.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, fromUtc),
              lt(leads.updatedAt, toExclusiveUtc)
            )
          ),
        db
          .select({
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${leads.updatedAt} - ${leads.createdAt})) / 86400.0)`
          })
          .from(leads)
          .where(
            and(
              isNull(leads.deletedAt),
              eq(leads.status, 'CLOSED_WON'),
              gte(leads.updatedAt, prevFromUtc),
              lt(leads.updatedAt, fromUtc)
            )
          )
      ]),
      db
        .select({
          leadId: leads.id,
          companyName: leads.companyName,
          titleEn: fabrics.titleEn,
          titleRu: fabrics.titleRu,
          sku: fabrics.sku,
          supplierName: suppliers.name,
          priceUsd: fabrics.priceUsd,
          moq: fabrics.moq,
          updatedAt: leads.updatedAt
        })
        .from(leads)
        .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
        .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
        .where(
          and(
            isNull(leads.deletedAt),
            isNull(fabrics.deletedAt),
            isNull(suppliers.deletedAt),
            eq(leads.status, 'CLOSED_WON'),
            gte(leads.updatedAt, fromUtc),
            lt(leads.updatedAt, toExclusiveUtc)
          )
        )
        .orderBy(desc(leads.updatedAt))
        .limit(8),
      repAggBase
    ])

    const avgLeadTimeDays = avgLeadRow[0]?.avgDays != null ? safeNum(avgLeadRow[0].avgDays) : null
    const prevAvg = prevAvgLeadRow[0]?.avgDays != null ? safeNum(prevAvgLeadRow[0].avgDays) : null
    const avgLeadTimeDeltaPercent =
      avgLeadTimeDays != null && prevAvg != null && prevAvg > 0 ? pctDelta(avgLeadTimeDays, prevAvg) : null

    const recentConversions: AdminSalesRecentConversionRow[] = recentRows.map((r) => {
      const price = safeNum(r.priceUsd)
      const moq = r.moq && r.moq > 0 ? r.moq : 1
      return {
        leadId: r.leadId,
        companyName: r.companyName,
        fabricTitleEn: r.titleEn,
        fabricTitleRu: r.titleRu,
        fabricSku: r.sku,
        supplierName: r.supplierName,
        valueUsd: price * moq,
        closedAt: r.updatedAt.toISOString()
      }
    })

    const totalReps = allRepRows.length
    const topSlice = allRepRows.slice(0, 8)
    const topIds = topSlice.map((r) => r.userId)

    const countryPick = new Map<number, { country: string; n: number }>()
    if (topIds.length > 0) {
      const ccRows = await db
        .select({
          uid: leads.assignedToId,
          country: leads.country,
          n: sql<number>`count(*)::int`
        })
        .from(leads)
        .where(
          and(
            isNull(leads.deletedAt),
            inArray(leads.assignedToId, topIds),
            eq(leads.status, 'CLOSED_WON'),
            gte(leads.updatedAt, fromUtc),
            lt(leads.updatedAt, toExclusiveUtc)
          )
        )
        .groupBy(leads.assignedToId, leads.country)

      for (const row of ccRows) {
        if (row.uid == null) continue
        const nn = safeNum(row.n)
        const prev = countryPick.get(row.uid)
        if (!prev || nn > prev.n) countryPick.set(row.uid, { country: row.country, n: nn })
      }
    }

    const topRepresentatives: AdminSalesTopRepresentativeRow[] = topSlice.map((r, idx) => {
      const topCo = countryPick.get(r.userId)?.country
      const regionLabel = topCo ? regionFromCountry(topCo) : '—'
      return {
        userId: r.userId,
        name: r.name,
        avatarUrl: r.avatarUrl,
        role: r.role,
        regionLabel,
        grossSalesUsd: safeNum(r.gross),
        wonDeals: safeNum(r.wonDeals),
        performanceBand: bandForRank(idx + 1, Math.max(1, totalReps))
      }
    })

    return {
      periodDays,
      analytics,
      avgLeadTimeDays,
      avgLeadTimeDeltaPercent,
      recentConversions,
      topRepresentatives
    }
  }
}
