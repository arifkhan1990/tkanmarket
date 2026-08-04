import { and, gte, isNull, lt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { bulkOrders } from '@/db/schema/bulk-orders.schema'
import { commissionRules } from '@/db/schema/commission-rules.schema'
import type { CommissionRuleDto, CommissionRulesDashboardDto, CommissionTierRow } from '@/types/commission-rules.types'

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `$${Math.round(n / 1000)}K`
  return `$${Math.round(n).toLocaleString('en-US')}`
}

function mapRow(r: {
  id: number
  categoryKey: string
  categoryLabel: string
  externalRef: string | null
  baseCommissionPercent: string
  minMonthlyVolumeUsd: number
  tierMode: 'FLAT' | 'TIERED'
  health: 'HEALTHY' | 'UNDER_REVIEW' | 'PAUSED'
  isActive: boolean
  tiers: unknown
  insightTitle: string | null
  insightBody: string | null
}): CommissionRuleDto {
  const tiers = Array.isArray(r.tiers) ? (r.tiers as CommissionTierRow[]) : null
  return {
    id: r.id,
    categoryKey: r.categoryKey,
    categoryLabel: r.categoryLabel,
    externalRef: r.externalRef,
    baseCommissionPercent: r.baseCommissionPercent,
    minMonthlyVolumeUsd: r.minMonthlyVolumeUsd,
    tierMode: r.tierMode,
    health: r.health,
    isActive: r.isActive,
    tiers,
    insightTitle: r.insightTitle,
    insightBody: r.insightBody
  }
}

export class CommissionRulesService {
  public static async getDashboard(): Promise<CommissionRulesDashboardDto> {
    const db = getDb()
    const now = new Date()
    const startCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const startPrev = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [ruleRows, volumeCurrent, volumePrev] = await Promise.all([
      db
        .select({
          id: commissionRules.id,
          categoryKey: commissionRules.categoryKey,
          categoryLabel: commissionRules.categoryLabel,
          externalRef: commissionRules.externalRef,
          baseCommissionPercent: commissionRules.baseCommissionPercent,
          minMonthlyVolumeUsd: commissionRules.minMonthlyVolumeUsd,
          tierMode: commissionRules.tierMode,
          health: commissionRules.health,
          isActive: commissionRules.isActive,
          tiers: commissionRules.tiers,
          insightTitle: commissionRules.insightTitle,
          insightBody: commissionRules.insightBody
        })
        .from(commissionRules)
        .where(isNull(commissionRules.deletedAt))
        .orderBy(commissionRules.categoryLabel),
      db
        .select({
          total: sql<string>`coalesce(sum(${bulkOrders.estimatedValueUsd})::numeric, 0)`.mapWith(String)
        })
        .from(bulkOrders)
        .where(
          and(
            isNull(bulkOrders.deletedAt),
            gte(bulkOrders.createdAt, startCurrent),
            sql`${bulkOrders.estimatedValueUsd} is not null`
          )
        ),
      db
        .select({
          total: sql<string>`coalesce(sum(${bulkOrders.estimatedValueUsd})::numeric, 0)`.mapWith(String)
        })
        .from(bulkOrders)
        .where(
          and(
            isNull(bulkOrders.deletedAt),
            gte(bulkOrders.createdAt, startPrev),
            lt(bulkOrders.createdAt, startCurrent),
            sql`${bulkOrders.estimatedValueUsd} is not null`
          )
        )
    ])

    const rules = ruleRows.filter((r) => r.isActive).map(mapRow)
    const gross = Number.parseFloat(volumeCurrent[0]?.total ?? '0') || 0
    const prevGross = Number.parseFloat(volumePrev[0]?.total ?? '0') || 0

    const activeBases = rules.map((r) => Number.parseFloat(r.baseCommissionPercent)).filter((n) => Number.isFinite(n))
    const effective =
      activeBases.length > 0 ? activeBases.reduce((a, b) => a + b, 0) / activeBases.length : 0

    const platformFees = gross * (effective / 100)
    let changePct = 0
    if (prevGross > 0) {
      changePct = ((gross - prevGross) / prevGross) * 100
    } else if (gross > 0) {
      changePct = 100
    }

    return {
      rules,
      projections: {
        monthlyGrossUsdLabel: formatUsd(gross),
        effectiveRatePercentLabel: `${effective.toFixed(2)}%`,
        platformFeesUsdLabel: formatUsd(platformFees),
        changePercentLabel: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`,
        disclaimer:
          'Revenue and fee estimates use bulk order estimated values from the last 30 days and average base commission across active category rules.'
      }
    }
  }
}
