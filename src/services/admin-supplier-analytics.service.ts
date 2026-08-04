import { and, count, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  SupplierAnalyticsPayload,
  SupplierLeaderboardRow
} from '@/types/supplier-admin.types'

const LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'NEGOTIATING',
  'CLOSED_WON',
  'CLOSED_LOST'
] as const

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? null : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

export class AdminSupplierAnalyticsService {
  public static async getAnalytics(): Promise<SupplierAnalyticsPayload> {
    const db = getDb()
    const now = Date.now()
    const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const d60 = new Date(now - 60 * 24 * 60 * 60 * 1000)

    const baseSupplier = isNull(suppliers.deletedAt)
    const totalSuppliersRows = await db.select({ total: count() }).from(suppliers).where(baseSupplier)
    const totalSuppliers = totalSuppliersRows[0]?.total ?? 0

    const verifiedRows = await db
      .select({ total: count() })
      .from(suppliers)
      .where(and(baseSupplier, eq(suppliers.verified, true)))
    const verifiedSuppliers = verifiedRows[0]?.total ?? 0

    const pendingVerification = Math.max(0, totalSuppliers - verifiedSuppliers)

    const fabricWhere = and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))
    const totalFabricsRows = await db.select({ total: count() }).from(fabrics).where(fabricWhere)
    const totalApprovedFabrics = totalFabricsRows[0]?.total ?? 0

    const avgFabricsPerSupplier =
      totalSuppliers > 0 ? Math.round((totalApprovedFabrics / totalSuppliers) * 10) / 10 : 0

    const supNew30 = await db
      .select({ total: count() })
      .from(suppliers)
      .where(and(baseSupplier, gte(suppliers.createdAt, d30)))
    const supPrev30 = await db
      .select({ total: count() })
      .from(suppliers)
      .where(and(baseSupplier, gte(suppliers.createdAt, d60), lt(suppliers.createdAt, d30)))

    const suppliersTrendPct = pctChange(supNew30[0]?.total ?? 0, supPrev30[0]?.total ?? 0)

    const fabNew30 = await db
      .select({ total: count() })
      .from(fabrics)
      .where(and(fabricWhere, gte(fabrics.createdAt, d30)))
    const fabPrev30 = await db
      .select({ total: count() })
      .from(fabrics)
      .where(and(fabricWhere, gte(fabrics.createdAt, d60), lt(fabrics.createdAt, d30)))

    const fabricsTrendPct = pctChange(fabNew30[0]?.total ?? 0, fabPrev30[0]?.total ?? 0)

    const leadBase = isNull(leads.deletedAt)
    const leadsLast30 = await db
      .select({ total: count() })
      .from(leads)
      .where(and(leadBase, gte(leads.createdAt, d30)))
    const leadsPrev30 = await db
      .select({ total: count() })
      .from(leads)
      .where(and(leadBase, gte(leads.createdAt, d60), lt(leads.createdAt, d30)))

    const l30 = leadsLast30[0]?.total ?? 0
    const lPrev = leadsPrev30[0]?.total ?? 0
    const leadsTrendPct = pctChange(l30, lPrev)

    const byStatus: { status: (typeof LEAD_STATUSES)[number]; count: number }[] = []
    for (const st of LEAD_STATUSES) {
      const r = await db
        .select({ total: count() })
        .from(leads)
        .where(and(leadBase, eq(leads.status, st)))
      byStatus.push({ status: st, count: r[0]?.total ?? 0 })
    }
    const totalLeads = byStatus.reduce((s, x) => s + x.count, 0)

    const catRows = await db
      .select({
        categorySlug: fabricCategories.categorySlug,
        cnt: count(fabricCategories.id)
      })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(and(isNull(fabricCategories.deletedAt), fabricWhere))
      .groupBy(fabricCategories.categorySlug)

    const categoryShare = [...catRows]
      .sort((a, b) => Number(b.cnt) - Number(a.cnt))
      .slice(0, 12)
      .map((r) => ({
        categorySlug: r.categorySlug,
        count: Number(r.cnt)
      }))

    const topSuppliers = await db
      .select({
        supplierId: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        logoUrl: suppliers.logoUrl,
        verified: suppliers.verified,
        fabricCount: count(fabrics.id),
        avgScore: sql<number | null>`avg(${fabrics.socialScore})::float`
      })
      .from(suppliers)
      .innerJoin(fabrics, eq(fabrics.supplierId, suppliers.id))
      .where(and(baseSupplier, fabricWhere))
      .groupBy(suppliers.id)
      .orderBy(desc(count(fabrics.id)))
      .limit(15)

    const leaderboard: SupplierLeaderboardRow[] = topSuppliers.map((r, idx) => ({
      rank: idx + 1,
      supplierId: r.supplierId,
      name: r.name,
      slug: r.slug,
      logoUrl: r.logoUrl ?? null,
      approvedFabrics: Number(r.fabricCount),
      avgSocialScore: r.avgScore != null ? Math.round(r.avgScore * 10) / 10 : null,
      verified: r.verified
    }))

    const periodStart = d30.toISOString().slice(0, 10)
    const periodEnd = new Date().toISOString().slice(0, 10)

    return {
      overview: {
        periodLabel: `${periodStart} – ${periodEnd}`,
        totalSuppliers,
        verifiedSuppliers,
        pendingVerification,
        totalApprovedFabrics,
        avgFabricsPerSupplier,
        suppliersTrendPct,
        fabricsTrendPct,
        leadsLast30Days: l30,
        leadsPrev30Days: lPrev,
        leadsTrendPct
      },
      funnel: {
        totalLeads,
        byStatus
      },
      categoryShare,
      leaderboard
    }
  }
}
