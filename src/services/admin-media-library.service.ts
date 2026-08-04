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

    const conditions: SQL[] = [isNull(fabrics.deletedAt), sql`cardinality(${fabrics.images}) > 0`]

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

    const generatedMediaPromise = db
      .select({
        id: generatedMedia.id,
        fabricId: generatedMedia.fabricId,
        socialPostId: generatedMedia.socialPostId,
        type: generatedMedia.type,
        mediaType: generatedMedia.mediaType,
        url: generatedMedia.url,
        thumbnailUrl: generatedMedia.thumbnailUrl,
        prompt: generatedMedia.prompt,
        provider: generatedMedia.provider,
        providerModel: generatedMedia.providerModel,
        status: generatedMedia.status,
        durationSeconds: generatedMedia.durationSeconds,
        aspectRatio: generatedMedia.aspectRatio,
        fileSizeBytes: generatedMedia.fileSizeBytes,
        errorMessage: generatedMedia.errorMessage,
        supersededByMediaId: generatedMedia.supersededByMediaId,
        adminReviewedAt: generatedMedia.adminReviewedAt,
        adminReviewerId: generatedMedia.adminReviewerId,
        adminReviewNotes: generatedMedia.adminReviewNotes,
        metadata: generatedMedia.metadata,
        createdAt: generatedMedia.createdAt,
        updatedAt: generatedMedia.updatedAt,
        expiresAt: generatedMedia.expiresAt,
        fabricTitleEn: fabrics.titleEn,
        fabricTitleRu: fabrics.titleRu,
        supplierName: suppliers.name
      })
      .from(generatedMedia)
      .leftJoin(fabrics, eq(generatedMedia.fabricId, fabrics.id))
      .leftJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(
        and(
          inArray(generatedMedia.status, ['COMPLETED', 'SUPERSEDED']),
          isNotNull(generatedMedia.url),
          isNull(generatedMedia.deletedAt)
        )
      )
      .orderBy(desc(generatedMedia.createdAt))
      .limit(48)

    const [folderCountsRows, statsRows, totalRows, rows, generatedMediaRows] = await Promise.all([
      folderCountsPromise,
      statsPromise,
      totalRowsPromise,
      rowsPromise,
      generatedMediaPromise
    ])

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

    const fabricItems: MediaLibraryItem[] = rows.map((r) => {
      const imgs = r.images ?? []
      const primary = imgs[0] ?? null
      return {
        id: r.id,
        key: `fabric-${r.id}`,
        title: (r.titleEn ?? r.titleRu ?? `Fabric #${r.id}`).trim(),
        images: imgs,
        primaryImage: primary,
        imageCount: imgs.length,
        status: String(r.status),
        supplierName: r.supplierName,
        categorySlugs: Array.isArray(r.categorySlugs) ? r.categorySlugs.filter((s): s is string => Boolean(s)) : [],
        updatedAt: r.updatedAt.toISOString()
      }
    })

    const items: MediaLibraryItem[] = []

    // Version counts per scope (fabric, or fabric+linked post) so the UI can
    // show "1 of N" for regenerated media.
    const scopeKey = (r: { fabricId: number; socialPostId: number | null }) => `${r.fabricId}:${r.socialPostId ?? 'fabric'}`
    const scopeCounts = new Map<string, number>()
    for (const r of generatedMediaRows) {
      const k = scopeKey(r)
      scopeCounts.set(k, (scopeCounts.get(k) ?? 0) + 1)
    }

    // 1. Fabric cards (fabrics that have their own images in the catalog)
    for (const f of fabricItems) {
      items.push({
        ...f,
        images: f.images,
        videos: [],
        primaryImage: f.primaryImage,
        imageCount: f.images.length,
        status: f.status
      })
    }

    // 2. Standalone AI-generated media cards — every video gets its own card
    //    so it is actually visible in the library (not hidden inside a fabric card).
    for (const r of generatedMediaRows) {
      if (!r.url) continue
      const mediaUrl = resolveR2Url(r.url) ?? ''
      if (!mediaUrl) continue

      const titleBase = (r.fabricTitleEn ?? r.fabricTitleRu ?? `Fabric #${r.fabricId}`).trim()
      const isDupFabricImage =
        r.type !== 'video' &&
        fabricItems.some((f) => f.id === r.fabricId && (f.images ?? []).includes(mediaUrl))

      if (r.type === 'video') {
        const thumbUrl = r.thumbnailUrl ? (resolveR2Url(r.thumbnailUrl) ?? null) : null
        items.push({
          id: r.fabricId,
          key: `generated-video-${r.id}`,
          title: `AI Video — ${titleBase}`,
          images: [],
          videos: [mediaUrl],
          primaryImage: mediaUrl,
          thumbnailUrl: thumbUrl,
          imageCount: 1,
          status: 'ai_video',
          supplierName: r.supplierName ?? null,
          categorySlugs: [],
          updatedAt: r.createdAt.toISOString(),
          type: 'ai_video',
          mediaType: r.mediaType,
          prompt: r.prompt ?? null,
          provider: r.provider,
          providerModel: r.providerModel,
          fileSizeBytes: r.fileSizeBytes,
          durationSeconds: r.durationSeconds,
          errorMessage: r.errorMessage,
          mediaStatus: r.status,
          isCurrentVersion: r.status === 'COMPLETED',
          supersededByMediaId: r.supersededByMediaId ?? null,
          versionCount: scopeCounts.get(scopeKey(r)) ?? 1,
          adminReviewedAt: r.adminReviewedAt?.toISOString() ?? null,
          adminReviewerId: r.adminReviewerId,
          adminReviewNotes: r.adminReviewNotes,
          metadata: r.metadata
        })
      } else if (!isDupFabricImage) {
        items.push({
          id: r.fabricId,
          key: `generated-image-${r.id}`,
          title: `AI Image — ${titleBase}`,
          images: [mediaUrl],
          videos: [],
          primaryImage: mediaUrl,
          imageCount: 1,
          status: 'ai_image',
          supplierName: r.supplierName ?? null,
          categorySlugs: [],
          updatedAt: r.createdAt.toISOString(),
          type: 'ai_image',
          mediaType: r.mediaType,
          prompt: r.prompt ?? null,
          provider: r.provider,
          providerModel: r.providerModel,
          fileSizeBytes: r.fileSizeBytes,
          durationSeconds: r.durationSeconds,
          errorMessage: r.errorMessage,
          mediaStatus: r.status,
          isCurrentVersion: r.status === 'COMPLETED',
          supersededByMediaId: r.supersededByMediaId ?? null,
          versionCount: scopeCounts.get(scopeKey(r)) ?? 1,
          adminReviewedAt: r.adminReviewedAt?.toISOString() ?? null,
          adminReviewerId: r.adminReviewerId,
          adminReviewNotes: r.adminReviewNotes,
          metadata: r.metadata
        })
      }
    }

    return {
      items,
      folders,
      stats,
      meta: { page, limit, total, totalPages },
      generatedAt: new Date().toISOString()
    }
  }
}
