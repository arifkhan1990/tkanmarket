import { and, count, desc, eq, ilike, inArray, isNull, ne, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type {
  AdminInventoryFabricRow,
  AdminInventoryFabricsListResponse,
  InventoryFabricStatusUi
} from '@/types/admin-inventory-insights.types'

function fabricStatusUi(
  status: (typeof fabrics.$inferSelect)['status'],
  moq: number | null,
  views: number
): InventoryFabricStatusUi {
  if (status === 'approved') {
    if (moq !== null && moq < 40 && views < 20) return 'Watchlist'
    return 'Healthy'
  }
  if (status === 'ai_processed') return 'Urgent'
  if (status === 'raw_scraped') return 'Critical'
  if (status === 'ai_processing') return 'Stable'
  if (status === 'rejected') return 'Reorder'
  return 'Optimal'
}

export class AdminInventoryFabricsListService {
  public static async list(params: {
    page: number
    limit: number
    q: string | undefined
  }): Promise<AdminInventoryFabricsListResponse> {
    const db = getDb()
    const offset = (params.page - 1) * params.limit
    const q = params.q?.trim()
    const searchFilter =
      q && q.length > 0
        ? or(ilike(fabrics.sku, `%${q}%`), ilike(fabrics.titleEn, `%${q}%`), ilike(fabrics.titleRu, `%${q}%`))
        : undefined
    const base = and(isNull(fabrics.deletedAt), ne(fabrics.status, 'rejected'), searchFilter)

    const [totalRow] = await db.select({ c: count() }).from(fabrics).where(base)
    const total = totalRow?.c ?? 0

    const rows = await db
      .select({
        id: fabrics.id,
        sku: fabrics.sku,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        status: fabrics.status,
        moq: fabrics.moq,
        viewsCount: fabrics.viewsCount,
        images: fabrics.images,
        supplierCity: suppliers.city,
        supplierCountry: suppliers.country,
        socialScore: fabrics.socialScore
      })
      .from(fabrics)
      .innerJoin(suppliers, eq(fabrics.supplierId, suppliers.id))
      .where(base)
      .orderBy(desc(fabrics.updatedAt))
      .limit(params.limit)
      .offset(offset)

    const fabricIds = rows.map((r) => r.id)
    const catMap = new Map<number, string>()
    if (fabricIds.length > 0) {
      const cats = await db
        .select({
          fabricId: fabricCategories.fabricId,
          slug: fabricCategories.categorySlug
        })
        .from(fabricCategories)
        .where(and(isNull(fabricCategories.deletedAt), inArray(fabricCategories.fabricId, fabricIds)))
      for (const c of cats) {
        if (!catMap.has(c.fabricId)) catMap.set(c.fabricId, c.slug)
      }
    }

    const items: AdminInventoryFabricRow[] = rows.map((r) => {
      const title = r.titleEn ?? r.titleRu
      const cat = catMap.get(r.id) ?? 'uncategorized'
      const st = fabricStatusUi(r.status, r.moq, r.viewsCount)
      const img = r.images?.[0] ?? null
      const fill =
        r.moq != null
          ? Math.min(100, Math.round((r.viewsCount / Math.max(r.moq, 1)) * 40))
          : Math.min(100, Math.round(r.viewsCount / 10))
      return {
        id: r.id,
        sku: r.sku,
        title,
        categoryLabel: cat.replace(/-/g, ' '),
        stockLevelNote: `${r.viewsCount.toLocaleString()} views`,
        thresholdNote: r.moq != null ? `MOQ ${r.moq}` : '—',
        leadTimeNote: '—',
        status: st,
        imageUrl: img,
        warehouseNote:
          r.supplierCity || r.supplierCountry
            ? [r.supplierCity, r.supplierCountry].filter(Boolean).join(', ')
            : null,
        turnoverNote: r.socialScore != null ? `${(r.socialScore / 10).toFixed(1)}x` : '—',
        thresholdFillPercent: fill
      }
    })

    return { items, total }
  }
}
