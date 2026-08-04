import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { filterFabricGalleryImageUrls } from '@/lib/fabric-gallery-image-urls'
import type { ProductReviewQueueResponse, ProductReviewStatusFilter } from '@/types/admin-product-review-queue.types'

function safePage(page: number): number {
  return page >= 1 && Number.isFinite(page) ? Math.floor(page) : 1
}

function safeLimit(limit: number): number {
  const l = Math.floor(limit)
  if (l < 1) return 12
  if (l > 48) return 48
  return l
}

const PIPELINE_STATUSES = ['raw_scraped', 'ai_processing', 'ai_processed'] as const

export class AdminProductReviewQueueService {
  public static async list(params: {
    page: number
    limit: number
    filter: ProductReviewStatusFilter
  }): Promise<ProductReviewQueueResponse> {
    const db = getDb()
    const page = safePage(params.page)
    const limit = safeLimit(params.limit)
    const offset = (page - 1) * limit

    const statusCond =
      params.filter === 'pending'
        ? eq(fabrics.status, 'ai_processed')
        : params.filter === 'processing'
          ? eq(fabrics.status, 'ai_processing')
          : inArray(fabrics.status, [...PIPELINE_STATUSES])

    const whereClause = and(isNull(fabrics.deletedAt), statusCond)
    const pipelineBase = isNull(fabrics.deletedAt)

    const [totalRows, countReady, countProcessing, countPipeline] = await Promise.all([
      db.select({ c: count() }).from(fabrics).where(whereClause),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(pipelineBase, eq(fabrics.status, 'ai_processed'))),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(pipelineBase, eq(fabrics.status, 'ai_processing'))),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(and(pipelineBase, inArray(fabrics.status, [...PIPELINE_STATUSES])))
    ])
    const total = Number(totalRows[0]?.c ?? 0)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

    const rows = await db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        sku: fabrics.sku,
        status: fabrics.status,
        updatedAt: fabrics.updatedAt,
        images: fabrics.images,
        supplierName: suppliers.name
      })
      .from(fabrics)
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(fabrics.updatedAt))
      .limit(limit)
      .offset(offset)

    const items = rows.map((r) => {
      const gallery = filterFabricGalleryImageUrls(r.images ?? undefined)
      return {
        id: r.id,
        title: (r.titleEn ?? r.titleRu ?? `Fabric #${r.id}`).trim(),
        sku: r.sku,
        status: String(r.status),
        supplierName: r.supplierName,
        updatedAt: r.updatedAt.toISOString(),
        primaryImage: gallery[0] ?? null
      }
    })

    return {
      items,
      meta: { page, limit, total, totalPages },
      counts: {
        readyForReview: Number(countReady[0]?.c ?? 0),
        aiProcessing: Number(countProcessing[0]?.c ?? 0),
        pipelineTotal: Number(countPipeline[0]?.c ?? 0)
      }
    }
  }
}
