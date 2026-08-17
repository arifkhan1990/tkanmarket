import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { buyerWishlistItems } from '@/db/schema/buyer-wishlist.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import { NotFoundError, ValidationError } from '@/lib/errors'
import type {
  BuyerWishlistAddPayload,
  BuyerWishlistItemRow,
  BuyerWishlistListResponse
} from '@/types/buyer-wishlist.types'
import type { FabricCompositionItem } from '@/types/fabric'

/** Hard cap on items per user — protects against runaway storage. */
export const BUYER_WISHLIST_MAX_PER_USER = 500

function firstImageUrl(images: string[] | null): string | null {
  if (!images || images.length === 0) return null
  return images[0] ?? null
}

function compositionSummary(composition: FabricCompositionItem[] | null): string | null {
  if (!composition || composition.length === 0) return null
  return composition
    .map((c) => `${c.percentage ?? ''}% ${c.material ?? ''}`.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ')
}

export class BuyerWishlistService {
  public static async list(
    userId: number,
    params: { page: number; limit: number; collection?: string | null; q?: string }
  ): Promise<{ data: BuyerWishlistListResponse; total: number }> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const baseWhere = and(eq(buyerWishlistItems.userId, userId), isNull(buyerWishlistItems.deletedAt))

    const collectionWhere =
      params.collection === undefined || params.collection === null || params.collection === ''
        ? undefined
        : params.collection === '__all__'
          ? undefined
          : eq(buyerWishlistItems.collectionLabel, params.collection)

    const searchWhere = params.q
      ? or(ilike(fabrics.titleRu, `%${params.q}%`), ilike(sql`coalesce(${fabrics.sku}, '')`, `%${params.q}%`))
      : undefined

    const where = and(baseWhere, collectionWhere, searchWhere)
    /** Only surface fabrics that are still live in the catalog. */
    const fabricVisibleWhere = and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))

    // Run all 4 wishlist queries in parallel — each is an independent statement.
    const [totalRows, rows, collRows, allCountRows] = await Promise.all([
      db
        .select({ total: count() })
        .from(buyerWishlistItems)
        .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
        .where(and(where, fabricVisibleWhere)),

      db
        .select({
          wishlistId: buyerWishlistItems.id,
          fabricId: fabrics.id,
          slug: fabrics.slug,
          titleRu: fabrics.titleRu,
          sku: fabrics.sku,
          images: fabrics.images,
          composition: fabrics.composition,
          collectionLabel: buyerWishlistItems.collectionLabel
        })
        .from(buyerWishlistItems)
        .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
        .where(and(where, fabricVisibleWhere))
        .orderBy(desc(buyerWishlistItems.createdAt))
        .limit(params.limit)
        .offset(offset),

      db
        .select({
          label: buyerWishlistItems.collectionLabel,
          c: count()
        })
        .from(buyerWishlistItems)
        .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
        .where(and(eq(buyerWishlistItems.userId, userId), isNull(buyerWishlistItems.deletedAt), fabricVisibleWhere))
        .groupBy(buyerWishlistItems.collectionLabel),

      db
        .select({ c: count() })
        .from(buyerWishlistItems)
        .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
        .where(and(eq(buyerWishlistItems.userId, userId), isNull(buyerWishlistItems.deletedAt), fabricVisibleWhere))
    ])

    const total = totalRows[0]?.total ?? 0

    const items: BuyerWishlistItemRow[] = rows.map((r) => ({
      wishlistId: r.wishlistId,
      fabricId: r.fabricId,
      slug: r.slug,
      titleRu: r.titleRu,
      sku: r.sku ?? null,
      imageUrl: firstImageUrl(r.images ?? null),
      collectionLabel: r.collectionLabel ?? null,
      materialSummary: compositionSummary(r.composition ?? null)
    }))

    const collections = collRows
      .filter((x) => x.label !== null && String(x.label).trim() !== '')
      .map((x) => ({ label: String(x.label), count: x.c }))

    const itemCount = allCountRows[0]?.c ?? 0

    return {
      total,
      data: {
        items,
        collections,
        totals: {
          itemCount
        }
      }
    }
  }

  public static async add(userId: number, payload: BuyerWishlistAddPayload): Promise<void> {
    const db = getDb()

    // Validate the fabric exists, is not soft-deleted, and is approved.
    const fabricRow = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, payload.fabricId), isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .limit(1)

    if (fabricRow.length === 0) {
      throw new NotFoundError('Fabric not available')
    }

    // Look up an existing row (active or soft-deleted) for this user+fabric.
    const existing = await db
      .select({ id: buyerWishlistItems.id, deletedAt: buyerWishlistItems.deletedAt })
      .from(buyerWishlistItems)
      .where(and(eq(buyerWishlistItems.userId, userId), eq(buyerWishlistItems.fabricId, payload.fabricId)))
      .limit(1)

    const row = existing[0]
    if (row) {
      // Reactivate / update — does not count toward the cap because the row already exists.
      await db
        .update(buyerWishlistItems)
        .set({
          deletedAt: null,
          collectionLabel: payload.collectionLabel ?? null,
          updatedAt: new Date()
        })
        .where(eq(buyerWishlistItems.id, row.id))
      return
    }

    // Enforce per-user item cap before creating a new row.
    const countRow = await db
      .select({ c: count() })
      .from(buyerWishlistItems)
      .where(and(eq(buyerWishlistItems.userId, userId), isNull(buyerWishlistItems.deletedAt)))

    const currentCount = countRow[0]?.c ?? 0
    if (currentCount >= BUYER_WISHLIST_MAX_PER_USER) {
      throw new ValidationError(`Wishlist limit reached (max ${BUYER_WISHLIST_MAX_PER_USER} items)`)
    }

    await db.insert(buyerWishlistItems).values({
      userId,
      fabricId: payload.fabricId,
      collectionLabel: payload.collectionLabel ?? null,
      updatedAt: new Date()
    })
  }

  public static async remove(userId: number, fabricId: number): Promise<void> {
    const db = getDb()
    await db
      .update(buyerWishlistItems)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(buyerWishlistItems.userId, userId),
          eq(buyerWishlistItems.fabricId, fabricId),
          isNull(buyerWishlistItems.deletedAt)
        )
      )
  }

  public static async listSavedFabricIds(userId: number, fabricIds: number[]): Promise<number[]> {
    const db = getDb()
    const unique = [...new Set(fabricIds)].filter((id) => id > 0).slice(0, 100)
    if (unique.length === 0) return []

    // Join fabrics so we never report "saved" for fabrics that have been
    // soft-deleted or are no longer approved — keeps the heart UI honest.
    const rows = await db
      .select({ fabricId: buyerWishlistItems.fabricId })
      .from(buyerWishlistItems)
      .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
      .where(
        and(
          eq(buyerWishlistItems.userId, userId),
          inArray(buyerWishlistItems.fabricId, unique),
          isNull(buyerWishlistItems.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )

    return rows.map((r) => r.fabricId)
  }

  /**
   * Cheap count of the user's active wishlist (only counts items whose fabric
   * is still approved and not soft-deleted). Used by the header badge.
   */
  public static async countForUser(userId: number): Promise<number> {
    const db = getDb()
    const rows = await db
      .select({ c: count() })
      .from(buyerWishlistItems)
      .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
      .where(
        and(
          eq(buyerWishlistItems.userId, userId),
          isNull(buyerWishlistItems.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )
    return rows[0]?.c ?? 0
  }

  public static async isInWishlist(userId: number, fabricId: number): Promise<boolean> {
    const db = getDb()
    const row = await db
      .select({ id: buyerWishlistItems.id })
      .from(buyerWishlistItems)
      .innerJoin(fabrics, eq(buyerWishlistItems.fabricId, fabrics.id))
      .where(
        and(
          eq(buyerWishlistItems.userId, userId),
          eq(buyerWishlistItems.fabricId, fabricId),
          isNull(buyerWishlistItems.deletedAt),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )
      .limit(1)

    return row[0] !== undefined
  }
}
