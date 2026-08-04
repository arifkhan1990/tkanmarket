import { and, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  AdminBulkSeoListResponse,
  AdminBulkSeoQuery,
  AdminBulkSeoStats,
  AdminBulkSeoUpdateItem
} from '@/types/admin-bulk-seo.types'

function firstImageUrl(images: string[] | null): string | null {
  if (!images || images.length === 0) return null
  return images[0] ?? null
}

export class AdminBulkSeoService {
  public static async getStats(): Promise<AdminBulkSeoStats> {
    const db = getDb()
    const base = isNull(fabrics.deletedAt)

    const [totalRows, missingRows] = await Promise.all([
      db.select({ c: count() }).from(fabrics).where(base),
      db
        .select({ c: count() })
        .from(fabrics)
        .where(
          and(
            base,
            or(
              isNull(fabrics.metaTitleRu),
              eq(fabrics.metaTitleRu, ''),
              isNull(fabrics.metaDescriptionRu),
              eq(fabrics.metaDescriptionRu, ''),
              isNull(fabrics.imageAltRu),
              eq(fabrics.imageAltRu, ''),
              isNull(fabrics.metaTitleEn),
              eq(fabrics.metaTitleEn, ''),
              isNull(fabrics.metaDescriptionEn),
              eq(fabrics.metaDescriptionEn, ''),
              isNull(fabrics.imageAltEn),
              eq(fabrics.imageAltEn, '')
            )
          )
        )
    ])

    const total = totalRows[0]?.c ?? 0
    const missingMeta = missingRows[0]?.c ?? 0
    const complete = Math.max(0, total - missingMeta)
    const healthScorePercent = total === 0 ? 100 : Math.round((complete / total) * 1000) / 10

    return {
      healthScorePercent,
      missingMetaCount: missingMeta,
      totalFabrics: total
    }
  }

  public static async list(query: AdminBulkSeoQuery): Promise<{ data: AdminBulkSeoListResponse; total: number }> {
    const db = getDb()
    const offset = (query.page - 1) * query.limit

    const baseWhere = and(isNull(fabrics.deletedAt))

    const searchWhere = query.q
      ? or(
          ilike(fabrics.titleRu, `%${query.q}%`),
          ilike(fabrics.slug, `%${query.q}%`),
          ilike(sql`coalesce(${fabrics.sku}, '')`, `%${query.q}%`)
        )
      : undefined

    const missingWhere =
      query.missing === 'meta_title'
        ? or(or(isNull(fabrics.metaTitleRu), eq(fabrics.metaTitleRu, '')), or(isNull(fabrics.metaTitleEn), eq(fabrics.metaTitleEn, '')))
        : query.missing === 'meta_description'
          ? or(or(isNull(fabrics.metaDescriptionRu), eq(fabrics.metaDescriptionRu, '')), or(isNull(fabrics.metaDescriptionEn), eq(fabrics.metaDescriptionEn, '')))
          : query.missing === 'image_alt'
            ? or(or(isNull(fabrics.imageAltRu), eq(fabrics.imageAltRu, '')), or(isNull(fabrics.imageAltEn), eq(fabrics.imageAltEn, '')))
            : query.missing === 'meta_title_en'
              ? or(isNull(fabrics.metaTitleEn), eq(fabrics.metaTitleEn, ''))
              : query.missing === 'meta_description_en'
                ? or(isNull(fabrics.metaDescriptionEn), eq(fabrics.metaDescriptionEn, ''))
                : query.missing === 'image_alt_en'
                  ? or(isNull(fabrics.imageAltEn), eq(fabrics.imageAltEn, ''))
                  : undefined

    const where = and(baseWhere, searchWhere, missingWhere)

    const totalRows = await db.select({ total: count() }).from(fabrics).where(where)
    const total = totalRows[0]?.total ?? 0

    const rows = await db
      .select({
        id: fabrics.id,
        slug: fabrics.slug,
        sku: fabrics.sku,
        titleRu: fabrics.titleRu,
        supplierName: suppliers.name,
        images: fabrics.images,
        metaTitleRu: fabrics.metaTitleRu,
        metaDescriptionRu: fabrics.metaDescriptionRu,
        imageAltRu: fabrics.imageAltRu,
        metaTitleEn: fabrics.metaTitleEn,
        metaDescriptionEn: fabrics.metaDescriptionEn,
        imageAltEn: fabrics.imageAltEn
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(where)
      .orderBy(desc(fabrics.updatedAt))
      .limit(query.limit)
      .offset(offset)

    return {
      total,
      data: {
        items: rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          sku: r.sku ?? null,
          titleRu: r.titleRu,
          supplierName: r.supplierName,
          imageUrl: firstImageUrl(r.images ?? null),
          metaTitleRu: r.metaTitleRu ?? null,
          metaDescriptionRu: r.metaDescriptionRu ?? null,
          imageAltRu: r.imageAltRu ?? null,
          metaTitleEn: r.metaTitleEn ?? null,
          metaDescriptionEn: r.metaDescriptionEn ?? null,
          imageAltEn: r.imageAltEn ?? null
        }))
      }
    }
  }

  public static async bulkUpdate(updates: AdminBulkSeoUpdateItem[]): Promise<void> {
    const db = getDb()

    await db.transaction(async (tx) => {
      for (const u of updates) {
        await tx
          .update(fabrics)
          .set({
            metaTitleRu: u.metaTitleRu,
            metaDescriptionRu: u.metaDescriptionRu,
            imageAltRu: u.imageAltRu,
            metaTitleEn: u.metaTitleEn,
            metaDescriptionEn: u.metaDescriptionEn,
            imageAltEn: u.imageAltEn,
            updatedAt: new Date()
          })
          .where(and(eq(fabrics.id, u.id), isNull(fabrics.deletedAt)))
      }
    })
  }
}

