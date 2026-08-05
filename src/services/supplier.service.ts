import { and, asc, count, eq, ilike, inArray, isNull } from 'drizzle-orm'
import { getDb } from '@/db'
import { suppliers } from '@/db/schema/suppliers.schema'
import { fabrics } from '@/db/schema/fabrics.schema'
import type {
  FabricSummary,
  PaginatedResult,
  SupplierDetail,
  SupplierProfileInsights,
  SupplierSummary
} from '@/types/marketplace.types'

export class SupplierService {
  public static async list(params: {
    page: number
    limit: number
    q?: string
    fabricType?: string
  }): Promise<PaginatedResult<SupplierSummary>> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit

    let supplierIdFilter: number[] | undefined
    if (params.fabricType) {
      const match = await db
        .select({ id: fabrics.supplierId })
        .from(fabrics)
        .where(
          and(
            isNull(fabrics.deletedAt),
            eq(fabrics.status, 'approved'),
            eq(fabrics.fabricType, params.fabricType)
          )
        )
        .groupBy(fabrics.supplierId)
      supplierIdFilter = match.map((m) => m.id)
      if (supplierIdFilter.length === 0) {
        return { items: [], total: 0 }
      }
    }

    let whereClause = and(isNull(suppliers.deletedAt), eq(suppliers.verified, true))
    if (supplierIdFilter) {
      whereClause = and(whereClause, inArray(suppliers.id, supplierIdFilter))
    }
    if (params.q) {
      const q = `%${params.q}%`
      whereClause = and(whereClause, ilike(suppliers.name, q))
    }

    const totalRows = await db.select({ total: count() }).from(suppliers).where(whereClause)

    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: suppliers.id,
        slug: suppliers.slug,
        name: suppliers.name,
        logoUrl: suppliers.logoUrl,
        verified: suppliers.verified,
        country: suppliers.country,
        city: suppliers.city,
        province: suppliers.province
      })
      .from(suppliers)
      .where(whereClause)
      .orderBy(asc(suppliers.name))
      .limit(params.limit)
      .offset(offset)

    const baseItems: SupplierSummary[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      logoUrl: r.logoUrl,
      verified: r.verified,
      country: r.country,
      city: r.city,
      province: r.province
    }))

    const items = await SupplierService.attachCatalogPreview(baseItems)
    return { items, total }
  }

  private static async attachCatalogPreview(items: SupplierSummary[]): Promise<SupplierSummary[]> {
    if (items.length === 0) return items
    const db = getDb()
    const ids = items.map((i) => i.id)

    const fabricRows = await db
      .select({
        supplierId: fabrics.supplierId,
        id: fabrics.id,
        images: fabrics.images,
        fabricType: fabrics.fabricType
      })
      .from(fabrics)
      .where(
        and(
          inArray(fabrics.supplierId, ids),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )
      .orderBy(fabrics.supplierId, fabrics.id)

    const firstBySupplier = new Map<number, (typeof fabricRows)[0]>()
    for (const f of fabricRows) {
      if (!firstBySupplier.has(f.supplierId)) firstBySupplier.set(f.supplierId, f)
    }

    const countRows = await db
      .select({ supplierId: fabrics.supplierId, c: count() })
      .from(fabrics)
      .where(
        and(
          inArray(fabrics.supplierId, ids),
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved')
        )
      )
      .groupBy(fabrics.supplierId)
    const countMap = new Map(countRows.map((r) => [r.supplierId, r.c]))

    return items.map((s) => {
      const first = firstBySupplier.get(s.id)
      const cover = first?.images?.[0] ?? null
      return {
        ...s,
        catalogPreview: {
          approvedFabricCount: countMap.get(s.id) ?? 0,
          coverImageUrl: cover,
          focusFabricType: first?.fabricType ?? null
        }
      }
    })
  }

  public static async getBySlug(slug: string): Promise<SupplierDetail | null> {
    const db = getDb()
    const row = await db
      .select()
      .from(suppliers)
      .where(and(isNull(suppliers.deletedAt), eq(suppliers.slug, slug)))
      .limit(1)

    const s = row[0]
    if (!s) return null

    const featuredFabrics = await SupplierService.getFeaturedFabricsBySupplierId(s.id, 6)
    const insights = await SupplierService.getProfileInsights(s.id)

    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      logoUrl: s.logoUrl,
      verified: s.verified,
      country: s.country,
      city: s.city,
      province: s.province,
      description: s.description,
      websiteUrl: s.websiteUrl,
      establishedYear: s.establishedYear,
      featuredFabrics,
      insights
    }
  }

  private static async getProfileInsights(supplierId: number): Promise<SupplierProfileInsights> {
    const db = getDb()
    const rows = await db
      .select({
        moq: fabrics.moq,
        tags: fabrics.tags,
        fabricType: fabrics.fabricType
      })
      .from(fabrics)
      .where(
        and(
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved'),
          eq(fabrics.supplierId, supplierId)
        )
      )

    const tagCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    const moqs: number[] = []
    for (const r of rows) {
      if (r.moq != null) moqs.push(r.moq)
      for (const t of r.tags ?? []) {
        const k = t.trim()
        if (!k) continue
        tagCounts.set(k, (tagCounts.get(k) ?? 0) + 1)
      }
      const ft = r.fabricType ?? 'other'
      typeCounts.set(ft, (typeCounts.get(ft) ?? 0) + 1)
    }

    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([k]) => k)

    const fabricTypeCounts = [...typeCounts.entries()]
      .map(([fabricType, count]) => ({ fabricType, count }))
      .sort((a, b) => b.count - a.count)

    return {
      approvedFabricCount: rows.length,
      topTags,
      moqMin: moqs.length > 0 ? Math.min(...moqs) : null,
      moqMax: moqs.length > 0 ? Math.max(...moqs) : null,
      fabricTypeCounts
    }
  }

  public static async getFeaturedFabricsBySupplierId(
    supplierId: number,
    limit: number = 8
  ): Promise<FabricSummary[]> {
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
      .where(
        and(
          isNull(fabrics.deletedAt),
          eq(fabrics.status, 'approved'),
          eq(fabrics.supplierId, supplierId)
        )
      )
      .orderBy(fabrics.createdAt)
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
      color: r.color ?? null,
      colorEn: r.colorEn ?? null,
      supplyType: r.supplyType ?? null,
      supplyTypeEn: r.supplyTypeEn ?? null,
      shipmentTime: r.shipmentTime ?? null,
      shipmentTimeEn: r.shipmentTimeEn ?? null,
      hasVideo: false,
      thumbnailUrl: null
    }))
  }
}

