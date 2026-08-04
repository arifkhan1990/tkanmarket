import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { getDb } from '@/db'
import { supplierReviews } from '@/db/schema/supplier-ops.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  SupplierReviewAdminDto,
  SupplierReviewModerationStatsDto,
  SupplierReviewStatus
} from '@/types/supplier-ops.types'

export class SupplierReviewService {
  public static async list(params: {
    page: number
    limit: number
    status?: SupplierReviewStatus
    supplierId?: number
  }): Promise<{ items: SupplierReviewAdminDto[]; total: number; stats: SupplierReviewModerationStatsDto }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const parts: SQL[] = [isNull(supplierReviews.deletedAt)]
    if (params.status) parts.push(eq(supplierReviews.status, params.status))
    if (typeof params.supplierId === 'number') parts.push(eq(supplierReviews.supplierId, params.supplierId))
    const whereClause = and(...parts) as SQL

    const totalRows = await db.select({ total: count() }).from(supplierReviews).where(whereClause)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: supplierReviews.id,
        supplierId: supplierReviews.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        fabricId: supplierReviews.fabricId,
        reviewerDisplayName: supplierReviews.reviewerDisplayName,
        reviewerBadge: supplierReviews.reviewerBadge,
        isAnonymous: supplierReviews.isAnonymous,
        rating: supplierReviews.rating,
        body: supplierReviews.body,
        skuSnapshot: supplierReviews.skuSnapshot,
        status: supplierReviews.status,
        flagReason: supplierReviews.flagReason,
        createdAt: supplierReviews.createdAt,
        updatedAt: supplierReviews.updatedAt
      })
      .from(supplierReviews)
      .innerJoin(suppliers, eq(supplierReviews.supplierId, suppliers.id))
      .where(and(whereClause, isNull(suppliers.deletedAt)))
      .orderBy(desc(supplierReviews.createdAt))
      .limit(params.limit)
      .offset(offset)

    const stats = await SupplierReviewService.getModerationStats(params.supplierId)

    return {
      total,
      stats,
      items: rows.map((r) => ({
        id: r.id,
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        supplierSlug: r.supplierSlug,
        fabricId: r.fabricId,
        reviewerDisplayName: r.isAnonymous ? 'Anonymous' : r.reviewerDisplayName,
        reviewerBadge: r.reviewerBadge,
        isAnonymous: r.isAnonymous,
        rating: r.rating,
        body: r.body,
        skuSnapshot: r.skuSnapshot,
        status: r.status as SupplierReviewStatus,
        flagReason: r.flagReason,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      }))
    }
  }

  public static async getModerationStats(supplierId?: number): Promise<SupplierReviewModerationStatsDto> {
    const db = getDb()
    const statParts: SQL[] = [isNull(supplierReviews.deletedAt)]
    if (typeof supplierId === 'number') statParts.push(eq(supplierReviews.supplierId, supplierId))
    const base = and(...statParts) as SQL

    const [totals] = await db
      .select({
        total: count(),
        pending: sql<number>`count(*) filter (where ${supplierReviews.status} = 'PENDING')`,
        flagged: sql<number>`count(*) filter (where ${supplierReviews.status} = 'FLAGGED')`,
        avgRating: sql<string | null>`avg(${supplierReviews.rating})::text`
      })
      .from(supplierReviews)
      .where(base)

    const totalReviews = Number(totals?.total ?? 0)
    const pendingCount = Number(totals?.pending ?? 0)
    const flaggedCount = Number(totals?.flagged ?? 0)
    const avg = totals?.avgRating != null ? Number.parseFloat(totals.avgRating) : null

    return {
      totalReviews,
      pendingCount,
      flaggedCount,
      averageRating: avg != null && !Number.isNaN(avg) ? Math.round(avg * 10) / 10 : null
    }
  }

  public static async updateStatus(
    id: number,
    input: { status: SupplierReviewStatus; flagReason?: string | null }
  ): Promise<SupplierReviewAdminDto | null> {
    const db = getDb()
    const updated = await db
      .update(supplierReviews)
      .set({
        status: input.status,
        flagReason: input.flagReason ?? null,
        updatedAt: new Date()
      })
      .where(and(eq(supplierReviews.id, id), isNull(supplierReviews.deletedAt)))
      .returning({ id: supplierReviews.id })

    if (!updated[0]) return null

    const row = await db
      .select({
        id: supplierReviews.id,
        supplierId: supplierReviews.supplierId,
        supplierName: suppliers.name,
        supplierSlug: suppliers.slug,
        fabricId: supplierReviews.fabricId,
        reviewerDisplayName: supplierReviews.reviewerDisplayName,
        reviewerBadge: supplierReviews.reviewerBadge,
        isAnonymous: supplierReviews.isAnonymous,
        rating: supplierReviews.rating,
        body: supplierReviews.body,
        skuSnapshot: supplierReviews.skuSnapshot,
        status: supplierReviews.status,
        flagReason: supplierReviews.flagReason,
        createdAt: supplierReviews.createdAt,
        updatedAt: supplierReviews.updatedAt
      })
      .from(supplierReviews)
      .innerJoin(suppliers, eq(supplierReviews.supplierId, suppliers.id))
      .where(and(eq(supplierReviews.id, id), isNull(supplierReviews.deletedAt)))
      .limit(1)

    const r = row[0]
    if (!r) return null

    return {
      id: r.id,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      supplierSlug: r.supplierSlug,
      fabricId: r.fabricId,
      reviewerDisplayName: r.isAnonymous ? 'Anonymous' : r.reviewerDisplayName,
      reviewerBadge: r.reviewerBadge,
      isAnonymous: r.isAnonymous,
      rating: r.rating,
      body: r.body,
      skuSnapshot: r.skuSnapshot,
      status: r.status as SupplierReviewStatus,
      flagReason: r.flagReason,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }
  }
}
