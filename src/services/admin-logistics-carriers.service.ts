import { and, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { logisticsCarrierLanes, logisticsCarriers } from '@/db/schema/logistics.schema'
import type {
  AdminLogisticsCarriersQuery,
  AdminLogisticsCarriersOverviewResponse,
  AdminLogisticsCarrierRow
} from '@/types/admin-logistics-carriers.types'

function toNumber(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export class AdminLogisticsCarriersService {
  public static async listOverview(query: AdminLogisticsCarriersQuery): Promise<{ data: AdminLogisticsCarriersOverviewResponse; total: number }> {
    const db = getDb()
    const offset = (query.page - 1) * query.limit

    const baseWhere = and(isNull(logisticsCarriers.deletedAt))
    const regionWhere = query.region ? eq(logisticsCarriers.regionTag, query.region) : undefined
    const serviceWhere = query.serviceType ? eq(logisticsCarriers.serviceType, query.serviceType) : undefined
    const healthWhere = query.health ? eq(logisticsCarriers.health, query.health) : undefined
    const searchWhere = query.q
      ? or(
          ilike(logisticsCarriers.name, `%${query.q}%`),
          ilike(logisticsCarriers.carrierCode, `%${query.q}%`)
        )
      : undefined

    const where = and(baseWhere, regionWhere, serviceWhere, healthWhere, searchWhere)

    const totalRows = await db.select({ total: count() }).from(logisticsCarriers).where(where)
    const total = totalRows[0]?.total ?? 0

    const carrierRows = await db
      .select({
        id: logisticsCarriers.id,
        name: logisticsCarriers.name,
        carrierCode: logisticsCarriers.carrierCode,
        logoUrl: logisticsCarriers.logoUrl,
        regionTag: logisticsCarriers.regionTag,
        serviceType: logisticsCarriers.serviceType,
        health: logisticsCarriers.health,
        avgTransitDays: logisticsCarriers.avgTransitDays,
        reliabilityPercent: logisticsCarriers.reliabilityPercent
      })
      .from(logisticsCarriers)
      .where(where)
      .orderBy(desc(logisticsCarriers.updatedAt))
      .limit(query.limit)
      .offset(offset)

    const carrierIds = carrierRows.map((c) => c.id)

    const laneRows =
      carrierIds.length > 0
        ? await db
            .select({
              carrierId: logisticsCarrierLanes.carrierId,
              laneCode: logisticsCarrierLanes.laneCode
            })
            .from(logisticsCarrierLanes)
            .where(and(isNull(logisticsCarrierLanes.deletedAt), sql`${logisticsCarrierLanes.carrierId} = any(${carrierIds})`))
        : []

    const lanesByCarrier = new Map<number, { laneCode: string }[]>()
    for (const l of laneRows) {
      const arr = lanesByCarrier.get(l.carrierId) ?? []
      arr.push({ laneCode: l.laneCode })
      lanesByCarrier.set(l.carrierId, arr)
    }

    const items: AdminLogisticsCarrierRow[] = carrierRows.map((c) => ({
      id: c.id,
      name: c.name,
      carrierCode: c.carrierCode,
      logoUrl: c.logoUrl ?? null,
      regionTag: c.regionTag ?? null,
      serviceType: c.serviceType,
      health: c.health,
      avgTransitDays: toNumber(String(c.avgTransitDays)),
      reliabilityPercent: toNumber(String(c.reliabilityPercent)),
      laneTags: (lanesByCarrier.get(c.id) ?? []).slice(0, 2)
    }))

    const [activeCarriersRows, activeLanesRows, avgTransitRows, avgReliabilityRows] = await Promise.all([
      db.select({ total: count() }).from(logisticsCarriers).where(and(isNull(logisticsCarriers.deletedAt))),
      db.select({ total: count() }).from(logisticsCarrierLanes).where(and(isNull(logisticsCarrierLanes.deletedAt))),
      db
        .select({ avgTransit: sql<string>`coalesce(avg(${logisticsCarriers.avgTransitDays}), '0')` })
        .from(logisticsCarriers)
        .where(and(isNull(logisticsCarriers.deletedAt))),
      db
        .select({ avgReliability: sql<string>`coalesce(avg(${logisticsCarriers.reliabilityPercent}), '0')` })
        .from(logisticsCarriers)
        .where(and(isNull(logisticsCarriers.deletedAt)))
    ])

    const activeCarriers = activeCarriersRows[0]?.total ?? 0
    const activeLanes = activeLanesRows[0]?.total ?? 0
    const avgTransitDays = toNumber(avgTransitRows[0]?.avgTransit ?? '0')
    const globalHealthPercent = toNumber(avgReliabilityRows[0]?.avgReliability ?? '0')

    return {
      total,
      data: {
        stats: {
          activeCarriers,
          globalHealthPercent,
          avgTransitDays,
          activeLanes
        },
        items
      }
    }
  }
}

