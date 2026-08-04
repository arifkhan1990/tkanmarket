import { and, arrayOverlaps, asc, count, desc, eq, exists, gte, ilike, inArray, isNull, lte, ne, or, sql } from 'drizzle-orm'
import { countDistinct } from 'drizzle-orm/sql/functions/aggregate'

import { getDb } from '@/db'
import { fabricCategoryTerms } from '@/db/schema/fabric-category-terms.schema'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type { FabricDetail, FabricSummary, JunctionCategoryCount, PaginatedResult } from '@/types/marketplace.types'
import type { FabricQueryParams } from '@/lib/validations/fabric.validation'

type FabricJoinRow = {
  fabric: typeof fabrics.$inferSelect
  supplier: typeof suppliers.$inferSelect
}

type RelatedSeed = {
  id: number
  fabricType: typeof fabrics.$inferSelect['fabricType']
  tags: typeof fabrics.$inferSelect['tags']
}

type RelatedSummaryRow = {
  id: number
  slug: string
  titleRu: string
  titleEn: string | null
  fabricType: FabricSummary['fabricType']
  gsm: number | null
  widthCm: number | null
  priceUsd: string | null
  moq: number | null
  tags: string[] | null
  tagsEn: string[] | null
  images: string[] | null
  supplierName: string
  color: string | null
  colorEn: string | null
  supplyType: string | null
  supplyTypeEn: string | null
  shipmentTime: string | null
  shipmentTimeEn: string | null
}

function mapJoinRowToDetail(row: FabricJoinRow): FabricDetail {
  const aiProcessedAt = row.fabric.aiProcessedAt ? new Date(row.fabric.aiProcessedAt).toISOString() : null

  return {
    id: row.fabric.id,
    slug: row.fabric.slug,
    titleRu: row.fabric.titleRu,
    titleEn: row.fabric.titleEn,
    fabricType: row.fabric.fabricType,
    gsm: row.fabric.gsm,
    widthCm: row.fabric.widthCm,
    priceUsd: row.fabric.priceUsd ? String(row.fabric.priceUsd) : null,
    moq: row.fabric.moq,
    supplierName: row.supplier.name,
    imageUrl: row.fabric.images?.[0] ?? null,
    tags: row.fabric.tags ?? [],
    tagsEn: row.fabric.tagsEn ?? null,
    color: row.fabric.color ?? null,
    colorEn: row.fabric.colorEn ?? null,
    supplyType: row.fabric.supplyType ?? null,
    supplyTypeEn: row.fabric.supplyTypeEn ?? null,
    shipmentTime: row.fabric.shipmentTime ?? null,
    shipmentTimeEn: row.fabric.shipmentTimeEn ?? null,

    descriptionRu: row.fabric.descriptionRu ?? '',
    descriptionEn: row.fabric.descriptionEn,
    usageRu: row.fabric.usageRu ?? null,
    usageEn: row.fabric.usageEn ?? null,
    metaTitleRu: row.fabric.metaTitleRu,
    metaDescriptionRu: row.fabric.metaDescriptionRu,
    metaTitleEn: row.fabric.metaTitleEn,
    metaDescriptionEn: row.fabric.metaDescriptionEn,
    imageAltRu: row.fabric.imageAltRu,
    imageAltEn: row.fabric.imageAltEn,
    sku: row.fabric.sku,
    sourceUrl: row.fabric.sourceUrl,
    rawTitle: row.fabric.rawTitle,
    rawDescription: row.fabric.rawDescription,
    aiConfidenceScore: row.fabric.aiConfidenceScore ? String(row.fabric.aiConfidenceScore) : null,
    aiProcessedAt,
    isFeatured: row.fabric.isFeatured,
    socialScore: row.fabric.socialScore,
    viewsCount: row.fabric.viewsCount ?? 0,
    composition: row.fabric.composition ?? null,
    images: row.fabric.images ?? [],

    supplier: {
      id: row.supplier.id,
      name: row.supplier.name,
      slug: row.supplier.slug,
      verified: row.supplier.verified,
      country: row.supplier.country,
      city: row.supplier.city,
      province: row.supplier.province,
      logoUrl: row.supplier.logoUrl
    }
  }
}

