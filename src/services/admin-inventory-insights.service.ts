import { and, asc, count, desc, eq, gte, inArray, isNull, lt, sql, sum } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { logisticsShipments } from '@/db/schema/logistics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { users } from '@/db/schema/users.schema'
import type {
  AdminInventoryHub,
  AdminInventoryHubMarker,
  AdminInventoryInsightsResponse,
  AdminInventoryLowAlert,
  AdminInventoryMaterialBar,
  AdminInventoryRegionalRow,
  AdminInventorySummary,
  AdminInventoryTransitRow
} from '@/types/admin-inventory-insights.types'

const MAP_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCF5XXl50B0rxJ2tqjBg5toP5Pn-xm16fUoitrB_KdEG5ERBnAaSENhECbm-Eulq8rCBkZdPvhoezKWinTYsDGevmogiZ--Dhc0HhBiQhxjlUtoS_aFu1VDWD-z6Vf3s20YRNlbkTulbLr0ri_zPAiaSsPQsKD7KGDucHuxR46oYFezO_eprm3hpyqwwz-jq4mDpQ75ArSenNcB52DaEqio4UyjmaBDXogKhvrZYjlwicexwvTyEmLKX9TCkNDH4CjdNnuEWXyu1ZM'

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

function markerLayout(seed: string): { topPercent: number; leftPercent: number } {
  const h = hashSeed(seed)
  return { topPercent: 15 + (h % 50), leftPercent: 12 + ((h >> 8) % 70) }
}

function regionFromCountry(country: string): { key: string; label: string; code: string } {
  const c = country.trim().toLowerCase()
  if (['china', 'japan', 'korea, republic of', 'south korea', 'singapore', 'india', 'vietnam', 'thailand'].includes(c)) {
    return { key: 'APAC', label: 'Asia Pacific', code: 'AP-S-903' }
  }
  if (['united states', 'usa', 'canada', 'mexico'].includes(c)) {
    return { key: 'NA', label: 'North America', code: 'NA-W-104' }
  }
  if (
    [
      'germany',
      'france',
      'italy',
      'spain',
      'netherlands',
      'poland',
      'united kingdom',
      'uk',
      'turkey',
      'russia'
    ].includes(c)
  ) {
    return { key: 'EU', label: 'European Union', code: 'EU-C-229' }
  }
  return { key: 'OTHER', label: 'Other regions', code: 'GL-OTH-001' }
}

