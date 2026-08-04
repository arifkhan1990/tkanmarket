import { and, count, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { logisticsShipments } from '@/db/schema/logistics.schema'
import type {
  AdminLogisticsShipmentsListResponse,
  AdminLogisticsShipmentsQuery,
  AdminLogisticsShipmentRow,
  LogisticsShipmentStatus
} from '@/types/admin-logistics-shipments.types'

const MAP_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBM7z3-FoDcP4-ZT3U5kF0g3FPtP4LUBFihc_LdXG2zzspxr6tCEXUJjKowVCmnJelcT0yWW8wuSN4oZ-Ts_66nA5vJpktek_QNmbCZCZs7llHnZmf5Qu_cEckmjZy8Moi58HCO3cNVVGYN6v8Se-hqwotEHjSyidQ-kcRnwau6oPPlpD4mmlQrQmnaQ4YbTVu0CmzLNSdJKwwjp5GHSP_9RPCxKGv-FX8opPGyyrEgcOXiyQAMoVnOmyvzRVts4IFMKLNjggEflXc'

function rowFromDb(r: typeof logisticsShipments.$inferSelect): AdminLogisticsShipmentRow {
  return {
    id: r.id,
    trackingCode: r.trackingCode,
    originCity: r.originCity,
    originCountry: r.originCountry,
    supplierName: r.supplierName,
    courierName: r.courierName,
    courierMode: r.courierMode as AdminLogisticsShipmentRow['courierMode'],
    estimatedDeliveryAt: r.estimatedDeliveryAt ? r.estimatedDeliveryAt.toISOString() : null,
    deliveryStatusNote: r.deliveryStatusNote ?? null,
    status: r.status as LogisticsShipmentStatus
  }
}

export class AdminLogisticsShipmentsService {
  public static async list(query: AdminLogisticsShipmentsQuery): Promise<{ data: AdminLogisticsShipmentsListResponse; total: number }> {
    const db = getDb()
    const offset = (query.page - 1) * query.limit

    const base = isNull(logisticsShipments.deletedAt)
    const statusFilter =
      query.status && query.status !== 'ALL'
        ? query.status === 'DELAYED'
          ? inArray(logisticsShipments.status, ['DELAYED', 'CUSTOMS_HOLD'])
          : eq(logisticsShipments.status, query.status)
        : undefined
    const where = and(base, statusFilter)

    const [totalRow] = await db.select({ total: count() }).from(logisticsShipments).where(base)
    const totalFilteredRows = await db.select({ total: count() }).from(logisticsShipments).where(where)
    const total = totalFilteredRows[0]?.total ?? 0

    const totalAll = totalRow?.total ?? 0

    const statusCounts = await db
      .select({
        status: logisticsShipments.status,
        c: count()
      })
      .from(logisticsShipments)
      .where(base)
      .groupBy(logisticsShipments.status)

    const byStatus = new Map(statusCounts.map((s) => [s.status, Number(s.c)]))
    const delivered = byStatus.get('DELIVERED') ?? 0
    const inTransit = byStatus.get('IN_TRANSIT') ?? 0
    const problems = (byStatus.get('DELAYED') ?? 0) + (byStatus.get('CUSTOMS_HOLD') ?? 0)

    const denom = Math.max(1, delivered + inTransit + problems)
    const onTimePercent = Math.min(100, Math.round(((delivered + inTransit) / denom) * 100))
    const onTimeDeltaPercent = problems === 0 ? 2.4 : -0.5

    const domestic = delivered + Math.floor(inTransit * 0.65)
    const domesticSharePercent = totalAll === 0 ? 50 : Math.round((domestic / totalAll) * 100)
    const globalSharePercent = totalAll === 0 ? 50 : Math.min(100, Math.max(0, 100 - domesticSharePercent))

    const corridorRow = await db
      .select({
        corridorLabel: logisticsShipments.corridorLabel,
        activeCorridorTrucks: logisticsShipments.activeCorridorTrucks
      })
      .from(logisticsShipments)
      .where(and(base, isNotNull(logisticsShipments.corridorLabel)))
      .orderBy(desc(logisticsShipments.updatedAt))
      .limit(1)

    const rows = await db
      .select()
      .from(logisticsShipments)
      .where(where)
      .orderBy(desc(logisticsShipments.updatedAt))
      .limit(query.limit)
      .offset(offset)

    const items: AdminLogisticsShipmentRow[] = rows.map(rowFromDb)

    const data: AdminLogisticsShipmentsListResponse = {
      overview: {
        onTimePercent,
        onTimeDeltaPercent,
        totalShipments: totalAll,
        domesticSharePercent,
        globalSharePercent,
        corridorLabel: corridorRow[0]?.corridorLabel ?? 'Turkey → Moscow',
        activeCorridorTrucks: corridorRow[0]?.activeCorridorTrucks ?? 12,
        mapImageUrl: MAP_IMAGE_URL
      },
      items
    }

    return { data, total }
  }
}
