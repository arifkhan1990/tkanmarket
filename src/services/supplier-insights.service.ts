import {
  and,
  avg,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql
} from 'drizzle-orm'

import { getDb } from '@/db'
import { bulkOrders } from '@/db/schema/bulk-orders.schema'
import { commissionRules } from '@/db/schema/commission-rules.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { NotFoundError } from '@/lib/errors'
import type {
  SupplierInquiriesResponse,
  SupplierInquiryListItem,
  SupplierInsightsManagementKpis,
  SupplierOnboardingResponse,
  SupplierOnboardingStepStat,
  SupplierPerformanceMatrixResponse,
  SupplierPerformanceRow,
  SupplierPerformanceSnapshot,
  SupplierPayoutRow,
  SupplierPayoutsResponse,
  SupplierPayoutsSummary,
  SupplierPayoutStatus,
  SupplierScorecardResponse
} from '@/types/supplier-insights.types'

function toNum(v: string | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

async function getAssumedCommissionPercent(): Promise<number> {
  const db = getDb()
  const comm = await db
    .select({ v: avg(commissionRules.baseCommissionPercent) })
    .from(commissionRules)
    .where(and(eq(commissionRules.isActive, true), isNull(commissionRules.deletedAt)))
  return toNum(comm[0]?.v ?? null) ?? 18.5
}

export class SupplierInsightsService {
  public static async getManagementKpis(): Promise<SupplierInsightsManagementKpis> {
    const db = getDb()
    const base = isNull(suppliers.deletedAt)

    const [totalRow] = await db.select({ c: count() }).from(suppliers).where(base)
    const [verifiedRow] = await db
      .select({ c: count() })
      .from(suppliers)
      .where(and(base, eq(suppliers.verified, true)))

    const [fabRow] = await db
      .select({ c: count() })
      .from(fabrics)
      .where(
        and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))
      )

    const [leadRow] = await db
      .select({ c: count() })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(isNull(leads.deletedAt))

    return {
      totalSuppliers: totalRow?.c ?? 0,
      verifiedSuppliers: verifiedRow?.c ?? 0,
      approvedFabrics: fabRow?.c ?? 0,
      marketplaceInquiries: leadRow?.c ?? 0
    }
  }

  private static async buildPerformanceRows(): Promise<SupplierPerformanceRow[]> {
    const db = getDb()

    const fabricStats = await db
      .select({
        supplierId: fabrics.supplierId,
        total: count(),
        approved: sql<number>`sum(case when ${fabrics.status} = 'approved' then 1 else 0 end)`.mapWith(
          Number
        )
      })
      .from(fabrics)
      .where(isNull(fabrics.deletedAt))
      .groupBy(fabrics.supplierId)

    const viewStats = await db
      .select({
        supplierId: fabrics.supplierId,
        avgViews: avg(fabrics.viewsCount)
      })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .groupBy(fabrics.supplierId)

    const inquiryStats = await db
      .select({
        supplierId: fabrics.supplierId,
        total: count(),
        won: sql<number>`sum(case when ${leads.status} = 'CLOSED_WON' then 1 else 0 end)`.mapWith(Number)
      })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(isNull(leads.deletedAt))
      .groupBy(fabrics.supplierId)

    const closeDays = await db
      .select({
        supplierId: fabrics.supplierId,
        avgDays:
          sql<number>`avg(extract(epoch from (${leads.updatedAt} - ${leads.createdAt})) / 86400)`.mapWith(
            Number
          )
      })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(
        and(isNull(leads.deletedAt), eq(leads.status, 'CLOSED_WON'), isNotNull(leads.fabricId))
      )
      .groupBy(fabrics.supplierId)

    const supRows = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        country: suppliers.country,
        city: suppliers.city,
        verified: suppliers.verified,
        logoUrl: suppliers.logoUrl
      })
      .from(suppliers)
      .where(isNull(suppliers.deletedAt))

    const fabricMap = new Map(fabricStats.map((r) => [r.supplierId, r]))
    const viewMap = new Map(viewStats.map((r) => [r.supplierId, r]))
    const inqMap = new Map(inquiryStats.map((r) => [r.supplierId, r]))
    const closeMap = new Map(closeDays.map((r) => [r.supplierId, r]))

    const rows: SupplierPerformanceRow[] = supRows.map((s) => {
      const f = fabricMap.get(s.id)
      const ft = f?.total ?? 0
      const fa = f?.approved ?? 0
      const qualityRatePercent = ft > 0 ? round1((fa / ft) * 100) : 100

      const iq = inqMap.get(s.id)
      const iTotal = iq?.total ?? 0
      const iWon = iq?.won ?? 0
      const conversionPercent = iTotal > 0 ? round1((iWon / iTotal) * 100) : 0

      const avgViews = toNum(viewMap.get(s.id)?.avgViews?.toString() ?? null) ?? 0
      const engagement = clamp(avgViews / 3, 0, 100)

      const rawClose = closeMap.get(s.id)?.avgDays
      const avgCloseDays =
        rawClose != null && Number.isFinite(rawClose) ? round1(rawClose) : null

      const compositeScore = round1(
        qualityRatePercent * 0.4 + conversionPercent * 0.4 + engagement * 0.2
      )

      return {
        supplierId: s.id,
        name: s.name,
        slug: s.slug,
        country: s.country,
        city: s.city ?? null,
        verified: s.verified,
        logoUrl: s.logoUrl ?? null,
        fabricTotal: ft,
        fabricApproved: fa,
        qualityRatePercent,
        inquiryTotal: iTotal,
        inquiryWon: iWon,
        conversionPercent,
        avgFabricViews: round1(avgViews),
        avgCloseDays,
        compositeScore
      }
    })

    rows.sort((a, b) => b.compositeScore - a.compositeScore)
    return rows
  }

  private static async getGlobalSnapshot(
    rows: SupplierPerformanceRow[]
  ): Promise<SupplierPerformanceSnapshot> {
    const db = getDb()
    const withFab = rows.filter((r) => r.fabricTotal > 0)
    const globalQuality =
      withFab.length > 0
        ? round1(withFab.reduce((s, r) => s + r.qualityRatePercent, 0) / withFab.length)
        : 100

    const closeRow = await db
      .select({
        v: sql<number>`avg(extract(epoch from (${leads.updatedAt} - ${leads.createdAt})) / 86400)`.mapWith(
          Number
        )
      })
      .from(leads)
      .where(and(isNull(leads.deletedAt), eq(leads.status, 'CLOSED_WON')))

    const avgDays = closeRow[0]?.v != null && Number.isFinite(closeRow[0].v) ? round1(closeRow[0].v) : null

    const withInq = rows.filter((r) => r.inquiryTotal > 0)
    const avgConv =
      withInq.length > 0
        ? withInq.reduce((s, r) => s + r.conversionPercent, 0) / withInq.length
        : 0
    const responseIndex = round1(clamp(3 + avgConv / 40, 0, 5))

    const top = rows[0] ?? null

    return {
      globalQualityRatePercent: globalQuality,
      avgInquiryToCloseDays: avgDays,
      responseIndex,
      topPerformer: top
    }
  }

  public static async getPerformanceMatrix(): Promise<SupplierPerformanceMatrixResponse> {
    const rows = await SupplierInsightsService.buildPerformanceRows()
    const snapshot = await SupplierInsightsService.getGlobalSnapshot(rows)
    const top = rows.slice(0, 12)

    const radarNames = rows.slice(0, 2)
    const radarSuppliers = [
      { name: radarNames[0]?.name ?? '—', color: 'primary' as const },
      { name: radarNames[1]?.name ?? '—', color: 'tertiary' as const }
    ]

    const axis = (
      r: SupplierPerformanceRow | undefined
    ): { quality: number; speed: number; cost: number; service: number; reliability: number } => {
      if (!r) {
        return { quality: 0, speed: 0, cost: 0, service: 0, reliability: 0 }
      }
      const speed = clamp(100 - Math.min(r.avgCloseDays ?? 30, 30) * 3.33, 0, 100)
      const cost = clamp(r.conversionPercent * 1.2, 0, 100)
      const service = clamp(r.avgFabricViews * 2, 0, 100)
      const reliability = r.qualityRatePercent
      const quality = r.compositeScore
      return {
        quality: round1(quality),
        speed: round1(speed),
        cost: round1(cost),
        service: round1(service),
        reliability: round1(reliability)
      }
    }

    const a = axis(radarNames[0])
    const b = axis(radarNames[1])

    const radarAxes = [
      { label: 'QUALITY', a: a.quality, b: b.quality },
      { label: 'SPEED', a: a.speed, b: b.speed },
      { label: 'COST', a: a.cost, b: b.cost },
      { label: 'SERVICE', a: a.service, b: b.service },
      { label: 'RELIABILITY', a: a.reliability, b: b.reliability }
    ]

    const heatmapSuppliers = rows.slice(0, 6)
    const supplierLabels = heatmapSuppliers.map((r) => r.name)

    const since = new Date()
    since.setUTCDate(since.getUTCDate() - 70)

    const db = getDb()
    const activityRows =
      heatmapSuppliers.length > 0
        ? await db
            .select({
              supplierId: fabrics.supplierId,
              createdAt: leads.createdAt
            })
            .from(leads)
            .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
            .where(
              and(
                isNull(leads.deletedAt),
                gte(leads.createdAt, since),
                inArray(
                  fabrics.supplierId,
                  heatmapSuppliers.map((s) => s.supplierId)
                )
              )
            )
        : []

    const numWeeks = 10
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const weekLabels = Array.from({ length: numWeeks }, (_, i) => {
      const w = numWeeks - 1 - i
      return w === 0 ? 'Now' : `−${w}w`
    })

    const bucket = (d: Date): number => {
      const diff = now - d.getTime()
      const idx = Math.floor(diff / weekMs)
      return clamp(idx, 0, numWeeks - 1)
    }

    const grid: number[][] = heatmapSuppliers.map(() => Array(numWeeks).fill(0))
    for (const r of activityRows) {
      const si = heatmapSuppliers.findIndex((x) => x.supplierId === r.supplierId)
      if (si < 0) continue
      const bi = bucket(r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt))
      const gRow = grid[si]
      if (gRow) gRow[bi] = (gRow[bi] ?? 0) + 1
    }

    let maxC = 0
    for (const row of grid) {
      for (const c of row) maxC = Math.max(maxC, c)
    }
    const cells = grid.map((row) =>
      row.map((c) => (maxC > 0 ? Math.round((c / maxC) * 100) : 0))
    )

    return {
      snapshot,
      radarSuppliers,
      radarAxes,
      rows: top,
      heatmap: {
        weekLabels,
        supplierLabels,
        cells,
        footnote:
          'Intensity reflects marketplace inquiry volume routed through each supplier’s catalog (last 10 weeks).'
      },
      generatedAt: new Date().toISOString()
    }
  }

  public static async getScorecard(variant: 'executive' | 'benchmark'): Promise<SupplierScorecardResponse> {
    const rows = await SupplierInsightsService.buildPerformanceRows()
    const snapshot = await SupplierInsightsService.getGlobalSnapshot(rows)
    const top = rows[0]

    const scoreBreakdown = top
      ? [
          { label: 'Catalog quality', value: round1(top.qualityRatePercent) },
          { label: 'Inquiry conversion', value: round1(top.conversionPercent) },
          { label: 'Engagement (views)', value: round1(clamp(top.avgFabricViews * 2, 0, 100)) },
          { label: 'Composite', value: round1(top.compositeScore) },
          { label: 'Verification', value: top.verified ? 100 : 40 }
        ]
      : [
          { label: 'Catalog quality', value: 0 },
          { label: 'Inquiry conversion', value: 0 },
          { label: 'Engagement (views)', value: 0 },
          { label: 'Composite', value: 0 },
          { label: 'Verification', value: 0 }
        ]

    return {
      variant,
      snapshot,
      rows: rows.slice(0, 15),
      scoreBreakdown,
      generatedAt: new Date().toISOString()
    }
  }

  public static async getPayouts(params: {
    page: number
    limit: number
    q?: string | null
  }): Promise<SupplierPayoutsResponse> {
    const db = getDb()
    const commissionPct = await getAssumedCommissionPercent()
    const rate = commissionPct / 100

    const offset = (params.page - 1) * params.limit
    const search = params.q?.trim()
    const searchWhere = search
      ? or(
          ilike(suppliers.name, `%${search}%`),
          ilike(bulkOrders.orderReference, `%${search}%`),
          ilike(bulkOrders.buyerCompanyName, `%${search}%`)
        )
      : undefined

    const base = and(isNull(bulkOrders.deletedAt), isNull(suppliers.deletedAt))
    const where = and(base, searchWhere)

    const [totalRow] = await db
      .select({ c: count() })
      .from(bulkOrders)
      .innerJoin(suppliers, eq(bulkOrders.supplierId, suppliers.id))
      .where(where)
    const total = totalRow?.c ?? 0

    const rows = await db
      .select({
        id: bulkOrders.id,
        orderReference: bulkOrders.orderReference,
        supplierId: bulkOrders.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        country: suppliers.country,
        city: suppliers.city,
        logoUrl: suppliers.logoUrl,
        estimatedValueUsd: bulkOrders.estimatedValueUsd,
        status: bulkOrders.status,
        orderedAt: bulkOrders.orderedAt
      })
      .from(bulkOrders)
      .innerJoin(suppliers, eq(bulkOrders.supplierId, suppliers.id))
      .where(where)
      .orderBy(desc(bulkOrders.orderedAt))
      .limit(params.limit)
      .offset(offset)

    const mapStatus = (s: string): SupplierPayoutStatus => {
      if (s === 'ON_HOLD') return 'on_hold'
      if (s === 'DELIVERED') return 'completed'
      return 'processing'
    }

    const items: SupplierPayoutRow[] = rows.map((r) => {
      const gross = toNum(r.estimatedValueUsd?.toString() ?? null)
      const g = gross ?? 0
      const commissionUsd = g * rate
      const supplierShare = g - commissionUsd
      return {
        id: r.id,
        orderReference: r.orderReference,
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        supplierSlug: r.supplierSlug,
        country: r.country,
        city: r.city ?? null,
        logoUrl: r.logoUrl ?? null,
        orderValueUsd: gross != null ? gross.toFixed(2) : null,
        commissionUsd: g > 0 ? commissionUsd.toFixed(2) : null,
        supplierShareUsd: g > 0 ? supplierShare.toFixed(2) : null,
        commissionPercent: commissionPct,
        bulkStatus: r.status,
        payoutStatus: mapStatus(r.status),
        orderedAt:
          r.orderedAt instanceof Date ? r.orderedAt.toISOString() : String(r.orderedAt)
      }
    })

    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)

    const pendingRows = await db
      .select({ v: bulkOrders.estimatedValueUsd })
      .from(bulkOrders)
      .where(
        and(
          isNull(bulkOrders.deletedAt),
          inArray(bulkOrders.status, ['PROCESSING', 'IN_TRANSIT'])
        )
      )
    let pendingUsd = 0
    for (const p of pendingRows) {
      pendingUsd += toNum(p.v?.toString() ?? null) ?? 0
    }

    const completedRows = await db
      .select({ v: bulkOrders.estimatedValueUsd })
      .from(bulkOrders)
      .where(
        and(
          isNull(bulkOrders.deletedAt),
          eq(bulkOrders.status, 'DELIVERED'),
          gte(bulkOrders.orderedAt, monthStart)
        )
      )
    let completedMtd = 0
    for (const c of completedRows) {
      completedMtd += toNum(c.v?.toString() ?? null) ?? 0
    }

    const [holdRow] = await db
      .select({ c: count() })
      .from(bulkOrders)
      .where(and(isNull(bulkOrders.deletedAt), eq(bulkOrders.status, 'ON_HOLD')))

    const summary: SupplierPayoutsSummary = {
      pendingUsd: pendingUsd.toFixed(2),
      completedMtdUsd: completedMtd.toFixed(2),
      onHoldCount: holdRow?.c ?? 0,
      nextScheduledNote:
        'Bulk settlement runs follow your finance calendar; connect ACH details in supplier profiles when available.',
      assumedCommissionPercent: commissionPct
    }

    return { summary, items, total }
  }

  public static async getOnboarding(): Promise<SupplierOnboardingResponse> {
    const db = getDb()
    const rows = await db
      .select({
        id: suppliers.id,
        description: suppliers.description,
        establishedYear: suppliers.establishedYear,
        verified: suppliers.verified
      })
      .from(suppliers)
      .where(isNull(suppliers.deletedAt))

    const counts = await db
      .select({
        supplierId: fabrics.supplierId,
        c: count()
      })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .groupBy(fabrics.supplierId)

    const approvedMap = new Map(counts.map((x) => [x.supplierId, x.c]))

    let basic = 0
    let production = 0
    let verification = 0
    let catalog = 0
    let totalScore = 0

    for (const s of rows) {
      const stepBasic = true
      const stepProd = Boolean(s.description && s.description.trim().length > 0 && s.establishedYear != null)
      const stepVer = s.verified
      const stepCat = (approvedMap.get(s.id) ?? 0) >= 1
      if (stepBasic) basic += 1
      if (stepProd) production += 1
      if (stepVer) verification += 1
      if (stepCat) catalog += 1
      const score =
        (stepBasic ? 25 : 0) + (stepProd ? 25 : 0) + (stepVer ? 25 : 0) + (stepCat ? 25 : 0)
      totalScore += score
    }

    const n = rows.length || 1
    const steps: SupplierOnboardingStepStat[] = [
      { key: 'basic', labelKey: 'stepBasic', completedCount: basic },
      { key: 'production', labelKey: 'stepProduction', completedCount: production },
      { key: 'verification', labelKey: 'stepVerification', completedCount: verification },
      { key: 'catalog', labelKey: 'stepCatalog', completedCount: catalog }
    ]

    return {
      steps,
      averageCompletionPercent: Math.round(totalScore / n),
      suppliersInProgress: rows.filter((s) => {
        const approved = approvedMap.get(s.id) ?? 0
        return !s.verified || approved < 1 || !s.description
      }).length
    }
  }

  public static async getInquiries(params: {
    supplierId: number
    page: number
    limit: number
  }): Promise<SupplierInquiriesResponse> {
    const db = getDb()
    const [sup] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        slug: suppliers.slug,
        country: suppliers.country,
        city: suppliers.city,
        verified: suppliers.verified
      })
      .from(suppliers)
      .where(and(eq(suppliers.id, params.supplierId), isNull(suppliers.deletedAt)))
      .limit(1)

    if (!sup) throw new NotFoundError('Supplier not found')

    const offset = (params.page - 1) * params.limit

    const where = and(
      isNull(leads.deletedAt),
      isNotNull(leads.fabricId),
      eq(fabrics.supplierId, params.supplierId)
    )

    const [totalRow] = await db
      .select({ c: count() })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(where)

    const [pendingRow] = await db
      .select({ c: count() })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(
        and(
          isNull(leads.deletedAt),
          isNotNull(leads.fabricId),
          eq(fabrics.supplierId, params.supplierId),
          inArray(leads.status, ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING'])
        )
      )

    const leadRows = await db
      .select({
        id: leads.id,
        status: leads.status,
        companyName: leads.companyName,
        contactName: leads.contactName,
        email: leads.email,
        source: leads.source,
        inquiryText: leads.inquiryText,
        titleRu: fabrics.titleRu,
        slug: fabrics.slug,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      })
      .from(leads)
      .innerJoin(fabrics, eq(leads.fabricId, fabrics.id))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(params.limit)
      .offset(offset)

    const items: SupplierInquiryListItem[] = leadRows.map((r) => ({
      leadId: r.id,
      status: r.status,
      companyName: r.companyName,
      contactName: r.contactName,
      email: r.email,
      source: r.source,
      inquiryText: r.inquiryText,
      inquiryExcerpt: r.inquiryText.length > 160 ? `${r.inquiryText.slice(0, 157)}…` : r.inquiryText,
      fabricTitle: r.titleRu,
      fabricSlug: r.slug,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)
    }))

    return {
      supplier: {
        id: sup.id,
        name: sup.name,
        slug: sup.slug,
        country: sup.country,
        city: sup.city ?? null,
        verified: sup.verified
      },
      items,
      pendingCount: pendingRow?.c ?? 0,
      total: totalRow?.c ?? 0
    }
  }
}
