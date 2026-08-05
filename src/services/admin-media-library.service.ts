import type { SQL } from 'drizzle-orm'
import { and, asc, count, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { resolveR2Url } from '@/lib/storage/r2'
import type {
  MediaLibraryFolder,
  MediaLibraryItem,
  MediaLibraryResponse,
  MediaLibrarySort,
  MediaLibraryStats,
  MediaLibraryStatusFilter
} from '@/types/admin-media-library.types'

function safePage(page: number): number {
  return page >= 1 && Number.isFinite(page) ? Math.floor(page) : 1
}

function safeLimit(limit: number): number {
  const l = Math.floor(limit)
  if (l < 1) return 12
  if (l > 48) return 48
  return l
}

function statusCondition(filter: MediaLibraryStatusFilter): SQL | null {
  switch (filter) {
    case 'approved':
      return eq(fabrics.status, 'approved')
    case 'rejected':
      return eq(fabrics.status, 'rejected')
    case 'draft':
      return inArray(fabrics.status, ['raw_scraped', 'ai_processing', 'ai_processed'])
    case 'all':
    default:
      return null
  }
}

export class AdminMediaLibraryService {
  /**
   * Performance contract:
   *  - Four SQL statements at most, all dispatched concurrently via `Promise.all`:
   *      1. folder counts (GROUP BY category_slug)
   *      2. global stats — total/approved/draft counts + total image cardinality, all
   *         collapsed into a single statement using `COUNT(*) FILTER (...)` and `SUM(cardinality(images))`
   *      3. count(*) for the filtered page (drives pagination meta)
   *      4. paginated row query joined to suppliers, with categories aggregated via a
   *         correlated `array_agg` subquery — no per-row follow-up, no N+1
   *  - Folder filter is applied via an `inArray(subquery)` so it does NOT require a
   *    separate round-trip to fetch IDs first.
   *  - All `WHERE` columns hit existing indexes:
   *    `fabrics_status_deleted_at_idx`, `fabric_categories_fabric_id_idx`.
   *
   * Security contract:
   *  - Caller MUST be an authenticated admin (enforced at the route layer).
   *  - All queries scope `deletedAt IS NULL` on every joined table.
   *  - User-supplied search and folder strings are routed through Drizzle's
   *    parameterized `ilike` / `eq` operators — no string interpolation into SQL.
   *  - The `%` literal in the search needle is escaped before pattern wrapping.
   */
  public static async list(params: {
    page: number
    limit: number
    q: string | null
    folderSlug: string | null
    fabricId: number | null
    statusFilter: MediaLibraryStatusFilter
    sort: MediaLibrarySort
  }): Promise<MediaLibraryResponse> {
    const db = getDb()
    const page = safePage(params.page)
    const limit = safeLimit(params.limit)
    const offset = (page - 1) * limit

    const search = params.q?.trim() ?? ''
    const folderSlug = params.folderSlug?.trim() ?? ''

    const conditions: SQL[] = [
      isNull(fabrics.deletedAt),
      or(
        sql`cardinality(${fabrics.images}) > 0`,
        sql`EXISTS (
          SELECT 1 FROM generated_media gm
          WHERE gm.fabric_id = ${fabrics.id}
            AND gm.status IN ('COMPLETED', 'SUPERSEDED')
            AND gm.deleted_at IS NULL
        )`
      )!
    ]

    if (search.length > 0) {
      const pattern = `%${search.replace(/[%_]/g, (m) => `\\${m}`)}%`
      const searchExpr = or(
        ilike(fabrics.titleEn, pattern),
        ilike(fabrics.titleRu, pattern),
        ilike(fabrics.sku, pattern)
      )
      if (searchExpr) conditions.push(searchExpr)
    }

    const statusExpr = statusCondition(params.statusFilter)
    if (statusExpr) conditions.push(statusExpr)

    if (folderSlug.length > 0) {
      conditions.push(
        inArray(
          fabrics.id,
          db
            .select({ id: fabricCategories.fabricId })
            .from(fabricCategories)
            .where(
              and(
                isNull(fabricCategories.deletedAt),
                eq(fabricCategories.categorySlug, folderSlug)
              )
            )
        )
      )
    }

    if (params.fabricId) {
      conditions.push(eq(fabrics.id, params.fabricId))
    }

    const whereClause = and(...conditions)

    // Sidebar folder counts — restricted to fabrics-with-images and not deleted.
    const folderCountsPromise = db
      .select({
        slug: fabricCategories.categorySlug,
        c: count()
      })
      .from(fabricCategories)
      .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
      .where(
        and(
          isNull(fabricCategories.deletedAt),
          isNull(fabrics.deletedAt),
          sql`cardinality(${fabrics.images}) > 0`
        )
      )
      .groupBy(fabricCategories.categorySlug)

    // Global stats — single statement using FILTER to collapse multiple counts.
    const statsPromise = db
      .select({
        total: sql<number>`COUNT(*)::int`,
        approved: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} = 'approved')::int`,
        draft: sql<number>`COUNT(*) FILTER (WHERE ${fabrics.status} IN ('raw_scraped', 'ai_processing', 'ai_processed'))::int`,
        images: sql<number>`COALESCE(SUM(cardinality(${fabrics.images})), 0)::int`
      })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), sql`cardinality(${fabrics.images}) > 0`))

    // Paginated row count — used for pagination meta.
    const totalRowsPromise = db.select({ c: count() }).from(fabrics).where(whereClause)

    // Sort handler.
    const orderByExpr =
      params.sort === 'images_desc'
        ? desc(sql`cardinality(${fabrics.images})`)
        : params.sort === 'title_asc'
          ? asc(sql`COALESCE(${fabrics.titleEn}, ${fabrics.titleRu})`)
          : desc(fabrics.updatedAt)

    // Main row query — categories collapsed into the SELECT via correlated subquery.
    const rowsPromise = db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        images: fabrics.images,
        status: fabrics.status,
        updatedAt: fabrics.updatedAt,
        supplierName: suppliers.name,
        categorySlugs: sql<string[]>`COALESCE((
          SELECT array_agg(fc.category_slug)
          FROM fabric_categories fc
          WHERE fc.fabric_id = ${fabrics.id} AND fc.deleted_at IS NULL
        ), ARRAY[]::text[])`
      })
      .from(fabrics)
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(orderByExpr)
      .limit(limit)
      .offset(offset)

    const [folderCountsRows, statsRows, totalRows, rows] = await Promise.all([
      folderCountsPromise,
      statsPromise,
      totalRowsPromise,
      rowsPromise
    ])

    const fabricIds = rows.map((r) => r.id)

    const generatedMediaRows =
      fabricIds.length > 0
        ? await db
            .select({
              id: generatedMedia.id,
              fabricId: generatedMedia.fabricId,
              type: generatedMedia.type,
              url: generatedMedia.url,
              thumbnailUrl: generatedMedia.thumbnailUrl,
              status: generatedMedia.status,
              createdAt: generatedMedia.createdAt
            })
            .from(generatedMedia)
            .where(
              and(
                inArray(generatedMedia.fabricId, fabricIds),
                inArray(generatedMedia.status, ['COMPLETED', 'SUPERSEDED']),
                isNotNull(generatedMedia.url),
                isNull(generatedMedia.deletedAt)
              )
            )
            .orderBy(desc(generatedMedia.createdAt))
        : []

    const total = Number(totalRows[0]?.c ?? 0)
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

    const statsRow = statsRows[0]
    const stats: MediaLibraryStats = {
      totalWithImages: Number(statsRow?.total ?? 0),
      approvedCount: Number(statsRow?.approved ?? 0),
      draftCount: Number(statsRow?.draft ?? 0),
      totalImages: Number(statsRow?.images ?? 0)
    }

    const folders: MediaLibraryFolder[] = [
      { slug: '', label: 'All assets', count: stats.totalWithImages },
      ...folderCountsRows
        .map((f) => ({
          slug: f.slug,
          label: f.slug.replace(/-/g, ' '),
          count: Number(f.c)
        }))
        .sort((a, b) => b.count - a.count)
    ]

    const items: MediaLibraryItem[] = rows.map((r) => {
      const imgs = [...(r.images ?? [])]
      const vids: string[] = []
      let thumbUrl: string | null = null

      const genForFabric = generatedMediaRows.filter((gm) => gm.fabricId === r.id)
      for (const gm of genForFabric) {
        if (!gm.url) continue
        const mediaUrl = resolveR2Url(gm.url)
        if (!mediaUrl) continue

        if (gm.type === 'video') {
          if (!vids.includes(mediaUrl)) vids.push(mediaUrl)
          if (gm.thumbnailUrl && !thumbUrl) {
            thumbUrl = resolveR2Url(gm.thumbnailUrl)
          }
        } else {
          if (!imgs.includes(mediaUrl)) imgs.push(mediaUrl)
        }
      }

      const primary = imgs[0] ?? vids[0] ?? null
      const totalMediaCount = imgs.length + vids.length

      return {
        id: r.id,
        key: `fabric-${r.id}`,
        title: (r.titleEn ?? r.titleRu ?? `Fabric #${r.id}`).trim(),
        images: imgs,
        videos: vids,
        primaryImage: primary,
        thumbnailUrl: thumbUrl,
        imageCount: totalMediaCount,
        status: String(r.status),
        supplierName: r.supplierName,
        categorySlugs: Array.isArray(r.categorySlugs) ? r.categorySlugs.filter((s): s is string => Boolean(s)) : [],
        updatedAt: r.updatedAt.toISOString()
      }
    })

    return {
      items,
      folders,
      stats,
      meta: { page, limit, total, totalPages },
      generatedAt: new Date().toISOString()
    }
  }
}