export class FabricService {
  private static mapRelatedSummaryRows(rows: RelatedSummaryRow[]): FabricSummary[] {
    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      titleRu: r.titleRu,
      titleEn: r.titleEn ?? null,
      fabricType: r.fabricType,
      gsm: r.gsm,
      widthCm: r.widthCm,
      priceUsd: r.priceUsd,
      moq: r.moq,
      supplierName: r.supplierName,
      imageUrl: r.images?.[0] ?? null,
      tags: r.tags ?? [],
      tagsEn: r.tagsEn ?? null,
      color: r.color ?? null,
      colorEn: r.colorEn ?? null,
      supplyType: r.supplyType ?? null,
      supplyTypeEn: r.supplyTypeEn ?? null,
      shipmentTime: r.shipmentTime ?? null,
      shipmentTimeEn: r.shipmentTimeEn ?? null
    }))
  }

  public static async getTopViewedSlugs(limit: number = 500): Promise<Array<{ slug: string }>> {
    const db = getDb()
    const rows = await db
      .select({ slug: fabrics.slug })
      .from(fabrics)
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .orderBy(desc(fabrics.viewsCount))
      .limit(limit)
    return rows
  }

  public static async list(params: FabricQueryParams): Promise<PaginatedResult<FabricSummary>> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    let whereClause = and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'))

    if (params.q) {
      const q = `%${params.q}%`
      whereClause = and(
        whereClause,
        or(ilike(fabrics.titleRu, q), ilike(fabrics.titleEn, q), ilike(fabrics.descriptionRu, q), ilike(fabrics.descriptionEn, q))
      )
    }

    if (params.material && params.material.length > 0) {
      whereClause = and(whereClause, arrayOverlaps(fabrics.tags, params.material))
    }

    if (params.fabric_type) {
      whereClause = and(whereClause, eq(fabrics.fabricType, params.fabric_type))
    }

    if (typeof params.gsm_min === 'number') {
      whereClause = and(whereClause, gte(fabrics.gsm, params.gsm_min))
    }
    if (typeof params.gsm_max === 'number') {
      whereClause = and(whereClause, lte(fabrics.gsm, params.gsm_max))
    }
    if (typeof params.price_usd_min === 'number') {
      whereClause = and(whereClause, gte(fabrics.priceUsd, String(params.price_usd_min)))
    }
    if (typeof params.price_usd_max === 'number') {
      whereClause = and(whereClause, lte(fabrics.priceUsd, String(params.price_usd_max)))
    }
    const widthMin = typeof params.width === 'number' ? params.width : params.width_min
    const widthMax = typeof params.width === 'number' ? params.width : params.width_max
    if (typeof widthMin === 'number') {
      whereClause = and(whereClause, gte(fabrics.widthCm, widthMin))
    }
    if (typeof widthMax === 'number') {
      whereClause = and(whereClause, lte(fabrics.widthCm, widthMax))
    }
    if (typeof params.moq_min === 'number') {
      whereClause = and(whereClause, gte(fabrics.moq, params.moq_min))
    }
    if (typeof params.moq_max === 'number') {
      whereClause = and(whereClause, lte(fabrics.moq, params.moq_max))
    }
    if (typeof params.supplier_id === 'number') {
      whereClause = and(whereClause, eq(fabrics.supplierId, params.supplier_id))
    }

    if (params.category_slug && params.category_slug.trim().length > 0) {
      const cs = params.category_slug.trim()
      whereClause = and(
        whereClause,
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

    const sort = params.sort ?? 'created_at_desc'
    const orderBy =
      sort === 'gsm_asc'
        ? asc(fabrics.gsm)
        : sort === 'price_usd_asc'
          ? asc(fabrics.priceUsd)
          : sort === 'price_usd_desc'
            ? desc(fabrics.priceUsd)
            : desc(fabrics.createdAt)

    const totalRows = await db.select({ total: count() }).from(fabrics).where(whereClause)

    const total = totalRows[0]?.total ?? 0

    const [supplierRow] = await db
      .select({ n: countDistinct(fabrics.supplierId) })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(whereClause)

    const supplierCount = Number(supplierRow?.n ?? 0)

    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        fabricType: fabrics.fabricType,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        images: fabrics.images,
        supplierName: suppliers.name,
        sku: fabrics.sku,
        socialScore: fabrics.socialScore,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        supplyType: fabrics.supplyType,
        supplyTypeEn: fabrics.supplyTypeEn,
        shipmentTime: fabrics.shipmentTime,
        shipmentTimeEn: fabrics.shipmentTimeEn
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(params.limit)
      .offset(offset)

    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        titleRu: r.titleRu,
        titleEn: r.titleEn ?? null,
        fabricType: r.fabricType,
        gsm: r.gsm,
        widthCm: r.widthCm,
        priceUsd: r.priceUsd ? String(r.priceUsd) : null,
        moq: r.moq,
        supplierName: r.supplierName,
        imageUrl: r.images?.[0] ?? null,
        tags: r.tags ?? [],
        tagsEn: r.tagsEn ?? null,
        sku: r.sku,
        socialScore: r.socialScore,
        color: r.color ?? null,
        colorEn: r.colorEn ?? null,
        supplyType: r.supplyType ?? null,
        supplyTypeEn: r.supplyTypeEn ?? null,
        shipmentTime: r.shipmentTime ?? null,
        shipmentTimeEn: r.shipmentTimeEn ?? null
      })),
      total,
      supplierCount
    }
  }

  public static async getBySlug(slug: string): Promise<FabricDetail | null> {
    const db = getDb()
    const rows = await db
      .select({
        fabric: fabrics,
        supplier: suppliers
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.slug, slug), eq(fabrics.status, 'approved')))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    return mapJoinRowToDetail(row)
  }

  public static async getById(id: number): Promise<FabricDetail | null> {
    const db = getDb()
    const rows = await db
      .select({
        fabric: fabrics,
        supplier: suppliers
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.id, id), eq(fabrics.status, 'approved')))
      .limit(1)

    const row = rows[0]
    if (!row) return null

    return mapJoinRowToDetail(row)
  }

  /** Up to 4 approved fabrics, order preserved, missing ids skipped. */
  public static async getByIdsForCompare(ids: number[]): Promise<FabricDetail[]> {
    const unique = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 4)
    if (unique.length === 0) return []

    const db = getDb()
    const rows = await db
      .select({
        fabric: fabrics,
        supplier: suppliers
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'), inArray(fabrics.id, unique)))

    const mapped = new Map<number, FabricDetail>()
    for (const row of rows) {
      mapped.set(row.fabric.id, mapJoinRowToDetail(row))
    }

    return unique.map((id) => mapped.get(id)).filter((f): f is FabricDetail => Boolean(f))
  }

  public static async incrementViewsCount(id: number): Promise<void> {
    const db = getDb()
    try {
      await db
        .update(fabrics)
        .set({
          viewsCount: sql`${fabrics.viewsCount} + 1`,
          updatedAt: sql`now()`
        })
        .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
    } catch {
      // best-effort, never block response
    }
  }

  /**
   * Single-query related fabrics.
   * Uses a CTE (`self`) and filters by:
   * - same type OR overlapping tags (when tags exist), else same type only
   */
  private static async getRelatedSingleQuery(args: {
    by: 'id' | 'slug'
    value: number | string
    limit: number
  }): Promise<FabricSummary[]> {
    const db = getDb()
    const approved = sql`'approved'`

    const selfFilter =
      args.by === 'id'
        ? sql`${fabrics.id} = ${args.value as number}`
        : sql`${fabrics.slug} = ${args.value as string}`

    const result = await db.execute<RelatedSummaryRow>(sql`
      WITH self AS (
        SELECT
          ${fabrics.id} AS id,
          ${fabrics.fabricType} AS fabric_type,
          ${fabrics.tags} AS tags
        FROM ${fabrics}
        WHERE ${fabrics.deletedAt} IS NULL
          AND ${fabrics.status} = ${approved}
          AND ${selfFilter}
        LIMIT 1
      )
      SELECT
        ${fabrics.id} AS id,
        ${fabrics.slug} AS slug,
        ${fabrics.titleRu} AS "titleRu",
        ${fabrics.titleEn} AS "titleEn",
        ${fabrics.fabricType} AS "fabricType",
        ${fabrics.gsm} AS gsm,
        ${fabrics.widthCm} AS "widthCm",
        ${fabrics.priceUsd}::text AS "priceUsd",
        ${fabrics.moq} AS moq,
        ${fabrics.tags} AS tags,
        ${fabrics.tagsEn} AS "tagsEn",
        ${fabrics.images} AS images,
        ${fabrics.color} AS color,
        ${fabrics.colorEn} AS "colorEn",
        ${fabrics.supplyType} AS "supplyType",
        ${fabrics.supplyTypeEn} AS "supplyTypeEn",
        ${fabrics.shipmentTime} AS "shipmentTime",
        ${fabrics.shipmentTimeEn} AS "shipmentTimeEn",
        ${suppliers.name} AS "supplierName"
      FROM ${fabrics}
      INNER JOIN ${suppliers} ON ${fabrics.supplierId} = ${suppliers.id}
      CROSS JOIN self
      WHERE ${fabrics.deletedAt} IS NULL
        AND ${fabrics.status} = ${approved}
        AND ${fabrics.id} <> self.id
        AND (
          (
            coalesce(cardinality(self.tags), 0) > 0
            AND (
              (self.fabric_type IS NOT NULL AND ${fabrics.fabricType} = self.fabric_type)
              OR (${fabrics.tags} && self.tags)
            )
          )
          OR
          (
            coalesce(cardinality(self.tags), 0) = 0
            AND self.fabric_type IS NOT NULL
            AND ${fabrics.fabricType} = self.fabric_type
          )
        )
      LIMIT ${args.limit}
    `)

    const rows = Array.isArray(result) ? result : []
    return this.mapRelatedSummaryRows(rows)
  }

  public static async getRelated(fabricId: number, limit: number = 8): Promise<FabricSummary[]> {
    return this.getRelatedSingleQuery({ by: 'id', value: fabricId, limit })
  }

  public static async getRelatedBySlug(slug: string, limit: number = 8): Promise<FabricSummary[]> {
    return this.getRelatedSingleQuery({ by: 'slug', value: slug, limit })
  }

  public static async getFeatured(limit: number = 8): Promise<FabricSummary[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        titleRu: fabrics.titleRu,
        titleEn: fabrics.titleEn,
        fabricType: fabrics.fabricType,
        gsm: fabrics.gsm,
        widthCm: fabrics.widthCm,
        priceUsd: fabrics.priceUsd,
        moq: fabrics.moq,
        tags: fabrics.tags,
        tagsEn: fabrics.tagsEn,
        images: fabrics.images,
        sku: fabrics.sku,
        socialScore: fabrics.socialScore,
        supplierName: suppliers.name,
        color: fabrics.color,
        colorEn: fabrics.colorEn,
        supplyType: fabrics.supplyType,
        supplyTypeEn: fabrics.supplyTypeEn,
        shipmentTime: fabrics.shipmentTime,
        shipmentTimeEn: fabrics.shipmentTimeEn
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
      .orderBy(
        desc(fabrics.isFeatured),
        desc(sql`(CASE WHEN coalesce(cardinality(${fabrics.images}), 0) > 0 THEN 1 ELSE 0 END)`),
        desc(fabrics.createdAt)
      )
      .limit(limit)

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      titleRu: r.titleRu,
      titleEn: r.titleEn ?? null,
      fabricType: r.fabricType,
      gsm: r.gsm,
      widthCm: r.widthCm,
      priceUsd: r.priceUsd ? String(r.priceUsd) : null,
      moq: r.moq,
      supplierName: r.supplierName,
      imageUrl: r.images?.[0] ?? null,
      tags: r.tags ?? [],
      tagsEn: r.tagsEn ?? null,
      sku: r.sku,
      socialScore: r.socialScore,
      color: r.color ?? null,
      colorEn: r.colorEn ?? null,
      supplyType: r.supplyType ?? null,
      supplyTypeEn: r.supplyTypeEn ?? null,
      shipmentTime: r.shipmentTime ?? null,
      shipmentTimeEn: r.shipmentTimeEn ?? null
    }))
  }

  /**
   * Homepage / public category tiles.
   * Source of truth: `fabric_category_terms` + junction `fabric_categories`.
   * Returns ACTIVE, non-deleted terms with counts of approved fabrics.
   */
  public static async getCategoryCounts(): Promise<Array<{ category: string; count: number }>> {
    const db = getDb()
    try {
      const rows = await db
        .select({
          category: fabricCategoryTerms.slug,
          count: countDistinct(fabrics.id)
        })
        .from(fabricCategoryTerms)
        .innerJoin(fabricCategories, eq(fabricCategories.categorySlug, fabricCategoryTerms.slug))
        .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
        .where(
          and(
            isNull(fabricCategoryTerms.deletedAt),
            eq(fabricCategoryTerms.isActive, true),
            isNull(fabricCategories.deletedAt),
            isNull(fabrics.deletedAt),
            eq(fabrics.status, 'approved')
          )
        )
        .groupBy(fabricCategoryTerms.slug)
        .orderBy(desc(countDistinct(fabrics.id)))
        .limit(12)

      // If the terms table is present but the junction isn't populated yet, return 0 rows.
      // Fall back to counting by `fabrics.tags` to keep the homepage usable during migrations/backfills.
      if (rows.length > 0) {
        return rows.map((r) => ({ category: r.category, count: Number(r.count) }))
      }

      const tagsFallback = await db.execute<{ category: string; count: number }>(sql`
        SELECT
          ${fabricCategoryTerms.slug} AS category,
          count(distinct ${fabrics.id})::int AS count
        FROM ${fabricCategoryTerms}
        INNER JOIN ${fabrics}
          ON ${fabrics.deletedAt} IS NULL
          AND ${fabrics.status} = 'approved'
          AND coalesce(${fabrics.tags}, '{}'::text[]) && ARRAY[${fabricCategoryTerms.slug}]
        WHERE ${fabricCategoryTerms.deletedAt} IS NULL
          AND ${fabricCategoryTerms.isActive} = true
        GROUP BY ${fabricCategoryTerms.slug}
        ORDER BY count(distinct ${fabrics.id}) DESC
        LIMIT 12
      `)

      const tf = Array.isArray(tagsFallback) ? tagsFallback : []
      return tf.map((r) => ({ category: r.category, count: Number(r.count) }))
    } catch {
      // Fallback for environments without the new terms table.
      const legacy = await db
        .select({
          category: fabricCategories.categorySlug,
          count: countDistinct(fabrics.id)
        })
        .from(fabricCategories)
        .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
        .where(and(isNull(fabricCategories.deletedAt), isNull(fabrics.deletedAt), eq(fabrics.status, 'approved')))
        .groupBy(fabricCategories.categorySlug)
        .orderBy(desc(countDistinct(fabrics.id)))
        .limit(12)

      if (legacy.length > 0) {
        return legacy.map((r) => ({ category: r.category, count: Number(r.count) }))
      }

      // Last-resort fallback: count by distinct tag values among approved fabrics.
      const tagRows = await db.execute<{ category: string; count: number }>(sql`
        SELECT
          tag AS category,
          count(distinct ${fabrics.id})::int AS count
        FROM ${fabrics}
        CROSS JOIN LATERAL unnest(coalesce(${fabrics.tags}, '{}'::text[])) AS tag
        WHERE ${fabrics.deletedAt} IS NULL
          AND ${fabrics.status} = 'approved'
        GROUP BY tag
        ORDER BY count(distinct ${fabrics.id}) DESC
        LIMIT 12
      `)

      const tr = Array.isArray(tagRows) ? tagRows : []
      return tr.map((r) => ({ category: r.category, count: Number(r.count) }))
    }
  }

  /** Approved fabrics per junction `category_slug`, for catalog sidebar (distinct fabric ids). */
  public static async getJunctionCategoryCounts(): Promise<JunctionCategoryCount[]> {
    const db = getDb()
    try {
      const rows = await db
        .select({
          slug: fabricCategories.categorySlug,
          nameRu: fabricCategoryTerms.nameRu,
          nameEn: fabricCategoryTerms.nameEn,
          count: countDistinct(fabrics.id)
        })
        .from(fabricCategories)
        .innerJoin(fabricCategoryTerms, eq(fabricCategories.categorySlug, fabricCategoryTerms.slug))
        .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
        .where(
          and(
            isNull(fabrics.deletedAt),
            eq(fabrics.status, 'approved'),
            isNull(fabricCategories.deletedAt),
            isNull(fabricCategoryTerms.deletedAt),
            eq(fabricCategoryTerms.isActive, true)
          )
        )
        .groupBy(fabricCategories.categorySlug)

      return rows
        .map((r) => ({ slug: r.slug, name_ru: r.nameRu, name_en: r.nameEn ?? null, count: Number(r.count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
    } catch {
      const legacy = await db
        .select({
          slug: fabricCategories.categorySlug,
          count: countDistinct(fabrics.id)
        })
        .from(fabricCategories)
        .innerJoin(fabrics, eq(fabricCategories.fabricId, fabrics.id))
        .where(and(isNull(fabrics.deletedAt), eq(fabrics.status, 'approved'), isNull(fabricCategories.deletedAt)))
        .groupBy(fabricCategories.categorySlug)

      return legacy
        .map((r) => ({ slug: r.slug, name_ru: r.slug, name_en: null, count: Number(r.count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)
    }
  }
}

