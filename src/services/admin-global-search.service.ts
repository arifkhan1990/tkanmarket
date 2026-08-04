import { and, count, desc, ilike, isNull, or } from 'drizzle-orm'

import { getDb } from '@/db'
import { fabricCategories, fabrics } from '@/db/schema/fabrics.schema'
import { leads } from '@/db/schema/leads.schema'
import { suppliers } from '@/db/schema/suppliers.schema'
import type { AdminGlobalSearchResponse } from '@/types/admin-global-search.types'

const LIMIT_EACH = 5
const TRENDING_LIMIT = 8

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const w = parts[0]
    return w ? w.slice(0, 2).toUpperCase() : '?'
  }
  const first = parts[0]
  const last = parts[parts.length - 1]
  const a = first?.[0] ?? ''
  const b = last?.[0] ?? ''
  return `${a}${b}`.toUpperCase() || '?'
}

export class AdminGlobalSearchService {
  public static async search(q: string): Promise<AdminGlobalSearchResponse> {
    const db = getDb()
    const term = q.trim()
    const pattern = `%${term}%`

    const trendingCategories = await db
      .select({
        slug: fabricCategories.categorySlug,
        count: count()
      })
      .from(fabricCategories)
      .where(isNull(fabricCategories.deletedAt))
      .groupBy(fabricCategories.categorySlug)
      .orderBy(desc(count()))
      .limit(TRENDING_LIMIT)

    const trending: AdminGlobalSearchResponse['trendingCategories'] = trendingCategories.map((row) => ({
      slug: row.slug,
      label: row.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count: Number(row.count)
    }))

    if (term.length < 2) {
      return { fabrics: [], suppliers: [], leads: [], trendingCategories: trending }
    }

    const fabricWhere = and(
      isNull(fabrics.deletedAt),
      or(
        ilike(fabrics.titleEn, pattern),
        ilike(fabrics.titleRu, pattern),
        ilike(fabrics.sku, pattern)
      )
    )

    const fabricRows = await db
      .select({
        id: fabrics.id,
        titleEn: fabrics.titleEn,
        titleRu: fabrics.titleRu,
        sku: fabrics.sku,
        images: fabrics.images,
        slug: fabrics.slug
      })
      .from(fabrics)
      .where(fabricWhere)
      .orderBy(desc(fabrics.updatedAt))
      .limit(LIMIT_EACH)

    const supplierRows = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        verified: suppliers.verified
      })
      .from(suppliers)
      .where(and(isNull(suppliers.deletedAt), ilike(suppliers.name, pattern)))
      .orderBy(desc(suppliers.updatedAt))
      .limit(LIMIT_EACH)

    const leadRows = await db
      .select({
        id: leads.id,
        contactName: leads.contactName,
        companyName: leads.companyName
      })
      .from(leads)
      .where(
        and(
          isNull(leads.deletedAt),
          or(ilike(leads.contactName, pattern), ilike(leads.companyName, pattern), ilike(leads.email, pattern))
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(LIMIT_EACH)

    return {
      trendingCategories: trending,
      fabrics: fabricRows.map((f) => ({
        id: f.id,
        title: (f.titleEn ?? f.titleRu ?? '').trim() || 'Fabric',
        sku: f.sku ?? null,
        imageUrl: f.images?.[0] ?? null,
        slug: f.slug
      })),
      suppliers: supplierRows.map((s) => ({
        id: s.id,
        name: s.name,
        verified: s.verified,
        initials: initialsFromName(s.name)
      })),
      leads: leadRows.map((l) => ({
        id: l.id,
        contactName: l.contactName,
        companyName: l.companyName,
        title: `${l.contactName} — ${l.companyName}`
      }))
    }
  }
}
