import { and, asc, count, desc, eq, exists, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { fabricCategoryTerms } from '@/db/schema/fabric-category-terms.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import { fabricActivityLog } from '@/db/schema/fabric-activity-log.schema'
import { blogPosts } from '@/db/schema/blog.schema'
import { generatedMedia } from '@/db/schema/generated-media.schema'
import { socialPosts } from '@/db/schema/social.schema'
import { AdminFabricTypesService } from '@/services/admin-fabric-types.service'
import { logger } from '@/lib/logger'
import { NotFoundError } from '@/lib/errors'
import type { SQL } from 'drizzle-orm'
import { filterFabricGalleryImageUrls } from '@/lib/fabric-gallery-image-urls'
import type {
  AdminFabricDetail,
  AdminFabricListCounts,
  AdminFabricListItem,
  AdminFabricListResponse,
  AdminFabricStatus,
  AdminFabricUpdateInput,
  AdminSupplierOption
} from '@/types/admin-fabric-management.types'
import type { FabricCompositionItem } from '@/types/fabric'

function toIso(d: Date | null | undefined) {
  return d ? d.toISOString() : null
}

type FabricAiContentStatus = {
  has_blog: boolean
  blog_slug: string | null
  has_video: boolean
  video_post_id: number | null
  has_social: boolean
  social_post_id: number | null
}

/**
 * Batch-loads AI content presence for a set of fabric ids.
 * No N+1: three aggregated queries keyed on fabric_id.
 */
async function loadAiContentStatus(ids: number[]): Promise<Map<number, FabricAiContentStatus>> {
  const map = new Map<number, FabricAiContentStatus>()
  if (ids.length === 0) return map

  for (const id of ids) {
    map.set(id, { has_blog: false, blog_slug: null, has_video: false, video_post_id: null, has_social: false, social_post_id: null })
  }

  const db = getDb()

  const [blogRows, videoMediaRows, socialRows] = await Promise.all([
    db
      .select({ fabricId: blogPosts.fabricId, slug: blogPosts.slug })
      .from(blogPosts)
      .where(and(inArray(blogPosts.fabricId, ids), isNull(blogPosts.deletedAt), isNotNull(blogPosts.fabricId)))
      .orderBy(desc(blogPosts.createdAt)),
    db
      .select({ fabricId: generatedMedia.fabricId, socialPostId: generatedMedia.socialPostId })
      .from(generatedMedia)
      .leftJoin(socialPosts, eq(generatedMedia.socialPostId, socialPosts.id))
      .where(
        and(
          inArray(generatedMedia.fabricId, ids),
          eq(generatedMedia.type, 'video'),
          isNull(generatedMedia.deletedAt),
          // Never link the video button to a soft-deleted social post — that
          // would open a preview page that 404s.
          or(isNull(generatedMedia.socialPostId), isNull(socialPosts.deletedAt))
        )
      )
      .orderBy(desc(generatedMedia.createdAt)),
    db
      .select({
        fabricId: socialPosts.fabricId,
        id: socialPosts.id,
        status: socialPosts.status,
        captionText: socialPosts.captionText,
        scriptText: socialPosts.scriptText,
        platformMetadata: socialPosts.platformMetadata,
        revisionNumber: socialPosts.revisionNumber
      })
      .from(socialPosts)
      .where(and(inArray(socialPosts.fabricId, ids), isNull(socialPosts.deletedAt)))
      .orderBy(desc(socialPosts.createdAt))
  ])

  const seenBlog = new Set<number>()
  for (const r of blogRows) {
    if (r.fabricId == null || seenBlog.has(r.fabricId)) continue
    seenBlog.add(r.fabricId)
    const s = map.get(r.fabricId)
    if (s) {
      s.has_blog = true
      s.blog_slug = r.slug
    }
  }

  for (const r of videoMediaRows) {
    if (r.fabricId == null) continue
    const s = map.get(r.fabricId)
    if (!s) continue
    s.has_video = true
    // Rows are ordered newest-first; take the newest video that is linked to a social post.
    if (s.video_post_id == null && r.socialPostId != null) s.video_post_id = r.socialPostId
  }

  const fallbackSocialPostId = new Map<number, number>()
  const bestContentPost = new Map<number, { id: number; revisionNumber: number }>()

  for (const r of socialRows) {
    if (r.fabricId == null) continue
    const s = map.get(r.fabricId)
    if (!s) continue
    if (r.status === 'VIDEO_PENDING') {
      s.has_video = true
      if (s.video_post_id == null) s.video_post_id = r.id
      continue
    }
    s.has_social = true
    // Prefer the newest post that actually carries content (caption/script/
    // metadata). Bare drafts created by the video flow must not become the
    // "social" preview link — they show a video but no social copy. Among
    // content-bearing posts, prefer the highest revision number.
    const hasContent = Boolean(r.captionText?.trim()) || Boolean(r.scriptText?.trim()) || Boolean(r.platformMetadata)
    if (hasContent) {
      const best = bestContentPost.get(r.fabricId)
      if (best == null || (r.revisionNumber ?? 1) > best.revisionNumber) {
        bestContentPost.set(r.fabricId, { id: r.id, revisionNumber: r.revisionNumber ?? 1 })
      }
    } else if (!fallbackSocialPostId.has(r.fabricId)) {
      fallbackSocialPostId.set(r.fabricId, r.id)
    }
  }

  for (const [fabricId, best] of bestContentPost) {
    const s = map.get(fabricId)
    if (s && s.social_post_id == null) s.social_post_id = best.id
  }

  for (const [fabricId, postId] of fallbackSocialPostId) {
    const s = map.get(fabricId)
    if (s && s.social_post_id == null) s.social_post_id = postId
  }

  return map
}

function startOfTodayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

export class AdminFabricService {
  private static slugifyForSlug(input: string): string {
    const s = input
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72)
    return s.length > 0 ? s : 'fabric'
  }

  public static async listCategoryOptions(): Promise<Array<{ slug: string }>> {
    const db = getDb()
    const rows = await db
      .select({ slug: fabricCategoryTerms.slug })
      .from(fabricCategoryTerms)
      .where(and(isNull(fabricCategoryTerms.deletedAt), eq(fabricCategoryTerms.isActive, true)))
      .orderBy(asc(fabricCategoryTerms.sortOrder), asc(fabricCategoryTerms.slug))
    return rows.map((r) => ({ slug: r.slug }))
  }

  /** Legacy fallback: distinct slugs from junction table (no terms table). */
  public static async listLegacyCategoryOptions(): Promise<Array<{ slug: string }>> {
    const db = getDb()
    const rows = await db
      .selectDistinct({ slug: fabricCategories.categorySlug })
      .from(fabricCategories)
      .where(isNull(fabricCategories.deletedAt))
      .orderBy(asc(fabricCategories.categorySlug))
    return rows.map((r) => ({ slug: r.slug }))
  }

  public static async create(params: { supplierId: number; titleRu: string }): Promise<{ id: number }> {
    const db = getDb()
    const title = params.titleRu.trim()
    if (title.length < 2 || title.length > 300) {
      throw new Error('Invalid title')
    }
    const sup = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, params.supplierId), isNull(suppliers.deletedAt)))
      .limit(1)
    if (!sup[0]) {
      throw new Error('Supplier not found')
    }

    const base = AdminFabricService.slugifyForSlug(title)
    let slug = `${base}-${Date.now().toString(36)}`
    for (let attempt = 0; attempt < 12; attempt++) {
      const dup = await db.select({ id: fabrics.id }).from(fabrics).where(eq(fabrics.slug, slug)).limit(1)
      if (!dup[0]) break
      slug = `${base}-${Date.now().toString(36)}-${attempt}`
    }

    const inserted = await db
      .insert(fabrics)
      .values({
        supplierId: params.supplierId,
        slug,
        sku: null,
        status: 'raw_scraped',
        titleRu: title,
        titleEn: null,
        descriptionRu: null,
        descriptionEn: null,
        usageRu: null,
        metaTitleRu: null,
        metaDescriptionRu: null,
        metaTitleEn: null,
        metaDescriptionEn: null,
        imageAltRu: null,
        imageAltEn: null,
        fabricType: null,
        gsm: null,
        widthCm: null,
        priceUsd: null,
        moq: null,
        composition: null,
        tags: null,
        images: null,
        sourceUrl: null,
        rawTitle: title,
        rawDescription: null,
        aiConfidenceScore: null,
        aiProcessedAt: null,
        isFeatured: false,
        socialScore: null,
        viewsCount: 0,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({ id: fabrics.id })

    const id = inserted[0]?.id
    if (typeof id !== 'number') throw new Error('Insert failed')

    // Auto-enqueue AI processing for enrichment
    import('@/lib/queue/helpers').then(({ addAIJob: enqueue }) => {
      enqueue(id).catch((err: Error) => {
        logger.error('Failed to enqueue AI job after fabric create', { fabricId: id, message: err.message })
      })
    })

    return { id }
  }

  public static async listSupplierOptions(): Promise<AdminSupplierOption[]> {
    const db = getDb()
    const rows = await db
      .select({ id: suppliers.id, name: suppliers.name })
      .from(suppliers)
      .where(isNull(suppliers.deletedAt))
      .orderBy(asc(suppliers.name))
    return rows
  }

  public static async list(params: {
    q?: string
    status?: AdminFabricStatus
    supplierId?: number
    page: number
    limit: number
    createdFrom?: Date
    createdTo?: Date
    categorySlug?: string
  }): Promise<AdminFabricListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    const whereBase = and(isNull(fabrics.deletedAt))
    let where =
      params.status && params.status !== 'raw_scraped'
        ? and(whereBase, eq(fabrics.status, params.status))
        : params.status === 'raw_scraped'
          ? and(whereBase, eq(fabrics.status, 'raw_scraped'))
          : whereBase

    if (typeof params.supplierId === 'number' && params.supplierId > 0) {
      where = and(where, eq(fabrics.supplierId, params.supplierId))
    }

    // Multi-column search across title_ru, title_en, slug, and sku.
    // Escapes user-supplied `%` and `_` so they cannot inject LIKE wildcards.
    let whereWithSearch = where
    if (params.q && params.q.trim().length > 0) {
      const needle = params.q.trim().replace(/[%_]/g, (m) => `\\${m}`)
      const pattern = `%${needle}%`
      const searchExpr = or(
        ilike(fabrics.titleRu, pattern),
        ilike(fabrics.titleEn, pattern),
        ilike(fabrics.slug, pattern),
        ilike(fabrics.sku, pattern)
      )
      if (searchExpr) {
        whereWithSearch = and(where, searchExpr)
      }
    }

    let whereFiltered = whereWithSearch
    if (params.createdFrom) {
      whereFiltered = and(whereFiltered, gte(fabrics.createdAt, params.createdFrom))
    }
    if (params.createdTo) {
      whereFiltered = and(whereFiltered, lte(fabrics.createdAt, params.createdTo))
    }
    if (params.categorySlug && params.categorySlug.trim().length > 0) {
      const cs = params.categorySlug.trim()
      whereFiltered = and(
        whereFiltered,
        exists(
          db
            .select({ id: fabricCategories.id })
            .from(fabricCategories)
            .where(
              and(
                eq(fabricCategories.fabricId, fabrics.id),
                eq(fabricCategories.categorySlug, cs),
                isNull(fabricCategories.deletedAt)
              )
            )
        )
      )
    }

    const [totalRows, itemsRows, countsRows] = await Promise.all([
      db.select({ total: count() }).from(fabrics).where(whereFiltered),
      db
        .select({
          id: fabrics.id,
          slug: fabrics.slug,
          titleRu: fabrics.titleRu,
          titleEn: fabrics.titleEn,
          supplierName: suppliers.name,
          status: fabrics.status,
          fabricType: fabrics.fabricType,
          gsm: fabrics.gsm,
          widthCm: fabrics.widthCm,
          moq: fabrics.moq,
          priceUsd: fabrics.priceUsd,
          aiConfidenceScore: fabrics.aiConfidenceScore,
          createdAt: fabrics.createdAt,
          images: fabrics.images
        })
        .from(fabrics)
        .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
        .where(whereFiltered)
        .orderBy(desc(fabrics.createdAt))
        .limit(params.limit)
        .offset(offset),
      db
        .select({ status: fabrics.status, total: count() })
        .from(fabrics)
        .where(whereBase)
        .groupBy(fabrics.status)
    ])

    const counts: AdminFabricListCounts = {
      all: 0,
      raw_scraped: 0,
      ai_processing: 0,
      ai_processed: 0,
      approved: 0,
      rejected: 0
    }
    for (const r of countsRows) {
      const key = r.status as AdminFabricStatus
      counts[key] = r.total
      counts.all += r.total
    }

    const baseItems: Array<Omit<AdminFabricListItem, 'has_blog' | 'blog_slug' | 'has_video' | 'video_post_id' | 'has_social' | 'social_post_id'>> =
      itemsRows.map((r) => {
        const gallery = filterFabricGalleryImageUrls(r.images ?? undefined)
        const thumbUrl = gallery[0] ?? null
        return {
          id: r.id,
          slug: r.slug,
          title_ru: r.titleRu,
          title_en: r.titleEn ?? null,
          supplier_name: r.supplierName,
          status: r.status as AdminFabricStatus,
          fabric_type: r.fabricType ?? null,
          gsm: r.gsm,
          width_cm: r.widthCm,
          moq: r.moq,
          price_usd: r.priceUsd ? String(r.priceUsd) : null,
          ai_confidence_score: r.aiConfidenceScore ? String(r.aiConfidenceScore) : null,
          created_at: r.createdAt.toISOString(),
          thumb_url: thumbUrl
        }
      })

    const contentByFabric = await loadAiContentStatus(baseItems.map((it) => it.id))
    const items: AdminFabricListItem[] = baseItems.map((it) => {
      const c = contentByFabric.get(it.id)
      return {
        ...it,
        has_blog: c?.has_blog ?? false,
        blog_slug: c?.blog_slug ?? null,
        has_video: c?.has_video ?? false,
        video_post_id: c?.video_post_id ?? null,
        has_social: c?.has_social ?? false,
        social_post_id: c?.social_post_id ?? null
      }
    })

    return {
      items,
      total: totalRows[0]?.total ?? 0,
      counts
    }
  }

  public static async getById(id: number): Promise<AdminFabricDetail | null> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        sku: fabrics.sku,
        supplierId: fabrics.supplierId,
        supplierName: suppliers.name,
        status: fabrics.status,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        descriptionRu: fabrics.descriptionRu,
        descriptionEn: fabrics.descriptionEn,
        usageRu: fabrics.usageRu,
        usageEn: fabrics.usageEn,
        metaTitleRu: fabrics.metaTitleRu,
        metaTitleEn: fabrics.metaTitleEn,
        metaDescriptionRu: fabrics.metaDescriptionRu,
        metaDescriptionEn: fabrics.metaDescriptionEn,
        imageAltRu: fabrics.imageAltRu,
        imageAltEn: fabrics.imageAltEn,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        supplyType: fabrics.supplyType,
        supplyTypeEn: fabrics.supplyTypeEn,
        shipmentTime: fabrics.shipmentTime,
        shipmentTimeEn: fabrics.shipmentTimeEn,
        fabricType: fabrics.fabricType,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        moq: fabrics.moq,
        priceUsd: fabrics.priceUsd,
        composition: fabrics.composition,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        images: fabrics.images,
        sourceUrl: fabrics.sourceUrl,
        rawTitle: fabrics.rawTitle,
        rawDescription: fabrics.rawDescription,
        aiConfidenceScore: fabrics.aiConfidenceScore,
        aiProcessedAt: fabrics.aiProcessedAt,
        isFeatured: fabrics.isFeatured,
        createdAt: fabrics.createdAt,
        updatedAt: fabrics.updatedAt
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
      .limit(1)

    const r = rows[0]
    if (!r) return null

    const galleryImages = filterFabricGalleryImageUrls(r.images ?? undefined)

    return {
      id: r.id,
      slug: r.slug,
      sku: r.sku ?? null,
      supplier_id: r.supplierId,
      supplier_name: r.supplierName,
      status: r.status as AdminFabricStatus,

      title_ru: r.titleRu,
      title_en: r.titleEn ?? null,
      description_ru: r.descriptionRu ?? null,
      description_en: r.descriptionEn ?? null,
      usage_ru: r.usageRu ?? null,
      usage_en: r.usageEn ?? null,

      meta_title_ru: r.metaTitleRu ?? null,
      meta_title_en: r.metaTitleEn ?? null,
      meta_description_ru: r.metaDescriptionRu ?? null,
      meta_description_en: r.metaDescriptionEn ?? null,
      image_alt_ru: r.imageAltRu ?? null,
      image_alt_en: r.imageAltEn ?? null,

      color: r.color ?? null,
      color_en: r.colorEn ?? null,
      supply_type: r.supplyType ?? null,
      supply_type_en: r.supplyTypeEn ?? null,
      shipment_time: r.shipmentTime ?? null,
      shipment_time_en: r.shipmentTimeEn ?? null,

      fabric_type: r.fabricType ?? null,
      gsm: r.gsm,
      width_cm: r.widthCm,
      moq: r.moq,
      price_usd: r.priceUsd ? String(r.priceUsd) : null,

      composition: (r.composition as AdminFabricDetail['composition']) ?? null,
      tags: r.tags ?? null,
      tags_en: r.tagsEn ?? null,
      images: galleryImages.length > 0 ? galleryImages : null,

      source_url: r.sourceUrl ?? null,
      raw_title: r.rawTitle ?? null,
      raw_description: r.rawDescription ?? null,

      ai_confidence_score: r.aiConfidenceScore ? String(r.aiConfidenceScore) : null,
      ai_processed_at: toIso(r.aiProcessedAt),

      is_featured: Boolean(r.isFeatured),

      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString()
    }
  }

  public static async approve(id: number, adminId: number) {
    const db = getDb()
    await db.transaction(async (tx) => {
      // Update only if row exists and isn't already approved — makes the op
      // idempotent (re-clicks are no-ops) and guarantees we don't write a
      // phantom activity-log entry when the fabric was deleted mid-request.
      const updated = await tx
        .update(fabrics)
        .set({ status: 'approved', updatedAt: sql`now()` })
        .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt), ne(fabrics.status, 'approved')))
        .returning({ id: fabrics.id })

      if (updated.length === 0) {
        const existing = await tx
          .select({ id: fabrics.id })
          .from(fabrics)
          .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
          .limit(1)
        if (!existing[0]) throw new NotFoundError('Fabric not found')
        return
      }

      await tx.insert(fabricActivityLog).values({
        fabricId: id,
        actorId: adminId > 0 ? adminId : null,
        eventType: 'FABRIC_APPROVED',
        message: 'Fabric approved',
        payload: { id }
      })
    })
  }

  /** Records a supervision flag in fabric activity log (does not change fabric status). */
  public static async flagForSupervision(id: number, note: string | null, adminId: number) {
    const db = getDb()
    const row = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
      .limit(1)
    if (!row[0]) {
      throw new Error('Fabric not found')
    }
    const trimmed = note?.trim() ?? ''
    await db.insert(fabricActivityLog).values({
      fabricId: id,
      actorId: adminId > 0 ? adminId : null,
      eventType: 'FABRIC_SUPERVISION_FLAG',
      message: trimmed.length > 0 ? trimmed : 'Flagged for supervision from review queue',
      payload: { id, source: 'product_review_queue' }
    })
  }

  public static async reject(id: number, reason: string, adminId: number) {
    const db = getDb()
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(fabrics)
        .set({ status: 'rejected', updatedAt: sql`now()` })
        .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt), ne(fabrics.status, 'rejected')))
        .returning({ id: fabrics.id })

      if (updated.length === 0) {
        const existing = await tx
          .select({ id: fabrics.id })
          .from(fabrics)
          .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
          .limit(1)
        if (!existing[0]) throw new NotFoundError('Fabric not found')
        return
      }

      await tx.insert(fabricActivityLog).values({
        fabricId: id,
        actorId: adminId > 0 ? adminId : null,
        eventType: 'FABRIC_REJECTED',
        message: reason.trim().length > 0 ? `Fabric rejected: ${reason.trim()}` : 'Fabric rejected',
        payload: { id, reason }
      })
    })
  }

  public static async bulkApprove(ids: number[], adminId: number) {
    if (ids.length === 0) return
    const db = getDb()
    await db.transaction(async (tx) => {
      // Only log rows that actually changed — skips deleted, missing, and
      // already-approved items so the activity log matches real state changes.
      const updated = await tx
        .update(fabrics)
        .set({ status: 'approved', updatedAt: sql`now()` })
        .where(and(isNull(fabrics.deletedAt), inArray(fabrics.id, ids), ne(fabrics.status, 'approved')))
        .returning({ id: fabrics.id })

      if (updated.length > 0) {
        await tx.insert(fabricActivityLog).values(
          updated.map(({ id }) => ({
            fabricId: id,
            actorId: adminId > 0 ? adminId : null,
            eventType: 'FABRIC_APPROVED',
            message: 'Fabric approved (bulk)',
            payload: { id, bulk: true }
          }))
        )
      }
    })
  }

  public static async bulkReject(ids: number[], reason: string, adminId: number) {
    if (ids.length === 0) return
    const db = getDb()
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(fabrics)
        .set({ status: 'rejected', updatedAt: sql`now()` })
        .where(and(isNull(fabrics.deletedAt), inArray(fabrics.id, ids), ne(fabrics.status, 'rejected')))
        .returning({ id: fabrics.id })

      if (updated.length > 0) {
        await tx.insert(fabricActivityLog).values(
          updated.map(({ id }) => ({
            fabricId: id,
            actorId: adminId > 0 ? adminId : null,
            eventType: 'FABRIC_REJECTED',
            message: reason.trim().length > 0 ? `Fabric rejected (bulk): ${reason.trim()}` : 'Fabric rejected (bulk)',
            payload: { id, reason, bulk: true }
          }))
        )
      }
    })
  }

  public static async update(id: number, input: AdminFabricUpdateInput, adminId: number) {
    const db = getDb()
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(fabrics)
        .set({
          titleRu: input.title_ru,
          titleEn: input.title_en,
          descriptionRu: input.description_ru,
          descriptionEn: input.description_en,
          usageRu: input.usage_ru ?? null,
          usageEn: input.usage_en ?? null,
          fabricType: input.fabric_type as never,
          gsm: input.gsm,
          widthCm: input.width_cm,
          moq: input.moq,
          priceUsd: input.price_usd as never,
          composition: input.composition as never,
          tags: input.tags as never,
          tagsEn: input.tags_en as never,
          metaTitleRu: input.meta_title_ru ?? null,
          metaTitleEn: input.meta_title_en ?? null,
          metaDescriptionRu: input.meta_description_ru ?? null,
          metaDescriptionEn: input.meta_description_en ?? null,
          imageAltRu: input.image_alt_ru ?? null,
          imageAltEn: input.image_alt_en ?? null,
          color: input.color ?? null,
          colorEn: input.color_en ?? null,
          supplyType: input.supply_type ?? null,
          supplyTypeEn: input.supply_type_en ?? null,
          shipmentTime: input.shipment_time ?? null,
          shipmentTimeEn: input.shipment_time_en ?? null,
          isFeatured: input.is_featured,
          updatedAt: sql`now()`
        })
        .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
        .returning({ id: fabrics.id })

      if (updated.length === 0) throw new NotFoundError('Fabric not found')

      await tx.insert(fabricActivityLog).values({
        fabricId: id,
        actorId: adminId > 0 ? adminId : null,
        eventType: 'FABRIC_UPDATED',
        message: 'Fabric updated',
        payload: { id }
      })
    })
  }

  public static async getPublishedTodayCount(): Promise<number> {
    const db = getDb()
    const today = startOfTodayUtc()
    const rows = await db
      .select({ total: count() })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'), gte(fabrics.updatedAt, today)))
    return rows[0]?.total ?? 0
  }

  static async resolveSupplierByName(name: string): Promise<number> {
    const db = getDb()
    const trimmed = name.trim()
    const slug = AdminFabricService.slugifyForSlug(trimmed)

    const existing = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.slug, slug), isNull(suppliers.deletedAt)))
      .limit(1)

    if (existing[0]) return existing[0].id

    const [created] = await db
      .insert(suppliers)
      .values({ name: trimmed, slug, country: 'China' })
      .returning({ id: suppliers.id })

    if (!created) throw new Error('Failed to create supplier')
    logger.info('Supplier auto-created during bulk import', { name: trimmed, id: created.id })
    return created.id
  }

  public static async bulkCreate(params: {
    supplierId: number
    rows: Array<{
      titleRu: string
      titleEn?: string | null
      fabricType?: string | null
      gsm?: number | null
      widthCm?: number | null
      priceUsd?: string | null
      moq?: number | null
      tags?: string[] | null
      sku?: string | null
      usageRu?: string | null
      usageEn?: string | null
      descriptionRu?: string | null
      descriptionEn?: string | null
      tagsEn?: string[] | null
      color?: string | null
      colorEn?: string | null
      supplyType?: string | null
      supplyTypeEn?: string | null
      shipmentTime?: string | null
      shipmentTimeEn?: string | null
      composition?: FabricCompositionItem[] | null
      images?: string[] | null
    }>
    adminId: number
  }): Promise<{ ids: number[] }> {
    const db = getDb()
    if (params.rows.length === 0) throw new Error('No rows provided')
    if (params.rows.length > 200) throw new Error('Maximum 200 rows per batch')

    const sup = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(eq(suppliers.id, params.supplierId), isNull(suppliers.deletedAt)))
      .limit(1)
    if (!sup[0]) throw new NotFoundError('Supplier not found')

    const ts = Date.now().toString(36)
    const candidateSlugs = params.rows.map((row, idx) => {
      const base = AdminFabricService.slugifyForSlug(row.titleRu.trim())
      return `${base}-${ts}-${idx}`
    })

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ slug: fabrics.slug })
        .from(fabrics)
        .where(inArray(fabrics.slug, candidateSlugs))

      const existingSet = new Set(existing.map((r) => r.slug))
      const finalSlugs = candidateSlugs.map((slug) => {
        if (!existingSet.has(slug)) return slug
        return `${slug}-${Math.random().toString(36).slice(2, 8)}`
      })

      const values = params.rows.map((row, idx) => ({
        supplierId: params.supplierId,
        slug: finalSlugs[idx] as string,
        sku: row.sku?.trim() || null,
        status: 'raw_scraped' as const,
        titleRu: row.titleRu.trim(),
        titleEn: row.titleEn?.trim() || null,
        descriptionRu: row.descriptionRu?.trim() || null,
        descriptionEn: row.descriptionEn?.trim() || null,
        usageRu: row.usageRu?.trim() || null,
        metaTitleRu: null,
        metaDescriptionRu: null,
        metaTitleEn: null,
        metaDescriptionEn: null,
        imageAltRu: null,
        imageAltEn: null,
        fabricType: (row.fabricType as typeof fabrics.$inferInsert.fabricType) ?? null,
        gsm: row.gsm ?? null,
        widthCm: row.widthCm ?? null,
        color: row.color?.trim() || null,
        colorEn: row.colorEn?.trim() || null,
        supplyType: row.supplyType?.trim() || null,
        supplyTypeEn: row.supplyTypeEn?.trim() || null,
        shipmentTime: row.shipmentTime?.trim() || null,
        shipmentTimeEn: row.shipmentTimeEn?.trim() || null,
        priceUsd: row.priceUsd ?? null,
        moq: row.moq ?? null,
        composition: row.composition as typeof fabrics.$inferInsert.composition ?? null,
        tags: row.tags ?? null,
        tagsEn: row.tagsEn ?? null,
        images: row.images ?? null,
        sourceUrl: null,
        rawTitle: null,
        rawDescription: null,
        aiConfidenceScore: null,
        aiProcessedAt: null,
        isFeatured: false,
        socialScore: null,
        viewsCount: 0,
        updatedAt: new Date(),
        deletedAt: null
      }))

      const inserted = await tx
        .insert(fabrics)
        .values(values)
        .returning({ id: fabrics.id })

      const ids = inserted.map((r) => r.id)

      if (ids.length > 0) {
        await tx.insert(fabricActivityLog).values(
          ids.map((id) => ({
            fabricId: id,
            actorId: params.adminId > 0 ? params.adminId : null,
            eventType: 'FABRIC_CREATED',
            message: 'Fabric created (bulk)',
            payload: { id, bulk: true, batchSize: ids.length }
          }))
        )

        const fabricTypeSlugs = params.rows
          .map((r) => r.fabricType)
          .filter((t): t is string => typeof t === 'string' && t.length > 0)
        if (fabricTypeSlugs.length > 0) {
          await AdminFabricTypesService.ensureFabricTypesExist(fabricTypeSlugs)
        }

        // Fire-and-forget AI enrichment for each created fabric
        import('@/lib/queue/helpers').then(({ addAIJob: enqueue }) => {
          for (const id of ids) {
            enqueue(id).catch((err: Error) => {
              logger.error('Failed to enqueue AI job after bulk create', { fabricId: id, message: err.message })
            })
          }
        })
      }

      return { ids }
    })
  }
}

