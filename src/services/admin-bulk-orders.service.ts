import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  inArray,
  sum
} from 'drizzle-orm'

import { getDb } from '@/db'
import { bulkOrders } from '@/db/schema/bulk-orders.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  AdminBulkOrderRow,
  AdminBulkOrdersBulkUpdatePayload,
  AdminBulkOrdersListResponse,
  AdminBulkOrdersQuery
} from '@/types/admin-bulk-orders.types'

function toNumber(value: string | null): number {
  if (value === null || value === undefined) return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

export class AdminBulkOrdersService {
  public static async list(query: AdminBulkOrdersQuery): Promise<{ data: AdminBulkOrdersListResponse; total: number }> {
    const db = getDb()
    const offset = (query.page - 1) * query.limit

    const baseWhere = isNull(bulkOrders.deletedAt)

    const statusWhere = query.status ? eq(bulkOrders.status, query.status) : undefined
    const tierWhere = query.supplierTier ? eq(bulkOrders.supplierTier, query.supplierTier) : undefined

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined
    const dateTo = query.dateTo ? new Date(query.dateTo) : undefined
    const fromWhere = dateFrom && !Number.isNaN(dateFrom.getTime()) ? gte(bulkOrders.orderedAt, dateFrom) : undefined
    const toWhere = dateTo && !Number.isNaN(dateTo.getTime()) ? lte(bulkOrders.orderedAt, dateTo) : undefined

    const searchWhere = query.q
      ? or(
          ilike(bulkOrders.orderReference, `%${query.q}%`),
          ilike(bulkOrders.buyerCompanyName, `%${query.q}%`),
          ilike(suppliers.name, `%${query.q}%`)
        )
      : undefined

    const where = and(baseWhere, statusWhere, tierWhere, fromWhere, toWhere, searchWhere)

    const totalRows = await db
      .select({ total: count() })
      .from(bulkOrders)
      .innerJoin(suppliers, eq(bulkOrders.supplierId, suppliers.id))
      .where(where)

    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: bulkOrders.id,
        orderReference: bulkOrders.orderReference,
        buyerCompanyName: bulkOrders.buyerCompanyName,
        supplierId: bulkOrders.supplierId,
        supplierName: suppliers.name,
        supplierTier: bulkOrders.supplierTier,
        totalMeters: bulkOrders.totalMeters,
        estimatedValueUsd: bulkOrders.estimatedValueUsd,
        status: bulkOrders.status,
        orderedAt: bulkOrders.orderedAt
      })
      .from(bulkOrders)
      .innerJoin(suppliers, eq(bulkOrders.supplierId, suppliers.id))
      .where(where)
      .orderBy(desc(bulkOrders.orderedAt))
      .limit(query.limit)
      .offset(offset)

    const items: AdminBulkOrderRow[] = rows.map((r) => ({
      id: r.id,
      orderReference: r.orderReference,
      buyerCompanyName: r.buyerCompanyName,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierTier: r.supplierTier,
      totalMeters: toNumber(String(r.totalMeters)),
      estimatedValueUsd: r.estimatedValueUsd === null ? null : toNumber(String(r.estimatedValueUsd)),
      status: r.status,
      orderedAt: r.orderedAt.toISOString()
    }))

    const todayStart = startOfUtcDay(new Date())
    const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const [dailyVolRows, inTransitRows, flaggedRows, pendingUsdRows] = await Promise.all([
      db
        .select({ vol: sum(bulkOrders.totalMeters) })
        .from(bulkOrders)
        .where(
          and(
            isNull(bulkOrders.deletedAt),
            gte(bulkOrders.orderedAt, todayStart),
            lte(bulkOrders.orderedAt, tomorrow)
          )
        ),
      db
        .select({ c: count() })
        .from(bulkOrders)
        .where(and(isNull(bulkOrders.deletedAt), eq(bulkOrders.status, 'IN_TRANSIT'))),
      db
        .select({ c: count() })
        .from(bulkOrders)
        .where(and(isNull(bulkOrders.deletedAt), eq(bulkOrders.status, 'ON_HOLD'))),
      db
        .select({ s: sum(bulkOrders.estimatedValueUsd) })
        .from(bulkOrders)
        .where(
          and(
            isNull(bulkOrders.deletedAt),
            inArray(bulkOrders.status, ['PROCESSING', 'IN_TRANSIT', 'ON_HOLD'])
          )
        )
    ])

    const dailyVolumeMeters = toNumber(String(dailyVolRows[0]?.vol ?? 0))
    const inTransitOrders = inTransitRows[0]?.c ?? 0
    const flaggedOrders = flaggedRows[0]?.c ?? 0
    const pendingSettlementUsd = toNumber(String(pendingUsdRows[0]?.s ?? 0))

    return {
      total,
      data: {
        items,
        metrics: {
          dailyVolumeMeters,
          inTransitOrders,
          flaggedOrders,
          pendingSettlementUsd
        }
      }
    }
  }

  public static async bulkUpdateStatus(payload: AdminBulkOrdersBulkUpdatePayload): Promise<void> {
    const db = getDb()
    await db
      .update(bulkOrders)
      .set({
        status: payload.status,
        updatedAt: new Date()
      })
      .where(and(isNull(bulkOrders.deletedAt), inArray(bulkOrders.id, payload.ids)))
  }
}