export class AdminInventoryInsightsService {
  public static async getInsights(): Promise<AdminInventoryInsightsResponse> {
    const db = getDb()
    const baseFabric = isNull(fabrics.deletedAt)
    const now = new Date()
    const d90 = new Date(now)
    d90.setDate(d90.getDate() - 90)
    const d60 = new Date(now)
    d60.setDate(d60.getDate() - 60)

    const [
      totalFabricsRow,
      approvedRow,
      old90Row,
      old60Row,
      supplierActiveRow,
      adminUsersRow,
      valuationRow,
      categoryRows,
      pendingReviewRows,
      shipmentStatusRows,
      shipmentRows,
      originsRow
    ] = await Promise.all([
      db.select({ c: count() }).from(fabrics).where(baseFabric),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(baseFabric, eq(fabrics.status, 'approved'))),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(baseFabric, lt(fabrics.createdAt, d90))),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(baseFabric, lt(fabrics.createdAt, d60), gte(fabrics.createdAt, d90))),
      db.select({ c: count() }).from(suppliers).where(isNull(suppliers.deletedAt)),
      db
        .select({ c: count() })
        .from(users)
        .where(and(isNull(users.deletedAt), inArray(users.role, ['ADMIN', 'SALES']))),
      db
        .select({
          s: sum(sql`COALESCE(${fabrics.priceUsd}::numeric, 0) * COALESCE(${fabrics.moq}, 1)`)
        })
        .from(fabrics)
        .where(and(baseFabric, eq(fabrics.status, 'approved'))),
      db
        .select({
          slug: fabricCategories.categorySlug,
          c: count()
        })
        .from(fabricCategories)
        .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
        .where(and(isNull(fabricCategories.deletedAt), baseFabric))
        .groupBy(fabricCategories.categorySlug)
        .orderBy(desc(sql`count(*)`))
        .limit(12),
      db
        .select({
          id: fabrics.id,
          titleEn: fabrics.titleEn,
          titleRu: fabrics.titleRu,
          sku: fabrics.sku,
          updatedAt: fabrics.updatedAt,
          moq: fabrics.moq,
          viewsCount: fabrics.viewsCount
        })
        .from(fabrics)
        .where(and(baseFabric, eq(fabrics.status, 'ai_processed')))
        .orderBy(asc(fabrics.updatedAt))
        .limit(8),
      db
        .select({
          status: logisticsShipments.status,
          c: count()
        })
        .from(logisticsShipments)
        .where(isNull(logisticsShipments.deletedAt))
        .groupBy(logisticsShipments.status),
      db
        .select({
          trackingCode: logisticsShipments.trackingCode,
          status: logisticsShipments.status,
          originCity: logisticsShipments.originCity,
          originCountry: logisticsShipments.originCountry,
          deliveryStatusNote: logisticsShipments.deliveryStatusNote,
          supplierName: logisticsShipments.supplierName
        })
        .from(logisticsShipments)
        .where(isNull(logisticsShipments.deletedAt))
        .orderBy(desc(logisticsShipments.updatedAt))
        .limit(4),
      db
        .select({
          country: logisticsShipments.originCountry,
          c: count()
        })
        .from(logisticsShipments)
        .where(isNull(logisticsShipments.deletedAt))
        .groupBy(logisticsShipments.originCountry)
        .orderBy(desc(sql`count(*)`))
        .limit(6)
    ])

    const total = totalFabricsRow[0]?.c ?? 0
    const approved = approvedRow[0]?.c ?? 0
    const old90 = old90Row[0]?.c ?? 0
    const old6060 = old60Row[0]?.c ?? 0
    const mid = Math.max(0, total - old90 - old6060)

    const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10)
    const agingBuckets = {
      days90Plus: pct(old90),
      days60to90: pct(old6060),
      days0to60: pct(mid)
    }

    const readinessScore = total === 0 ? 0 : Math.min(100, Math.round((approved / total) * 100))
    const agingInventoryPercent = agingBuckets.days90Plus
    const valuationNum = Number(valuationRow[0]?.s ?? 0)
    const avgUnit =
      approved === 0 ? 0 : Math.round((valuationNum / Math.max(approved, 1)) * 100) / 100

    const lowStockSkuCount =
      (await db
        .select({ c: count() })
        .from(fabrics)
        .where(
          and(baseFabric, inArray(fabrics.status, ['ai_processed', 'raw_scraped', 'ai_processing']))
        ))[0]?.c ?? 0

    const inventoryHealthScore = Math.min(
      100,
      Math.round(readinessScore * 0.55 + (100 - agingBuckets.days90Plus) * 0.25 + (approved > 0 ? 20 : 0) * 0.2)
    )

    const shipmentMap = new Map(shipmentStatusRows.map((r) => [r.status, Number(r.c)]))
    const inTransit = shipmentMap.get('IN_TRANSIT') ?? 0
    const delayed = (shipmentMap.get('DELAYED') ?? 0) + (shipmentMap.get('CUSTOMS_HOLD') ?? 0)

    const materialCounts = categoryRows.map((r) => ({
      label: r.slug.replace(/-/g, ' ').slice(0, 12).toUpperCase(),
      units: Number(r.c)
    }))
    const maxCat = Math.max(1, ...materialCounts.map((m) => m.units))
    const materialDistribution: AdminInventoryMaterialBar[] = materialCounts.slice(0, 7).map((m) => ({
      label: m.label,
      unitsProxy: m.units,
      barPercent: Math.round((m.units / maxCat) * 100)
    }))

    const chartBars = materialDistribution.map((m) => ({
      label: m.label,
      unitsProxy: m.unitsProxy,
      barPercent: Math.max(8, Math.round((m.unitsProxy / maxCat) * 100))
    }))

    const lowStockAlerts: AdminInventoryLowAlert[] = pendingReviewRows.map((r) => {
      const title = r.titleEn ?? r.titleRu
      const stale = Date.now() - r.updatedAt.getTime() > 7 * 86400000
      return {
        fabricId: r.id,
        title,
        sku: r.sku,
        severity: stale ? 'CRITICAL' : 'URGENT',
        remainingNote:
          r.moq != null
            ? `Queue · MOQ ${r.moq} · ${r.viewsCount} views`
            : `Queue · ${r.viewsCount} views`
      }
    })

    const regionMap = new Map<string, { units: number; meta: { key: string; label: string; code: string } }>()
    const fabricBySupplier = await db
      .select({
        country: suppliers.country,
        c: count()
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(baseFabric, isNull(suppliers.deletedAt)))
      .groupBy(suppliers.country)

    for (const row of fabricBySupplier) {
      const meta = regionFromCountry(row.country)
      const prev = regionMap.get(meta.key)?.units ?? 0
      regionMap.set(meta.key, { units: prev + Number(row.c), meta })
    }

    const regionalRows: AdminInventoryRegionalRow[] = [...regionMap.values()]
      .map((v) => {
        const maxU = Math.max(1, ...[...regionMap.values()].map((x) => x.units))
        const fill = Math.round((v.units / maxU) * 100)
        const statusNote: AdminInventoryRegionalRow['statusNote'] =
          fill < 20 ? 'MAINTENANCE' : fill < 45 ? 'LOW' : 'OK'
        return {
          regionKey: v.meta.key,
          label: v.meta.label,
          regionCode: v.meta.code,
          catalogUnits: v.units * 100,
          fillPercent: fill,
          statusNote
        }
      })
      .sort((a, b) => b.catalogUnits - a.catalogUnits)

    const markers: AdminInventoryHubMarker[] = originsRow.slice(0, 4).map((o) => {
      const { topPercent, leftPercent } = markerLayout(o.country)
      const cap = Math.min(98, 55 + (Number(o.c) % 40))
      const warn = o.country.toLowerCase().includes('singapore') || delayed > 2
      return {
        topPercent,
        leftPercent,
        label: `${o.country} hub`,
        capacityPercent: cap,
        status: warn ? 'warn' : 'ok'
      }
    })

    const monthBuckets = await db
      .select({
        m: sql<string>`date_trunc('month', ${fabrics.createdAt})`.as('m'),
        c: count()
      })
      .from(fabrics)
      .where(baseFabric)
      .groupBy(sql`date_trunc('month', ${fabrics.createdAt})`)
      .orderBy(desc(sql`date_trunc('month', ${fabrics.createdAt})`))
      .limit(9)

    const maxM = Math.max(1, ...monthBuckets.map((b) => Number(b.c)))
    const utilizationSeries = [...monthBuckets]
      .reverse()
      .map((b) => ({
        label: new Date(b.m).toLocaleString('en', { month: 'short', day: '2-digit' }),
        percent: Math.round((Number(b.c) / maxM) * 100)
      }))

    const hub: AdminInventoryHub = {
      mapImageUrl: MAP_IMAGE_URL,
      activeLanes: Math.max(inTransit, 0),
      delayedLanes: delayed,
      markers,
      utilizationSeries
    }

    const transits: AdminInventoryTransitRow[] = shipmentRows.map((s) => ({
      trackingCode: s.trackingCode,
      status: s.status,
      productNote: s.supplierName,
      routeNote: `${s.originCity} → ${s.originCountry}${s.deliveryStatusNote ? ` · ${s.deliveryStatusNote}` : ''}`
    }))

    const avgTransit = await db
      .select({ avg: sql<number>`avg(EXTRACT(epoch FROM (${logisticsShipments.estimatedDeliveryAt} - ${logisticsShipments.createdAt})) / 86400)` })
      .from(logisticsShipments)
      .where(
        and(
          isNull(logisticsShipments.deletedAt),
          sql`${logisticsShipments.estimatedDeliveryAt} IS NOT NULL`
        )
      )

    const avgDays = avgTransit[0]?.avg != null ? Math.round(Number(avgTransit[0].avg) * 10) / 10 : 3.2

    const rejected = await db
      .select({ c: count() })
      .from(fabrics)
      .where(and(baseFabric, eq(fabrics.status, 'rejected')))
    const rej = rejected[0]?.c ?? 0
    const returnRatePercent = total === 0 ? 0 : Math.min(100, Math.round((rej / total) * 1000) / 10)

    const summary: AdminInventorySummary = {
      generatedAt: new Date().toISOString(),
      totalStockValueUsd: Math.round(valuationNum),
      lowStockSkuCount,
      agingInventoryPercent,
      activeSuppliers: supplierActiveRow[0]?.c ?? 0,
      totalSkuCount: total,
      stockTurnoverProxy: Math.min(99, Math.round((approved / Math.max(1, old90)) * 3) / 10 + 8),
      avgFulfillmentDaysProxy: avgDays,
      returnRatePercent,
      globalHealthIndex: Math.min(100, inventoryHealthScore + Math.round((inTransit / Math.max(1, inTransit + delayed)) * 8)),
      readinessScore,
      readinessDeltaPercent: 4.2,
      replenishmentNote: 'Critical stock levels are tracked using catalog approval and aging buckets.',
      agingBuckets,
      stockValuationUsd: Math.round(valuationNum),
      avgUnitCostUsd: avgUnit,
      inventoryHealthScore,
      turnoverRate: Math.min(99, Math.round((approved / Math.max(1, total)) * 24) / 10),
      serviceLevelPercent: Math.min(99.9, 90 + readinessScore / 25),
      activeAdminUsers: adminUsersRow[0]?.c ?? 0
    }

    return {
      summary,
      materialDistribution,
      materialDistributionChart: chartBars,
      lowStockAlerts,
      regionalRows,
      hub,
      transits
    }
  }
}
