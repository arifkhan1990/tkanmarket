import { and, eq, inArray, isNull } from 'drizzle-orm'
import { desc } from 'drizzle-orm'
import { count } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type { AdminFabricQueueItem, AdminFabricQueueResult } from '@/types/admin-fabric.types'

export type FabricQueueStatus = 'raw_scraped' | 'ai_processing' | 'ai_processed' | 'approved' | 'rejected'

const defaultStatuses: FabricQueueStatus[] = ['ai_processing', 'ai_processed', 'raw_scraped']

export class FabricAdminService {
  public static async list(params: { page: number; limit: number; status?: FabricQueueStatus }): Promise<AdminFabricQueueResult> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const where = params.status
      ? and(isNull(fabrics.deletedAt), eq(fabrics.status, params.status))
      : and(isNull(fabrics.deletedAt), inArray(fabrics.status, defaultStatuses))

    const totalRows = await db.select({ total: count() }).from(fabrics).where(where)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        titleRu: fabrics.titleRu,
        status: fabrics.status,
        supplierName: suppliers.name,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(where)
      .orderBy(desc(fabrics.createdAt))
      .limit(params.limit)
      .offset(offset)

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        titleRu: r.titleRu,
        status: r.status,
        supplierName: r.supplierName,
        gsm: r.gsm,
        widthCm: r.widthCm,
        priceUsd: r.priceUsd ? String(r.priceUsd) : null,
        moq: r.moq
      })),
      total
    }
  }

  public static async approveFabric(id: number) {
    const db = getDb()
    await db.update(fabrics).set({ status: 'approved' }).where(eq(fabrics.id, id))
  }

  public static async rejectFabric(id: number) {
    const db = getDb()
    await db.update(fabrics).set({ status: 'rejected' }).where(eq(fabrics.id, id))
  }
}

